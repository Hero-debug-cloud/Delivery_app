#!/usr/bin/env bash
# ============================================================
# LogiRoute — Telemetry Ingestion & WebSocket Smoke Tests
# Usage: ./scripts/smoke-test-telemetry.sh [BASE_URL]
# ============================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"
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
echo -e "${CYAN}║  LogiRoute — Telemetry & Tracking Tests  ║${RESET}"
echo -e "${CYAN}║  Target: ${BASE_URL}${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"

# Driver Phone for Telemetry Test
DRIVER_PHONE="+919876500123"

# 0. Cleanup Database from prior runs
docker exec -i logiroute-db-dev psql -U postgres -d logiroute -c "DELETE FROM users WHERE phone = '$DRIVER_PHONE';" > /dev/null 2>&1

# 1. Request OTP for Driver
log_section "1. Request OTP for Driver"
RESP=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/otp/request" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$DRIVER_PHONE\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "OTP requested successfully → 200"
else
  log_fail "OTP request failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 2. Retrieve OTP from Redis
log_section "2. Retrieve OTP from Redis Container"
OTP_CODE=$(docker exec logiroute-redis-dev redis-cli get "otp:$DRIVER_PHONE" | tr -d '\r\n')
if [ -n "$OTP_CODE" ] && [ "$OTP_CODE" != "nil" ]; then
  log_pass "Successfully retrieved OTP code: $OTP_CODE"
else
  log_fail "Failed to retrieve OTP code from Redis" "Redis returned: $OTP_CODE"
  exit 1
fi

# 3. Verify OTP -> Auto-creates Pending Driver Profile
log_section "3. Verify OTP & Log In Driver"
RESP=$(curl -s -c "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$DRIVER_PHONE\",\"otp\":\"$OTP_CODE\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver authenticated successfully → 200"
else
  log_fail "Driver login failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# Extract driver UUID
DRIVER_ID=$(echo "$BODY" | jq -r '.user.driverProfile.id')
log_pass "Extracted Driver ID: $DRIVER_ID"

# 4. Admin Login
log_section "4. Admin Login"
RESP=$(curl -s -c "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@gmail.com","password":"Herovinay1@"}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Admin authenticated successfully → 200"
else
  log_fail "Admin login failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# Get first store ID
STORE_ID=$(docker exec -i logiroute-db-dev psql -U postgres -d logiroute -t -A -c "SELECT id FROM stores LIMIT 1;")
log_pass "Store ID resolved: $STORE_ID"

# 5. Set Driver Status to ONLINE
log_section "5. Set Driver Status to ONLINE"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X PATCH "${BASE_URL}/delivery-partners/me/status" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"online\",\"storeId\":\"$STORE_ID\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver status transitioned to online → 200"
else
  log_fail "Failed to go online" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 6. Post Coordinate Telemetry (Ping 1)
log_section "6. Send Telemetry Location Ping 1"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/locations/ping" \
  -H "Content-Type: application/json" \
  -d '{"latitude":12.9716,"longitude":77.5946,"speed":22.4,"battery":95}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Telemetry Ping 1 posted successfully → 200"
  LAT=$(echo "$BODY" | jq -r '.data.lat')
  LNG=$(echo "$BODY" | jq -r '.data.lng')
  if [ "$LAT" = "12.9716" ] && [ "$LNG" = "77.5946" ]; then
    log_pass "Coordinates matched Ping 1 payload: ($LAT, $LNG)"
  else
    log_fail "Coordinates mismatch in Ping 1 response" "$BODY"
  fi
else
  log_fail "Telemetry Ping 1 failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 7. Post Coordinate Telemetry (Ping 2 - Moving driver)
log_section "7. Send Telemetry Location Ping 2"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/locations/ping" \
  -H "Content-Type: application/json" \
  -d '{"latitude":12.9800,"longitude":77.6000,"speed":32.1,"battery":94}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Telemetry Ping 2 posted successfully → 200"
  LAT=$(echo "$BODY" | jq -r '.data.lat')
  LNG=$(echo "$BODY" | jq -r '.data.lng')
  if [ "$LAT" = "12.98" ] && [ "$LNG" = "77.6" ]; then
    log_pass "Coordinates matched Ping 2 payload: ($LAT, $LNG)"
  else
    log_fail "Coordinates mismatch in Ping 2 response" "$BODY"
  fi
else
  log_fail "Telemetry Ping 2 failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 8. Query Active Fleet as Admin (via new /locations/live endpoint)
log_section "8. Admin Fetches Online Fleet via /locations/live"
RESP=$(curl -s -b "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/locations/live")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Admin online fleet fetched successfully from /locations/live → 200"
  COUNT=$(echo "$BODY" | jq -r '.count')
  log_pass "Online drivers count: $COUNT"
  
  # Search for our driver in response
  FOUND_DRIVER=$(echo "$BODY" | jq --arg id "$DRIVER_ID" '.data[] | select(.id == $id)')
  if [ -n "$FOUND_DRIVER" ]; then
    log_pass "Driver ID $DRIVER_ID found in online tracking list"
    FINAL_LAT=$(echo "$FOUND_DRIVER" | jq -r '.lat')
    FINAL_LNG=$(echo "$FOUND_DRIVER" | jq -r '.lng')
    FINAL_SPEED=$(echo "$FOUND_DRIVER" | jq -r '.speed')
    FINAL_BATTERY=$(echo "$FOUND_DRIVER" | jq -r '.battery')
    
    if [ "$FINAL_LAT" = "12.98" ] && [ "$FINAL_LNG" = "77.6" ] && [ "$FINAL_SPEED" = "32.1 km/h" ] && [ "$FINAL_BATTERY" = "94" ]; then
      log_pass "Telemetry properties matched perfectly in admin view"
    else
      log_fail "Telemetry properties mismatch in admin view" "$FOUND_DRIVER"
    fi
  else
    log_fail "Driver ID $DRIVER_ID not found in active fleet" "$BODY"
  fi
else
  log_fail "Failed to fetch online fleet as admin" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 8b. Verify Asynchronous Database Logging in location_pings
log_section "8b. Verify DB location_pings Database Insertion"
# Sleep briefly to ensure async DB insert has completed
sleep 0.5
DB_PING_COUNT=$(docker exec -i logiroute-db-dev psql -U postgres -d logiroute -t -A -c "SELECT COUNT(*) FROM location_pings WHERE delivery_partner_id = '$DRIVER_ID';")
if [ "$DB_PING_COUNT" -gt 0 ]; then
  log_pass "Successfully verified $DB_PING_COUNT location ping(s) recorded in Postgres database"
else
  log_fail "No location pings found in database for driver $DRIVER_ID" "DB Count: $DB_PING_COUNT"
  exit 1
fi

# 9. Set Driver Status to OFFLINE
log_section "9. Set Driver Status to OFFLINE"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X PATCH "${BASE_URL}/delivery-partners/me/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"offline","storeId":null}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver status transitioned to offline successfully → 200"
else
  log_fail "Failed to go offline" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 10. Query Active Fleet again to verify removal (checking both /locations/live and /locations/online alias)
log_section "10. Verify Driver Removed from Online Fleet"
RESP=$(curl -s -b "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/locations/live")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Admin online fleet fetched successfully from /locations/live → 200"
  FOUND_DRIVER=$(echo "$BODY" | jq --arg id "$DRIVER_ID" '.data[] | select(.id == $id)')
  if [ -z "$FOUND_DRIVER" ]; then
    log_pass "Driver ID $DRIVER_ID was successfully removed from the /locations/live online fleet list"
  else
    log_fail "Driver ID $DRIVER_ID should have been removed from the active fleet" "$BODY"
    exit 1
  fi
else
  log_fail "Final online fleet fetch (/locations/live) failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# Also verify the deprecated /locations/online compatibility fallback alias
RESP_ALIAS=$(curl -s -b "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/locations/online")
HTTP_CODE_ALIAS=$(echo "$RESP_ALIAS" | tail -n1)
BODY_ALIAS=$(echo "$RESP_ALIAS" | sed '$d')

if [ "$HTTP_CODE_ALIAS" = "200" ]; then
  log_pass "Admin online fleet fetched successfully from /locations/online fallback alias → 200"
  FOUND_DRIVER_ALIAS=$(echo "$BODY_ALIAS" | jq --arg id "$DRIVER_ID" '.data[] | select(.id == $id)')
  if [ -z "$FOUND_DRIVER_ALIAS" ]; then
    log_pass "Driver ID $DRIVER_ID was also successfully verified absent in /locations/online alias list"
  else
    log_fail "Driver ID $DRIVER_ID should have been removed from the fallback active fleet" "$BODY_ALIAS"
    exit 1
  fi
else
  log_fail "Final online fleet fetch (/locations/online fallback alias) failed" "HTTP_CODE_ALIAS $HTTP_CODE_ALIAS — $BODY_ALIAS"
  exit 1
fi

# 11. Cleanup database
log_section "11. Cleanup Database"
rm -f "$DRIVER_COOKIE_JAR" "$ADMIN_COOKIE_JAR"
docker exec -i logiroute-db-dev psql -U postgres -d logiroute -c "DELETE FROM users WHERE phone = '$DRIVER_PHONE';" > /dev/null 2>&1
log_pass "Deleted test driver successfully"

# Summary
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  Driver Telemetry Smoke Test Results     ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"
echo -e "  ${GREEN}PASS: $PASS${RESET}"
echo -e "  ${RED}FAIL: $FAIL${RESET}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}❌ Smoke tests FAILED ($FAIL failures)${RESET}"
  exit 1
else
  echo -e "${GREEN}✅ All driver telemetry smoke tests PASSED${RESET}"
  exit 0
fi
