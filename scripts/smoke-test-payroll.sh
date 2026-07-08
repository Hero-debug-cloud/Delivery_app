#!/usr/bin/env bash
# ============================================================
# LogiRoute — Payroll Module Smoke Tests
# Usage: ./scripts/smoke-test-payroll.sh [BASE_URL]
# Default BASE_URL: http://localhost:8000
# ============================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"
COOKIE_JAR=$(mktemp)
PASS=0
FAIL=0

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
echo -e "${CYAN}║  LogiRoute — Payroll Smoke Tests         ║${RESET}"
echo -e "${CYAN}║  Target: ${BASE_URL}${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"

# 0. Healthcheck
log_section "0. API Healthcheck"
RESP=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/")
if [ "$RESP" = "200" ]; then
  log_pass "GET / returns 200"
else
  log_fail "GET / should return 200" "HTTP $RESP"
fi

# 1. Admin Login
log_section "1. Admin Login"
RESP=$(curl -s -c "$COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@gmail.com","password":"Herovinay1@","rememberMe":false}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Admin login successful"
else
  log_fail "Admin login failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 2. Get Stores & Driver
log_section "2. Resolve Stores & Driver"
STORES_RESP=$(curl -s -b "$COOKIE_JAR" "${BASE_URL}/stores")
STORE_ID=$(echo "$STORES_RESP" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4)

if [ -n "$STORE_ID" ]; then
  log_pass "Found active store ID: $STORE_ID"
else
  log_fail "Failed to find active store ID" "$STORES_RESP"
  exit 1
fi

# 3. Payout Parameter Config Tests
log_section "3. Payout Parameter Config Tests"

# A. Get configurations
CONFIGS_RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/payroll/configurations")
HTTP_CODE=$(echo "$CONFIGS_RESP" | tail -n1)
BODY=$(echo "$CONFIGS_RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "GET /payroll/configurations returns 200"
else
  log_fail "GET /payroll/configurations should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# B. Save Global Default Payout Rule
GLOBAL_PAYLOAD='{"storeId":null,"perOrderRate":2500,"perKmRate":600,"nightSurgeRate":1200,"weatherSurgeRate":1800,"latePenalty":700}'
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/payroll/configurations" \
  -H "Content-Type: application/json" \
  -d "$GLOBAL_PAYLOAD")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "POST /payroll/configurations (Global Default) → 200"
else
  log_fail "POST /payroll/configurations (Global Default) should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# C. Save Store Specific Override Payout Rule
STORE_PAYLOAD="{\"storeId\":\"$STORE_ID\",\"perOrderRate\":3000,\"perKmRate\":800,\"nightSurgeRate\":1500,\"weatherSurgeRate\":2000,\"latePenalty\":1000}"
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/payroll/configurations" \
  -H "Content-Type: application/json" \
  -d "$STORE_PAYLOAD")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "POST /payroll/configurations (Store Specific Override) → 200"
else
  log_fail "POST /payroll/configurations (Store Specific Override) should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# D. Get store configuration override
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/payroll/configurations/$STORE_ID")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "GET /payroll/configurations/$STORE_ID returns 200"
  CONFIG_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4)
  RATE=$(echo "$BODY" | grep -o '"perOrderRate":[0-9]*' | cut -d':' -f2)
  if [ "$RATE" = "3000" ]; then
    log_pass "Fetched store config rate correctly matches the override value (3000)"
  else
    log_fail "Fetched store config rate should match override value (3000)" "$BODY"
  fi
else
  log_fail "GET /payroll/configurations/$STORE_ID should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# 4. Generate Payroll ledgers
log_section "4. Generate Payroll ledgers"
GENERATE_PAYLOAD="{\"storeId\":\"$STORE_ID\",\"startDate\":\"2026-07-01\",\"endDate\":\"2026-07-07\"}"
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/payroll/generate" \
  -H "Content-Type: application/json" \
  -d "$GENERATE_PAYLOAD")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "POST /payroll/generate returns 200"
else
  log_fail "POST /payroll/generate should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# 5. Get ledgers list
log_section "5. Get ledgers list"
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/payroll/ledgers?storeId=$STORE_ID")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "GET /payroll/ledgers returns 200"
else
  log_fail "GET /payroll/ledgers should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# 6. Export ledgers
log_section "6. Export ledgers"
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/payroll/ledgers/export?storeId=$STORE_ID")
HTTP_CODE=$(echo "$RESP" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "GET /payroll/ledgers/export returns 200"
else
  log_fail "GET /payroll/ledgers/export should return 200" "HTTP $HTTP_CODE"
fi

# 7. Delete configuration override
log_section "7. Delete configuration override"
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" \
  -X DELETE "${BASE_URL}/payroll/configurations/$CONFIG_ID")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "DELETE /payroll/configurations/$CONFIG_ID → 200"
else
  log_fail "DELETE /payroll/configurations/$CONFIG_ID should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# Verify fallback is now active for that store
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/payroll/configurations/$STORE_ID")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "GET /payroll/configurations/$STORE_ID returns 200 (post delete)"
  RATE=$(echo "$BODY" | grep -o '"perOrderRate":[0-9]*' | cut -d':' -f2)
  if [ "$RATE" = "2500" ]; then
    log_pass "Fetched store config rate correctly fell back to global default (2500)"
  else
    log_fail "Fetched store config rate should fall back to global default (2500)" "$BODY"
  fi
else
  log_fail "GET /payroll/configurations/$STORE_ID should return 200" "HTTP $HTTP_CODE — $BODY"
fi

# Cleanup
rm -f "$COOKIE_JAR"

echo -e "\n${CYAN}============================================${RESET}"
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ All payroll smoke tests PASSED ($PASS/$PASS)${RESET}"
else
  echo -e "${RED}❌ Smoke tests FAILED ($FAIL failures)${RESET}"
  exit 1
fi
