#!/usr/bin/env bash
# ============================================================
# LogiRoute — Products & Categories Module Smoke Tests
# Module: Products, Categories, Stores API
# Usage: ./scripts/smoke-test-products.sh [BASE_URL]
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
echo -e "${CYAN}║  LogiRoute — Products Smoke Tests        ║${RESET}"
echo -e "${CYAN}║  Target: ${BASE_URL}${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"

# -----------------------------------------------------------
# 0. API Healthcheck
# -----------------------------------------------------------
log_section "0. API Healthcheck"
RESP=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/")
if [ "$RESP" = "200" ]; then
  log_pass "GET / returns 200"
else
  log_fail "GET / should return 200" "HTTP $RESP"
fi

# -----------------------------------------------------------
# 1. Admin Login (Needed for Write Permissions)
# -----------------------------------------------------------
log_section "1. Admin Login (super_admin)"
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

# -----------------------------------------------------------
# 2. Get Stores (Extract store id to add product)
# -----------------------------------------------------------
log_section "2. Query Stores List"
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" "${BASE_URL}/stores")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "GET /stores returns 200"
  STORE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4 || true)
  if [ -n "$STORE_ID" ]; then
    log_pass "Found active store ID: $STORE_ID"
  else
    log_fail "No active stores found in DB to link products. Make sure seeder ran." "$BODY"
    exit 1
  fi
else
  log_fail "GET /stores failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# -----------------------------------------------------------
# 3. Categories CRUD
# -----------------------------------------------------------
log_section "3. Categories CRUD Tests"

# 3.1 Unauthenticated Category Creation
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/categories" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test Category"}')
if [ "$RESP" = "401" ]; then
  log_pass "Unauthenticated POST /categories returns 401 Unauthorized"
else
  log_fail "Unauthenticated POST /categories should fail" "HTTP $RESP"
fi

# 3.2 Authenticated Category Creation
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/categories" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test Fruits","description":"Organic seasonal fresh fruits","imageUrl":"uploads/category_test.jpg"}')
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  log_pass "POST /categories with session → 201"
  CATEGORY_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4 || true)
  if [ -n "$CATEGORY_ID" ]; then
    log_pass "Category created with ID: $CATEGORY_ID"
  else
    log_fail "Response body missing category ID" "$BODY"
  fi
else
  log_fail "Category creation failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 3.3 List Categories
RESP=$(curl -s -w "\n%{http_code}" "${BASE_URL}/categories")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "GET /categories returns 200"
  if echo "$BODY" | grep -q "Smoke Test Fruits"; then
    log_pass "Categories list contains our newly created category"
  else
    log_fail "Categories list missing category" "$BODY"
  fi
else
  log_fail "GET /categories should return 200" "HTTP $HTTP_CODE"
fi

# -----------------------------------------------------------
# 4. Products CRUD
# -----------------------------------------------------------
log_section "4. Products CRUD Tests"

# 4.1 Unauthenticated Product Creation
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/products" \
  -H "Content-Type: application/json" \
  -d "{\"storeId\":\"$STORE_ID\",\"name\":\"Smoke Test Apple\",\"price\":15000,\"unitSize\":\"1 kg\"}")
if [ "$RESP" = "401" ]; then
  log_pass "Unauthenticated POST /products returns 401 Unauthorized"
else
  log_fail "Unauthenticated POST /products should fail" "HTTP $RESP"
fi

# 4.2 Authenticated Product Creation
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" \
  -X POST "${BASE_URL}/products" \
  -H "Content-Type: application/json" \
  -d "{\"storeId\":\"$STORE_ID\",\"name\":\"Smoke Test Apple\",\"description\":\"Fuji sweet apples\",\"price\":15000,\"unitSize\":\"1 kg (approx 5 pcs)\",\"categoryId\":\"$CATEGORY_ID\",\"imageUrl\":\"uploads/apple_test.jpg\",\"isFeatured\":true,\"isVeg\":true}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  log_pass "POST /products with session → 201"
  PRODUCT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4 || true)
  if [ -n "$PRODUCT_ID" ]; then
    log_pass "Product created with ID: $PRODUCT_ID"
  else
    log_fail "Response body missing product ID" "$BODY"
  fi
else
  log_fail "Product creation failed" "HTTP $HTTP_CODE — $BODY"
  exit 1
fi

# 4.3 Get Product List with Filter
RESP=$(curl -s -w "\n%{http_code}" "${BASE_URL}/products?storeId=${STORE_ID}&limit=50")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "GET /products with storeId filter → 200"
  if echo "$BODY" | grep -q "Smoke Test Apple"; then
    log_pass "Products list matches search filter"
  else
    log_fail "Products list missing search matching item" "$BODY"
  fi
else
  log_fail "GET /products failed" "HTTP $HTTP_CODE"
fi

# 4.4 Get Product Details
RESP=$(curl -s -w "\n%{http_code}" "${BASE_URL}/products/${PRODUCT_ID}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  log_pass "GET /products/:id returns 200"
  if echo "$BODY" | grep -q '"categoryName":"Smoke Test Fruits"'; then
    log_pass "Product details returns linked categoryName successfully"
  else
    log_fail "Product details missing linked categoryName" "$BODY"
  fi
  # Verify presigned URL returned
  if echo "$BODY" | grep -q -E '"imageUrl":"http://[^"]+:9000/logiroute-uploads/uploads/apple_test.jpg'; then
    log_pass "Product details returns browser-resolvable presigned S3 imageUrl: $(echo "$BODY" | grep -o '"imageUrl":"[^"]*"' | cut -d'"' -f4 | cut -c1-60)..."
  else
    log_fail "Product details missing S3 presigned URL signature" "$BODY"
  fi
else
  log_fail "GET /products/:id failed" "HTTP $HTTP_CODE"
fi

# -----------------------------------------------------------
# 5. Cleanup Resources (Deletions)
# -----------------------------------------------------------
log_section "5. Cleanup and Deletion Checks"

# 5.1 Try to delete Category containing products (expect conflict)
RESP=$(curl -s -b "$COOKIE_JAR" -w "\n%{http_code}" \
  -X DELETE "${BASE_URL}/categories/${CATEGORY_ID}")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$HTTP_CODE" = "409" ]; then
  log_pass "DELETE /categories/:id on active category with products returns 409 Conflict"
else
  log_fail "DELETE /categories/:id on category with products should return 409 Conflict" "HTTP $HTTP_CODE — $BODY"
fi

# 5.2 Delete product
RESP=$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" \
  -X DELETE "${BASE_URL}/products/${PRODUCT_ID}")
if [ "$RESP" = "200" ]; then
  log_pass "DELETE /products/:id → 200"
else
  log_fail "DELETE /products/:id failed" "HTTP $RESP"
fi

# 5.3 Delete category (should succeed now that product is deleted)
RESP=$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" \
  -X DELETE "${BASE_URL}/categories/${CATEGORY_ID}")
if [ "$RESP" = "200" ]; then
  log_pass "DELETE /categories/:id → 200"
else
  log_fail "DELETE /categories/:id failed" "HTTP $RESP"
fi

# 5.4 Verify category is gone
RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/categories/${CATEGORY_ID}")
if [ "$RESP" = "404" ]; then
  log_pass "GET /categories/:id returns 404 Not Found after deletion"
else
  log_fail "GET /categories/:id should return 404" "HTTP $RESP"
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
rm -f "$COOKIE_JAR"

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}❌ Products smoke tests FAILED ($FAIL failures)${RESET}"
  exit 1
else
  echo -e "${GREEN}✅ All products smoke tests PASSED${RESET}"
  exit 0
fi
