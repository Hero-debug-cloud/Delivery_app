#!/usr/bin/env bash
# ============================================================
# LogiRoute — Customer Ordering & Driver Dispatch Smoke Tests
# Usage: ./scripts/smoke-test-orders.sh [BASE_URL]
# ============================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"
CUSTOMER_COOKIE_JAR=$(mktemp)
DRIVER_COOKIE_JAR=$(mktemp)
ADMIN_COOKIE_JAR=$(mktemp)
PASS=0
FAIL=0

# Color codes
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
RESET="\033[0m"

log_pass() { echo -e "${GREEN}✔ PASS${RESET} — $1"; PASS=$((PASS + 1)); }
log_fail() { echo -e "${RED}✖ FAIL${RESET} — $1"; echo -e "  ${YELLOW}Response:${RESET} $2"; FAIL=$((FAIL + 1)); }
log_section() { echo -e "\n${CYAN}▶ $1${RESET}"; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  LogiRoute — Customer & Dispatch Tests   ║${RESET}"
echo -e "${CYAN}║  Target: ${BASE_URL}${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"

# Test phone numbers
CUSTOMER_PHONE="+919999900111"
DRIVER_PHONE="+919888800222"

# 0. Cleanup Database from prior runs
log_section "0. Database Cleanup"
docker exec -i logiroute-db-dev psql -U postgres -d logiroute -c "DELETE FROM users WHERE phone IN ('$CUSTOMER_PHONE', '$DRIVER_PHONE');" > /dev/null 2>&1
log_pass "Cleaned up prior smoke test users if any exist"

# 1. Register & Login Customer
log_section "1. Register & Login Customer"
# Request OTP
RESP=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/otp/request" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$CUSTOMER_PHONE\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Customer OTP requested"
else
  log_fail "Customer OTP request failed" "$HTTP_CODE"
  exit 1
fi

# Fetch OTP from Redis
CUSTOMER_OTP=$(docker exec logiroute-redis-dev redis-cli get "otp:$CUSTOMER_PHONE" | tr -d '\r\n')
log_pass "Retrieved customer OTP from Redis: $CUSTOMER_OTP"

# Verify OTP
RESP=$(curl -s -c "$CUSTOMER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$CUSTOMER_PHONE\",\"otp\":\"$CUSTOMER_OTP\",\"role\":\"customer\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Customer logged in successfully"
else
  log_fail "Customer login failed" "$HTTP_CODE"
  exit 1
fi

# 2. Register & Login Driver
log_section "2. Register & Login Driver"
# Request OTP
RESP=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/otp/request" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$DRIVER_PHONE\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver OTP requested"
else
  log_fail "Driver OTP request failed" "$HTTP_CODE"
  exit 1
fi

# Fetch OTP from Redis
DRIVER_OTP=$(docker exec logiroute-redis-dev redis-cli get "otp:$DRIVER_PHONE" | tr -d '\r\n')
log_pass "Retrieved driver OTP from Redis: $DRIVER_OTP"

# Verify OTP
RESP=$(curl -s -c "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$DRIVER_PHONE\",\"otp\":\"$DRIVER_OTP\",\"role\":\"delivery_partner\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver logged in successfully"
else
  log_fail "Driver login failed" "$HTTP_CODE - $BODY"
  exit 1
fi

# Extract Driver Partner ID from Profile
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/delivery-partners/me/profile")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  DRIVER_ID=$(echo "$BODY" | jq -r '.profile.id')
  log_pass "Retrieved driver profile ID: $DRIVER_ID"
else
  log_fail "Failed to retrieve driver profile" "$HTTP_CODE - $BODY"
  exit 1
fi

# 3. Approve Driver & Login Admin
log_section "3. Login Admin & Approve Driver"
RESP=$(curl -s -c "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@gmail.com","password":"Herovinay1@"}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Admin logged in successfully"
else
  log_fail "Admin login failed" "$HTTP_CODE"
  exit 1
fi

# Approve Driver
RESP=$(curl -s -b "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/delivery-partners/${DRIVER_ID}/approve")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver approved by Admin successfully"
else
  log_fail "Driver approval failed" "$HTTP_CODE"
  exit 1
fi

# 4. Resolve Store and Products
log_section "4. Resolve Store and Products"
PRODUCT_ROW=$(docker exec -i logiroute-db-dev psql -U postgres -d logiroute -t -A -F ',' -c "SELECT store_id, id FROM products LIMIT 1;")
STORE_ID=$(echo "$PRODUCT_ROW" | cut -d',' -f1)
PRODUCT_ID=$(echo "$PRODUCT_ROW" | cut -d',' -f2)
STORE_COORDS=$(docker exec -i logiroute-db-dev psql -U postgres -d logiroute -t -A -F ',' -c "SELECT latitude, longitude FROM stores WHERE id = '$STORE_ID';")
STORE_LAT=$(echo "$STORE_COORDS" | cut -d',' -f1)
STORE_LNG=$(echo "$STORE_COORDS" | cut -d',' -f2)
log_pass "Resolved Store ID: $STORE_ID (Lat: $STORE_LAT, Lng: $STORE_LNG)"
log_pass "Resolved Product ID: $PRODUCT_ID"

# 5. Set Driver Online & telemetry ping
log_section "5. Set Driver Online & Telemetry Ping"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X PATCH "${BASE_URL}/delivery-partners/me/status" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"online\",\"storeId\":\"$STORE_ID\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver status is set to online"
else
  log_fail "Failed to go online" "$HTTP_CODE"
  exit 1
fi

RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/locations/ping" \
  -H "Content-Type: application/json" \
  -d "{\"latitude\":12.935,\"longitude\":77.625,\"speed\":0.0,\"battery\":100}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver telemetry location ping registered"
else
  log_fail "Failed to ping driver location" "$HTTP_CODE"
  exit 1
fi

# 6. Create Customer Saved Address
log_section "6. Create Customer Saved Address"
RESP=$(curl -s -b "$CUSTOMER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/customer/addresses" \
  -H "Content-Type: application/json" \
  -d "{\"label\":\"Smoke Home\",\"address\":\"7th Cross Road, Bengaluru\",\"latitude\":12.936,\"longitude\":77.626,\"isDefault\":true}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "201" ]; then
  ADDRESS_ID=$(echo "$BODY" | jq -r '.data.id')
  log_pass "Saved Address created: $ADDRESS_ID"
else
  log_fail "Failed to create saved address" "$HTTP_CODE - $BODY"
  exit 1
fi

# 7. Place Customer Order (Idempotent)
log_section "7. Place Customer Order (Idempotence check)"
EXTERNAL_ORDER_ID="ext-order-$(date +%s)"

# Request 1
RESP=$(curl -s -b "$CUSTOMER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/orders" \
  -H "Content-Type: application/json" \
  -d "{\"storeId\":\"$STORE_ID\",\"addressId\":\"$ADDRESS_ID\",\"paymentType\":\"prepaid\",\"externalOrderId\":\"$EXTERNAL_ORDER_ID\",\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}]}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "201" ]; then
  ORDER_ID=$(echo "$BODY" | jq -r '.data.id')
  PROOF_PIN=$(echo "$BODY" | jq -r '.data.proofPin')
  TRACKING_TOKEN=$(echo "$BODY" | jq -r '.data.trackingToken')
  log_pass "Order created successfully (Order ID: $ORDER_ID, Pin: $PROOF_PIN, Tracking Token: $TRACKING_TOKEN)"
else
  log_fail "Failed to create order" "$HTTP_CODE - $BODY"
  exit 1
fi

# Request 2 (Idempotency Key duplicate hit)
RESP_DUP=$(curl -s -b "$CUSTOMER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/orders" \
  -H "Content-Type: application/json" \
  -d "{\"storeId\":\"$STORE_ID\",\"addressId\":\"$ADDRESS_ID\",\"paymentType\":\"prepaid\",\"externalOrderId\":\"$EXTERNAL_ORDER_ID\",\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}]}")
HTTP_CODE_DUP=$(echo "$RESP_DUP" | tail -n1)
BODY_DUP=$(echo "$RESP_DUP" | sed '$d')
if [ "$HTTP_CODE_DUP" = "200" ] || [ "$HTTP_CODE_DUP" = "201" ]; then
  ORDER_ID_DUP=$(echo "$BODY_DUP" | jq -r '.data.id')
  if [ "$ORDER_ID" = "$ORDER_ID_DUP" ]; then
    log_pass "Idempotency check PASSED: duplicate request returned same order ID: $ORDER_ID_DUP"
  else
    log_fail "Idempotency check failed: order ID mismatch" "Order 1: $ORDER_ID, Order 2: $ORDER_ID_DUP"
    exit 1
  fi
else
  log_fail "Idempotency duplicate request failed" "$HTTP_CODE_DUP - $BODY_DUP"
  exit 1
fi

# 8. Check Driver Broadcasts
log_section "8. Check Driver Broadcasts"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/orders/broadcasts")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  FOUND_ORDER=$(echo "$BODY" | jq --arg id "$ORDER_ID" '.data[] | select(.id == $id)')
  if [ -n "$FOUND_ORDER" ]; then
    log_pass "Order $ORDER_ID found in Driver Broadcasts list"
  else
    log_fail "Order $ORDER_ID not found in Driver Broadcasts list" "$BODY"
    exit 1
  fi
else
  log_fail "Failed to retrieve broadcasts" "$HTTP_CODE - $BODY"
  exit 1
fi

# 9. Driver Ignores the Broadcast & Verifies removal
log_section "9. Driver Ignores the Broadcast"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" -X POST "${BASE_URL}/orders/${ORDER_ID}/ignore")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver successfully ignored the order broadcast"
else
  log_fail "Ignore order request failed" "$HTTP_CODE"
  exit 1
fi

# Re-check Driver Broadcasts (should not be in there now)
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/orders/broadcasts")
BODY=$(echo "$RESP" | sed '$d')
FOUND_ORDER=$(echo "$BODY" | jq --arg id "$ORDER_ID" '.data[] | select(.id == $id)')
if [ -z "$FOUND_ORDER" ]; then
  log_pass "Verified: Order $ORDER_ID is no longer in Driver Broadcasts"
else
  log_fail "Order $ORDER_ID should have been excluded from Driver Broadcasts" "$BODY"
  exit 1
fi

# 10. Verify Admin panel detects "ignoredByAll"
log_section "10. Admin panel detects Ignored By All"
RESP=$(curl -s -b "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/orders")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  ADMIN_ORDER=$(echo "$BODY" | jq --arg id "$ORDER_ID" '.data[] | select(.id == $id)')
  if [ -n "$ADMIN_ORDER" ]; then
    IGNORED_BY_ALL=$(echo "$ADMIN_ORDER" | jq -r '.ignoredByAll')
    if [ "$IGNORED_BY_ALL" = "true" ]; then
      log_pass "Admin order queue marked 'ignoredByAll: true' correctly"
    else
      log_fail "Order 'ignoredByAll' should be true" "$ADMIN_ORDER"
      exit 1
    fi
  else
    log_fail "Order not found in admin queue" "$BODY"
    exit 1
  fi
else
  log_fail "Failed to fetch admin orders queue" "$HTTP_CODE"
  exit 1
fi

# 11. Admin Manual Override Assignment
log_section "11. Admin Manual Override Assignment"
RESP=$(curl -s -b "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/orders/${ORDER_ID}/assign" \
  -H "Content-Type: application/json" \
  -d "{\"driverId\":\"$DRIVER_ID\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Admin manually assigned driver to order successfully"
else
  log_fail "Manual driver assignment failed" "$HTTP_CODE - $BODY"
  exit 1
fi

# 12. Driver active job check
log_section "12. Driver Active Delivery Check"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/orders/active")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  ACTIVE_ID=$(echo "$BODY" | jq -r '.data.id')
  if [ "$ACTIVE_ID" = "$ORDER_ID" ]; then
    log_pass "Driver has active job matching order ID: $ACTIVE_ID"
  else
    log_fail "Active job order ID mismatch" "Expected $ORDER_ID, got $ACTIVE_ID"
    exit 1
  fi
else
  log_fail "Failed to check active job" "$HTTP_CODE"
  exit 1
fi

# 13. Progress Milestones E2E
log_section "13. Progress Milestones E2E"

# 13a. Reached Store
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/orders/${ORDER_ID}/reached-store" \
  -H "Content-Type: application/json" \
  -d "{\"latitude\":$STORE_LAT,\"longitude\":$STORE_LNG}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Milestone reached: Reached Store"
else
  log_fail "Failed to transition to Reached Store" "$HTTP_CODE"
  exit 1
fi

# 13b. Picked Up
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" -X POST "${BASE_URL}/orders/${ORDER_ID}/picked-up")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Milestone reached: Picked Up"
else
  log_fail "Failed to transition to Picked Up" "$HTTP_CODE"
  exit 1
fi

# 13c. Out For Delivery
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" -X POST "${BASE_URL}/orders/${ORDER_ID}/out-for-delivery")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Milestone reached: Out For Delivery"
else
  log_fail "Failed to transition to Out For Delivery" "$HTTP_CODE"
  exit 1
fi

# 13d. Reached Location
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/orders/${ORDER_ID}/reached-location" \
  -H "Content-Type: application/json" \
  -d "{\"latitude\":12.936,\"longitude\":77.626}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Milestone reached: Reached Customer Location"
else
  log_fail "Failed to transition to Reached Location" "$HTTP_CODE"
  exit 1
fi

# 14. Verify Public Order Tracking endpoint
log_section "14. Verify Public Order Tracking details"
RESP=$(curl -s -w "\n%{http_code}" "${BASE_URL}/track/${TRACKING_TOKEN}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  TRACK_STATUS=$(echo "$BODY" | jq -r '.data.status')
  EVENT_COUNT=$(echo "$BODY" | jq '.data.events | length')
  log_pass "Public tracking status is: $TRACK_STATUS (Events logged: $EVENT_COUNT)"
  if [ "$TRACK_STATUS" = "in_transit" ]; then
    log_pass "Status matches expected in_transit step"
  else
    log_fail "Tracking status should be in_transit" "$TRACK_STATUS"
    exit 1
  fi
else
  log_fail "Public tracking fetch failed" "$HTTP_CODE"
  exit 1
fi

# 15. Final PIN Validation Dropoff
log_section "15. Final PIN Validation dropoff complete"
# Invalid PIN test
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/orders/${ORDER_ID}/complete" \
  -H "Content-Type: application/json" \
  -d "{\"pin\":\"0000\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
if [ "$HTTP_CODE" = "400" ]; then
  log_pass "Invalid PIN submission returned 400 Bad Request successfully"
else
  log_fail "Invalid PIN should fail with 400" "$HTTP_CODE"
  exit 1
fi

# Correct PIN test
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/orders/${ORDER_ID}/complete" \
  -H "Content-Type: application/json" \
  -d "{\"pin\":\"$PROOF_PIN\",\"deliveryProofImageKey\":\"smoke_proof_photo_key\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Correct PIN verified! Order marked as Delivered successfully"
else
  log_fail "PIN verification failed with correct code" "$HTTP_CODE - $BODY"
  exit 1
fi

# 16. Verify final delivered status
log_section "16. Verify Final Delivered Status"
RESP=$(curl -s -b "$CUSTOMER_COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/orders/customer/${ORDER_ID}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  FINAL_STATUS=$(echo "$BODY" | jq -r '.data.status')
  if [ "$FINAL_STATUS" = "delivered" ]; then
    log_pass "Customer orders history confirms order status is 'delivered'"
  else
    log_fail "Final order status should be delivered" "$FINAL_STATUS"
    exit 1
  fi
else
  log_fail "Failed to verify final order status" "$HTTP_CODE"
  exit 1
fi

# 17. Cleanup & db purge
log_section "17. Cleanup test databases"
rm -f "$CUSTOMER_COOKIE_JAR" "$DRIVER_COOKIE_JAR" "$ADMIN_COOKIE_JAR"
docker exec -i logiroute-db-dev psql -U postgres -d logiroute -c "DELETE FROM users WHERE phone IN ('$CUSTOMER_PHONE', '$DRIVER_PHONE');" > /dev/null 2>&1
log_pass "All test data successfully purged"

# Results
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  Order Dispatch Smoke Test Results       ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"
echo -e "  ${GREEN}PASS: $PASS${RESET}"
echo -e "  ${RED}FAIL: $FAIL${RESET}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}❌ Smoke tests FAILED ($FAIL failures)${RESET}"
  exit 1
else
  echo -e "${GREEN}✅ All E2E customer order / driver dispatch tests PASSED${RESET}"
  exit 0
fi
