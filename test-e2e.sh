#!/bin/bash

# Document Management System - Manual E2E Test Script
# This script tests all major functionalities of the application

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Document Management System - E2E Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_URL="http://localhost:5001/api"
ADMIN_TOKEN=""
USER_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_code=$5
    local token=$6
    
    echo -n "Testing: $name... "
    
    if [ -z "$token" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        ((PASSED++))
        echo "$body"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_code, Got: $http_code)"
        ((FAILED++))
        echo "$body"
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 1. AUTHENTICATION TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Admin Login
echo "Test 1.1: Admin Login"
LOGIN_DATA='{"username":"admin","password":"admin123"}'
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Admin login successful"
    ADMIN_TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    echo "Admin Token: ${ADMIN_TOKEN:0:50}..."
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} - Admin login failed (HTTP $http_code)"
    ((FAILED++))
fi
echo ""

# Test 2: Get Profile
if [ -n "$ADMIN_TOKEN" ]; then
    echo "Test 1.2: Get User Profile"
    test_endpoint "Get Profile" "GET" "/auth/profile" "" "200" "$ADMIN_TOKEN"
    echo ""
fi

# Test 3: Invalid Login
echo "Test 1.3: Invalid Login (Wrong Password)"
test_endpoint "Invalid Login" "POST" "/auth/login" '{"username":"admin","password":"wrongpass"}' "401"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 2. DOCUMENT MANAGEMENT TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}Skipping document tests - no admin token${NC}"
else
    # Test 4: Get All Documents
    echo "Test 2.1: Get All Documents"
    test_endpoint "Get Documents" "GET" "/documents" "" "200" "$ADMIN_TOKEN"
    echo ""
    
    # Test 5: Get Document Summary
    echo "Test 2.2: Get Document Summary"
    test_endpoint "Get Summary" "GET" "/users/summary" "" "200" "$ADMIN_TOKEN"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 3. USER MANAGEMENT TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}Skipping user tests - no admin token${NC}"
else
    # Test 6: Get All Users
    echo "Test 3.1: Get All Users"
    test_endpoint "Get Users" "GET" "/users" "" "200" "$ADMIN_TOKEN"
    echo ""
    
    # Test 7: Get Activity Logs
    echo "Test 3.2: Get Activity Logs"
    test_endpoint "Get Activity Logs" "GET" "/users/activity-logs" "" "200" "$ADMIN_TOKEN"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 4. AUTHORIZATION TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 8: Unauthorized Access
echo "Test 4.1: Unauthorized Access (No Token)"
test_endpoint "No Token" "GET" "/documents" "" "401"
echo ""

# Test 9: Invalid Token
echo "Test 4.2: Invalid Token"
test_endpoint "Invalid Token" "GET" "/documents" "" "401" "invalid-token-12345"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 5. DATABASE TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 10: Check Database Connection
echo "Test 5.1: Database Connection"
if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}⊘ SKIPPED${NC} - No admin token"
else
    test_endpoint "DB Health" "GET" "/users/summary" "" "200" "$ADMIN_TOKEN"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
TOTAL=$((PASSED + FAILED))
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✓ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
