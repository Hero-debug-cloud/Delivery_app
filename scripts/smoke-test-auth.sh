#!/usr/bin/env bash
# ============================================================
# LogiRoute — Auth Module Smoke Tests
# Module: Authentication
# Usage: ./scripts/smoke-test-auth.sh [BASE_URL]
# Default BASE_URL: http://localhost:8000
# ============================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"
COOKIE_JAR=$(mktemp)
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
echo -e "${CYAN}║  LogiRoute — Auth Smoke Tests            ║${RESET}"
echo -e "${CYAN}║  Target: ${BASE_URL}${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"

# -----------------------------------------------------------
# 0. Healthcheck
# -----------------------------------------------------------
log_section "0. API Healthcheck"
RESP=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/")
if [ "$RESP" = "200" ]; then
  log_pass "GET / returns 200"
else
  log_fail "GET / should return 200" "HTTP $RESP"
fi

# -----------------------------------------------------------
# 1. Admin Login — Valid Credentials
# -----------------------------------------------------------
log_section "1. Admin Login — Valid Credentials"
RESP=$(curl -s -c "$COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@gmail.com","password":"Admin@1234","rememberMe":false}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "POST /auth/admin/login with correct creds → 200"
  # Extract user role from response
  ROLE=$(echo "$BODY" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$ROLE" ]; then
    log_pass "Response contains user.role: $ROLE"
  else
    log_fail "Response should contain user.role" "$BODY"
  fi
else
  log_fail "POST /auth/admin/login should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# -----------------------------------------------------------
# 2. Admin Login — Wrong Password
# -----------------------------------------------------------
log_section "2. Admin Login — Wrong Password"
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@gmail.com","password":"wrongpassword"}')
if [ "$RESP" = "401" ]; then
  log_pass "POST /auth/admin/login with wrong password → 401"
else
  log_fail "POST /auth/admin/login with wrong password should return 401" "HTTP $RESP"
fi

# -----------------------------------------------------------
# 3. Admin Login — Non-existent User
# -----------------------------------------------------------
log_section "3. Admin Login — Non-existent User"
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"ghost@notexist.com","password":"Admin@1234"}')
if [ "$RESP" = "401" ]; then
  log_pass "POST /auth/admin/login with unknown user → 401"
else
  log_fail "POST /auth/admin/login with unknown user should return 401" "HTTP $RESP"
fi

# -----------------------------------------------------------
# 4. GET /auth/me — With Valid Session Cookie
# -----------------------------------------------------------
log_section "4. GET /auth/me — Authenticated"
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" \
  "${BASE_URL}/auth/me")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "GET /auth/me with valid session → 200"
  USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$USER_ID" ]; then
    log_pass "Response contains user.id"
  else
    log_fail "Response should contain user.id" "$BODY"
  fi
else
  log_fail "GET /auth/me should return 200 with valid session" "HTTP $HTTP_CODE — $BODY"
fi

# -----------------------------------------------------------
# 5. GET /auth/me — No Cookie (Unauthenticated)
# -----------------------------------------------------------
log_section "5. GET /auth/me — Unauthenticated"
RESP=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/auth/me")
if [ "$RESP" = "401" ]; then
  log_pass "GET /auth/me without cookie → 401"
else
  log_fail "GET /auth/me without cookie should return 401" "HTTP $RESP"
fi

# -----------------------------------------------------------
# 6. Admin Signup — Valid New Account
# -----------------------------------------------------------
log_section "6. Admin Signup — Valid New Account"
SMOKE_EMAIL="smoketest_$(date +%s)@test.com"
SIGNUP_COOKIE_JAR=$(mktemp)
RESP=$(curl -s -c "$SIGNUP_COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/admin/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke Tester\",\"email\":\"$SMOKE_EMAIL\",\"password\":\"Test@1234\",\"confirmPassword\":\"Test@1234\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  log_pass "POST /auth/admin/signup with valid data → 201"
else
  log_fail "POST /auth/admin/signup should return 201" "HTTP $HTTP_CODE — $BODY"
fi

# -----------------------------------------------------------
# 7. Admin Signup — Duplicate Email
# -----------------------------------------------------------
log_section "7. Admin Signup — Duplicate Email"
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/auth/admin/signup" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Duplicate\",\"email\":\"admin@gmail.com\",\"password\":\"Admin@1234\",\"confirmPassword\":\"Admin@1234\"}")
if [ "$RESP" = "409" ]; then
  log_pass "POST /auth/admin/signup with duplicate email → 409"
else
  log_fail "POST /auth/admin/signup with duplicate email should return 409" "HTTP $RESP"
fi

# -----------------------------------------------------------
# 8. Admin Signup — Password Mismatch (Validation)
# -----------------------------------------------------------
log_section "8. Admin Signup — Password Mismatch"
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/auth/admin/signup" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"mismatch@test.com","password":"Test@1234","confirmPassword":"Wrong@5678"}')
if [ "$RESP" = "400" ]; then
  log_pass "POST /auth/admin/signup with mismatched passwords → 400"
else
  log_fail "POST /auth/admin/signup with mismatched passwords should return 400" "HTTP $RESP"
fi

# -----------------------------------------------------------
# 9. OTP Request — Valid Phone
# -----------------------------------------------------------
log_section "9. OTP Request — Valid Phone"
RESP=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/otp/request" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210"}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "POST /auth/otp/request with valid phone → 200"
else
  log_fail "POST /auth/otp/request should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# -----------------------------------------------------------
# 10. OTP Verify — Wrong OTP
# -----------------------------------------------------------
log_section "10. OTP Verify — Wrong OTP"
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"000000"}')
if [ "$RESP" = "401" ]; then
  log_pass "POST /auth/otp/verify with wrong OTP → 401"
else
  log_fail "POST /auth/otp/verify with wrong OTP should return 401" "HTTP $RESP"
fi

# -----------------------------------------------------------
# 11. OTP Request — Invalid Phone (Too Short)
# -----------------------------------------------------------
log_section "11. OTP Request — Invalid Phone"
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/auth/otp/request" \
  -H "Content-Type: application/json" \
  -d '{"phone":"123"}')
if [ "$RESP" = "400" ]; then
  log_pass "POST /auth/otp/request with short phone → 400"
else
  log_fail "POST /auth/otp/request with short phone should return 400" "HTTP $RESP"
fi

# -----------------------------------------------------------
# 11b. PATCH /auth/me — Profile Update
# -----------------------------------------------------------
log_section "11b. PATCH /auth/me — Profile Update"

# Try updating profile name, phone, and password
NEW_NAME="Updated Admin Name"
NEW_PHONE="+918888888888"
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" \
  -X PATCH "${BASE_URL}/auth/me" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$NEW_NAME\",\"phone\":\"$NEW_PHONE\",\"password\":\"NewAdminPassword@123\"}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "PATCH /auth/me with valid name, phone, and password → 200"
  UPDATED_NAME=$(echo "$BODY" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
  UPDATED_PHONE=$(echo "$BODY" | grep -o '"phone":"[^"]*"' | cut -d'"' -f4)
  if [ "$UPDATED_NAME" = "$NEW_NAME" ] && [ "$UPDATED_PHONE" = "$NEW_PHONE" ]; then
    log_pass "Response contains updated name and phone"
  else
    log_fail "Response fields do not match updated fields" "$BODY"
  fi
else
  log_fail "PATCH /auth/me should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# Try logging in with the new password
log_section "11c. Admin Login — With Updated Password"
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@gmail.com","password":"NewAdminPassword@123"}')
if [ "$RESP" = "200" ]; then
  log_pass "POST /auth/admin/login with new password → 200"
else
  log_fail "POST /auth/admin/login with new password should return 200" "HTTP $RESP"
fi

# Reset password back to original to keep smoke test idempotent
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" \
  -X PATCH "${BASE_URL}/auth/me" \
  -H "Content-Type: application/json" \
  -d '{"password":"Admin@1234"}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "PATCH /auth/me reverted password back to original → 200"
else
  log_fail "PATCH /auth/me revert password should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# Try invalid email validation
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -b "$COOKIE_JAR" \
  -X PATCH "${BASE_URL}/auth/me" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}')
if [ "$RESP" = "400" ]; then
  log_pass "PATCH /auth/me with invalid email format → 400"
else
  log_fail "PATCH /auth/me with invalid email should return 400" "HTTP $RESP"
fi

# Try unauthenticated profile update
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PATCH "${BASE_URL}/auth/me" \
  -H "Content-Type: application/json" \
  -d '{"name":"Unauth Updated"}')
if [ "$RESP" = "401" ]; then
  log_pass "PATCH /auth/me without session → 401"
else
  log_fail "PATCH /auth/me without session should return 401" "HTTP $RESP"
fi

# -----------------------------------------------------------
# 12. Logout — Valid Session
# -----------------------------------------------------------
log_section "12. Logout — Valid Session"
RESP=$(curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/auth/logout")
if [ "$RESP" = "200" ]; then
  log_pass "POST /auth/logout with valid session → 200"
else
  log_fail "POST /auth/logout should return 200" "HTTP $RESP"
fi

# -----------------------------------------------------------
# 13. GET /auth/me — After Logout (Session Invalidated)
# -----------------------------------------------------------
log_section "13. GET /auth/me — After Logout"
RESP=$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "${BASE_URL}/auth/me")
if [ "$RESP" = "401" ]; then
  log_pass "GET /auth/me after logout → 401 (session invalidated)"
else
  log_fail "GET /auth/me after logout should return 401" "HTTP $RESP"
fi

# -----------------------------------------------------------
# Summary
# -----------------------------------------------------------
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║  Results Summary                         ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"
echo -e "  ${GREEN}PASS: $PASS${RESET}"
echo -e "  ${RED}FAIL: $FAIL${RESET}"
echo ""

# Clean up temp files
rm -f "$COOKIE_JAR" "$SIGNUP_COOKIE_JAR"

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}❌ Smoke tests FAILED ($FAIL failures)${RESET}"
  exit 1
else
  echo -e "${GREEN}✅ All smoke tests PASSED${RESET}"
  exit 0
fi
