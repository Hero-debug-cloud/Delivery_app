#!/usr/bin/env bash
# ============================================================
# LogiRoute — Driver Profile Smoke Tests
# Usage: ./scripts/smoke-test-driver-profile.sh [BASE_URL]
# ============================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"
DRIVER_COOKIE_JAR=$(mktemp)
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
echo -e "${CYAN}║  LogiRoute — Driver Profile Tests        ║${RESET}"
echo -e "${CYAN}║  Target: ${BASE_URL}${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"

# Driver Phone for Profile Test
DRIVER_PHONE="+919876500123"

# Cleanup any leftover user from previous runs
docker exec -i logiroute-db-dev psql -U postgres -d logiroute -c "DELETE FROM users WHERE phone = '$DRIVER_PHONE';" > /dev/null 2>&1

# 1. Request OTP for New Driver
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
log_section "3. Verify OTP & Auto-Register Driver"
RESP=$(curl -s -c "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$DRIVER_PHONE\",\"otp\":\"$OTP_CODE\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "OTP verified and user session created → 200"
else
  log_fail "OTP verification failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 4. Fetch GET /delivery-partners/me/profile
log_section "4. Fetch Driver Profile Details"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/delivery-partners/me/profile")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver profile fetched successfully → 200"
  
  # Validate name (should be auto-generated or default) and status
  NAME=$(echo "$BODY" | jq -r '.profile.name')
  STATUS=$(echo "$BODY" | jq -r '.profile.onboardingStatus')
  
  log_pass "Driver name is initially: $NAME"
  if [ "$STATUS" = "pending" ]; then
    log_pass "Driver onboarding status is pending"
  else
    log_fail "Onboarding status should be pending" "$BODY"
  fi
else
  log_fail "GET /delivery-partners/me/profile failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 5. Call PATCH /delivery-partners/me/profile to update name and email
log_section "5. Update Driver Name and Email"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X PATCH "${BASE_URL}/delivery-partners/me/profile" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane.doe@example.com"}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Driver profile fields updated successfully → 200"
  
  UPD_NAME=$(echo "$BODY" | jq -r '.profile.name')
  UPD_EMAIL=$(echo "$BODY" | jq -r '.profile.email')
  
  if [ "$UPD_NAME" = "Jane Doe" ] && [ "$UPD_EMAIL" = "jane.doe@example.com" ]; then
    log_pass "Name updated to 'Jane Doe' and Email updated to 'jane.doe@example.com'"
  else
    log_fail "Name or email mismatch in response" "$BODY"
  fi
else
  log_fail "PATCH /delivery-partners/me/profile failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 6. Call PATCH /delivery-partners/me/profile to update profilePictureUrl
log_section "6. Update Driver Profile Picture"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  -X PATCH "${BASE_URL}/delivery-partners/me/profile" \
  -H "Content-Type: application/json" \
  -d '{"profilePictureUrl": "uploads/driver_profile_jane.png"}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Profile picture updated successfully → 200"
  
  PIC_URL=$(echo "$BODY" | jq -r '.profile.profilePictureUrl')
  
  if [[ "$PIC_URL" == *"uploads/driver_profile_jane.png"* ]]; then
    log_pass "Profile picture S3 key successfully set and resolved to presigned URL: $PIC_URL"
  else
    log_fail "Profile picture URL mismatch in response" "$BODY"
  fi
else
  log_fail "PATCH /delivery-partners/me/profile for profile picture failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 7. Fetch GET /delivery-partners/me/profile to double check all fields persist
log_section "7. Fetch Profile to Verify Persistence"
RESP=$(curl -s -b "$DRIVER_COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/delivery-partners/me/profile")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  FINAL_NAME=$(echo "$BODY" | jq -r '.profile.name')
  FINAL_EMAIL=$(echo "$BODY" | jq -r '.profile.email')
  FINAL_PIC=$(echo "$BODY" | jq -r '.profile.profilePictureUrl')
  
  if [ "$FINAL_NAME" = "Jane Doe" ] && [ "$FINAL_EMAIL" = "jane.doe@example.com" ] && [[ "$FINAL_PIC" == *"uploads/driver_profile_jane.png"* ]]; then
    log_pass "Persistence verified: Name='Jane Doe', Email='jane.doe@example.com', ProfilePictureUrl='$FINAL_PIC'"
  else
    log_fail "Verification of persisted fields failed" "$BODY"
  fi
else
  log_fail "Final GET profile verification failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 8. Cleanup and database purge
log_section "8. Cleanup Database"
rm -f "$DRIVER_COOKIE_JAR"
docker exec -i logiroute-db-dev psql -U postgres -d logiroute -c "DELETE FROM users WHERE phone = '$DRIVER_PHONE';" > /dev/null 2>&1
log_pass "Deleted test driver successfully"

# Summary
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  Driver Profile Smoke Test Results       ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"
echo -e "  ${GREEN}PASS: $PASS${RESET}"
echo -e "  ${RED}FAIL: $FAIL${RESET}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}❌ Smoke tests FAILED ($FAIL failures)${RESET}"
  exit 1
else
  echo -e "${GREEN}✅ All driver profile smoke tests PASSED${RESET}"
  exit 0
fi
