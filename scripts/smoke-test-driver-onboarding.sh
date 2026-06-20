#!/usr/bin/env bash
# ============================================================
# LogiRoute — Driver Onboarding Smoke Tests
# Usage: ./scripts/smoke-test-driver-onboarding.sh [BASE_URL]
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
echo -e "${CYAN}║  LogiRoute — Driver Onboarding Tests     ║${RESET}"
echo -e "${CYAN}║  Target: ${BASE_URL}${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"

# Driver Phone for Onboarding Test
DRIVER_PHONE="+919876500123"

# -----------------------------------------------------------
# 1. Request OTP for New Driver Phone
# -----------------------------------------------------------
log_section "1. Request OTP for New Driver"
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

# -----------------------------------------------------------
# 2. Get OTP from Redis
# -----------------------------------------------------------
log_section "2. Retrieve OTP from Redis Container"
OTP_CODE=$(docker exec logiroute-redis-dev redis-cli get "otp:$DRIVER_PHONE" | tr -d '\r\n')
if [ -n "$OTP_CODE" ] && [ "$OTP_CODE" != "nil" ]; then
  log_pass "Successfully retrieved OTP code: $OTP_CODE"
else
  log_fail "Failed to retrieve OTP code from Redis" "Redis returned: $OTP_CODE"
  exit 1
fi

# -----------------------------------------------------------
# 3. Verify OTP -> Auto-creates Pending Driver Profile
# -----------------------------------------------------------
log_section "3. Verify OTP & Auto-Register Driver"
RESP=$(curl -s -c "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$DRIVER_PHONE\",\"otp\":\"$OTP_CODE\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "OTP verified and user session created → 200"
  
  ROLE=$(echo "$BODY" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
  if [ "$ROLE" = "delivery_partner" ]; then
    log_pass "Registered user has delivery_partner role"
  else
    log_fail "User role should be delivery_partner" "$BODY"
  fi
else
  log_fail "OTP verification failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# 4. Check Auth / GET Me -> Verify Driver Profile Pending
# -----------------------------------------------------------
log_section "4. Check Driver Profile State (Pending)"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/auth/me")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  STATUS=$(echo "$BODY" | grep -o '"onboardingStatus":"[^"]*"' | cut -d'"' -f4)
  if [ "$STATUS" = "pending" ]; then
    log_pass "Driver onboarding status is initially pending"
  else
    log_fail "Onboarding status should be pending" "$BODY"
  fi
else
  log_fail "GET /auth/me failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# Extract driver ID from user driverProfile for later use
DRIVER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -n 2 | tail -n 1 | cut -d'"' -f4)
log_pass "Driver ID extracted: $DRIVER_ID"

# -----------------------------------------------------------
# 5. Submit Driver Onboarding Information
# -----------------------------------------------------------
log_section "5. Submit Onboarding Documents"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X PATCH "${BASE_URL}/delivery-partners/me/onboard" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Connor",
    "vehicleType": "motorcycle",
    "vehicleNumber": "KA03EX1234",
    "licenseNumber": "DL1420110012345",
    "licenseExpiry": "2030-12-31",
    "licenseFrontUrl": "uploads/license_front.png",
    "licenseBackUrl": "uploads/license_back.png",
    "vehiclePlateImage": "uploads/plate_image.png",
    "identityProofType": "Aadhaar",
    "identityProofNumber": "123456789012",
    "identityProofImage": "uploads/aadhaar.png",
    "profilePictureUrl": "uploads/profile_pic.png"
  }')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver onboarding details submitted → 200"
else
  log_fail "Failed to submit onboarding details" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# 6. Verify Driver Profile is Submitted
# -----------------------------------------------------------
log_section "6. Verify Driver Profile Status (Submitted)"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/auth/me")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  STATUS=$(echo "$BODY" | grep -o '"onboardingStatus":"[^"]*"' | cut -d'"' -f4)
  if [ "$STATUS" = "submitted" ]; then
    log_pass "Driver onboarding status updated to submitted"
  else
    log_fail "Onboarding status should be submitted" "$BODY"
  fi
else
  log_fail "GET /auth/me check failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# 7. Admin Login
# -----------------------------------------------------------
log_section "7. Admin Login"
RESP=$(curl -s -c "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@gmail.com","password":"Admin@1234"}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Admin logged in successfully → 200"
else
  log_fail "Admin login failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# 8. Admin Fetches Submitted Applications
# -----------------------------------------------------------
log_section "8. Admin Fetches Verification Queue"
RESP=$(curl -s -b "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/delivery-partners?onboardingStatus=submitted")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Admin fetched verification list → 200"
  if echo "$BODY" | grep -q "$DRIVER_ID"; then
    log_pass "Driver is correctly present in the verification queue"
  else
    log_fail "Driver ID $DRIVER_ID should be in verification queue list" "$BODY"
  fi
else
  log_fail "Admin fetch failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# 9. Admin Rejects Driver Application with Reason
# -----------------------------------------------------------
log_section "9. Admin Rejects Application"
RESP=$(curl -s -b "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/delivery-partners/$DRIVER_ID/reject" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Driving license photo is blurry"}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Admin successfully rejected application → 200"
else
  log_fail "Failed to reject application" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# 10. Check Driver Profile State (Rejected)
# -----------------------------------------------------------
log_section "10. Check Driver Profile State (Rejected)"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/auth/me")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  STATUS=$(echo "$BODY" | grep -o '"onboardingStatus":"[^"]*"' | cut -d'"' -f4)
  REASON=$(echo "$BODY" | grep -o '"rejectionReason":"[^"]*"' | cut -d'"' -f4)
  if [ "$STATUS" = "rejected" ] && [ "$REASON" = "Driving license photo is blurry" ]; then
    log_pass "Driver onboarding status is rejected with reason: $REASON"
  else
    log_fail "Onboarding status should be rejected and include reason" "$BODY"
  fi
else
  log_fail "GET /auth/me check failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# 11. Driver Corrects License and Re-submits
# -----------------------------------------------------------
log_section "11. Driver Updates License and Re-submits"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X PATCH "${BASE_URL}/delivery-partners/me/onboard" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Connor",
    "vehicleType": "motorcycle",
    "vehicleNumber": "KA03EX1234",
    "licenseNumber": "DL1420110012345",
    "licenseExpiry": "2030-12-31",
    "licenseFrontUrl": "uploads/license_front_v2.png",
    "licenseBackUrl": "uploads/license_back.png",
    "vehiclePlateImage": "uploads/plate_image.png",
    "identityProofType": "Aadhaar",
    "identityProofNumber": "123456789012",
    "identityProofImage": "uploads/aadhaar.png",
    "profilePictureUrl": "uploads/profile_pic.png"
  }')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver onboarding details re-submitted successfully → 200"
else
  log_fail "Failed to re-submit details" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# 12. Check status is submitted, reason is cleared
# -----------------------------------------------------------
log_section "12. Verify status and rejection reason cleared"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/auth/me")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  STATUS=$(echo "$BODY" | grep -o '"onboardingStatus":"[^"]*"' | cut -d'"' -f4)
  REASON=$(echo "$BODY" | grep -o '"rejectionReason":[^,]*' | cut -d':' -f2)
  if [ "$STATUS" = "submitted" ] && [ "$REASON" = "null" ]; then
    log_pass "Driver status is submitted and rejection reason is null"
  else
    log_fail "Status should be submitted and rejection reason should be null" "$BODY"
  fi
else
  log_fail "GET /auth/me check failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# 13. Admin Approves Driver
# -----------------------------------------------------------
log_section "13. Admin Approves Application"
RESP=$(curl -s -b "$ADMIN_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/delivery-partners/$DRIVER_ID/approve")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Admin successfully approved application → 200"
else
  log_fail "Failed to approve driver application" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# 14. Check Driver Profile State (Approved)
# -----------------------------------------------------------
log_section "14. Check Driver Profile State (Approved)"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/auth/me")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  STATUS=$(echo "$BODY" | grep -o '"onboardingStatus":"[^"]*"' | cut -d'"' -f4)
  if [ "$STATUS" = "approved" ]; then
    log_pass "Driver onboarding status is approved"
  else
    log_fail "Onboarding status should be approved" "$BODY"
  fi
else
  log_fail "GET /auth/me check failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# Summary
# -----------------------------------------------------------
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  Driver Onboarding Smoke Test Results    ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"
echo -e "  ${GREEN}PASS: $PASS${RESET}"
echo -e "  ${RED}FAIL: $FAIL${RESET}"
echo ""

# Clean up temp files
rm -f "$DRIVER_COOKIE_JAR" "$ADMIN_COOKIE_JAR"

# Delete test driver from database to clean up
docker exec -i logiroute-db-dev psql -U postgres -d logiroute -c "DELETE FROM users WHERE phone = '$DRIVER_PHONE';" > /dev/null 2>&1

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}❌ Smoke tests FAILED ($FAIL failures)${RESET}"
  exit 1
else
  echo -e "${GREEN}✅ All driver onboarding smoke tests PASSED${RESET}"
  exit 0
fi
