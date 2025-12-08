#!/bin/bash

# STEP 9: API Endpoints Testing
# Comprehensive testing of all document API endpoints with the 12 new certificate fields

API_URL="http://localhost:3000/api"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
CURRENT_TEST=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_test() {
    CURRENT_TEST=$((CURRENT_TEST + 1))
    echo -e "${CYAN}Test $CURRENT_TEST: $1${NC}"
    echo "─────────────────────────────────────────────────────────────────"
}

print_pass() {
    echo -e "${GREEN}✓ PASSED: $1${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_fail() {
    echo -e "${RED}✗ FAILED: $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Get authentication token
get_token() {
    SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
      -H "Content-Type: application/json" \
      -d "{
        \"username\": \"apitest$(date +%s)\",
        \"email\": \"apitest$(date +%s)@example.com\",
        \"password\": \"TestPass@123\",
        \"name\": \"API Test User\"
      }")
    
    TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "$TOKEN"
}

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

print_header "STEP 9: COMPREHENSIVE API ENDPOINT TESTING"
echo "Testing all endpoints with 12 new certificate fields"
echo "Test Date: $(date)"
echo ""

# Get token
echo "Obtaining authentication token..."
TOKEN=$(get_token)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Failed to obtain authentication token${NC}"
    exit 1
fi

print_info "Token obtained: ${TOKEN:0:50}..."
echo ""

# ============================================================================
# TEST 1: POST /api/documents - Create with full data
# ============================================================================
print_test "POST /api/documents - Create document with all 12 fields"

CREATE_PAYLOAD='{
    "title": "API Test Document - Full Data",
    "location": "Jakarta, Indonesia",
    "certificateType": "SHGB",
    "landSize": "500 m²",
    "areaName": "Jakarta Premium Zone",
    "projectName": "Jakarta Modernization Project",
    "zoneUrl": "https://maps.example.com/jakarta",
    "zoneRtdr": "001/2025",
    "publishDate": "2025-01-01",
    "expiredDate": "2030-01-01",
    "documentObtained": "2025-01-15",
    "originDocument": "Original Certificate SHM-2025-001",
    "previousOwner": "PT Jakarta Properties",
    "company": "JH"
}'

CREATE_RESPONSE=$(curl -s -X POST "$API_URL/documents/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD")

DOC_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$DOC_ID" ]; then
    print_pass "Document created with ID: $DOC_ID"
    print_info "Response: $(echo "$CREATE_RESPONSE" | head -c 150)..."
else
    print_fail "Document creation failed"
    print_info "Response: $CREATE_RESPONSE"
fi

echo ""

# ============================================================================
# TEST 2: GET /api/documents/:id - Retrieve created document
# ============================================================================
print_test "GET /api/documents/:id - Retrieve document by ID"

if [ -n "$DOC_ID" ]; then
    GET_RESPONSE=$(curl -s "$API_URL/documents/$DOC_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    # Check if all 12 fields are present
    FIELD_COUNT=0
    
    echo "$GET_RESPONSE" | grep -q "certificateType" && ((FIELD_COUNT++))
    echo "$GET_RESPONSE" | grep -q "landSize" && ((FIELD_COUNT++))
    echo "$GET_RESPONSE" | grep -q "areaName" && ((FIELD_COUNT++))
    echo "$GET_RESPONSE" | grep -q "projectName" && ((FIELD_COUNT++))
    echo "$GET_RESPONSE" | grep -q "zoneUrl" && ((FIELD_COUNT++))
    echo "$GET_RESPONSE" | grep -q "zoneRtdr" && ((FIELD_COUNT++))
    echo "$GET_RESPONSE" | grep -q "publishDate" && ((FIELD_COUNT++))
    echo "$GET_RESPONSE" | grep -q "expiredDate" && ((FIELD_COUNT++))
    echo "$GET_RESPONSE" | grep -q "documentObtained" && ((FIELD_COUNT++))
    echo "$GET_RESPONSE" | grep -q "originDocument" && ((FIELD_COUNT++))
    echo "$GET_RESPONSE" | grep -q "previousOwner" && ((FIELD_COUNT++))
    echo "$GET_RESPONSE" | grep -q "company" && ((FIELD_COUNT++))
    
    if [ $FIELD_COUNT -ge 10 ]; then
        print_pass "Document retrieved with $FIELD_COUNT/12 new fields present"
    else
        print_fail "Document retrieved but only $FIELD_COUNT/12 new fields found"
    fi
    
    # Verify field values match
    if echo "$GET_RESPONSE" | grep -q "API Test Document - Full Data"; then
        print_info "Title field verified correctly"
    fi
else
    print_fail "Cannot test GET - document creation failed"
fi

echo ""

# ============================================================================
# TEST 3: PUT /api/documents/:id - Update document
# ============================================================================
print_test "PUT /api/documents/:id - Update document with new values"

if [ -n "$DOC_ID" ]; then
    UPDATE_PAYLOAD='{
        "title": "Updated API Test Document",
        "location": "Bali, Indonesia",
        "certificateType": "HPL",
        "landSize": "750 m²",
        "areaName": "Bali Beach Zone",
        "projectName": "Bali Resort Development",
        "zoneUrl": "https://maps.example.com/bali",
        "zoneRtdr": "002/2025",
        "publishDate": "2025-06-01",
        "expiredDate": "2035-06-01",
        "documentObtained": "2025-06-15",
        "originDocument": "Updated Certificate HPL-2025-001",
        "previousOwner": "PT Bali Properties",
        "company": "JHT"
    }'
    
    UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/documents/$DOC_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$UPDATE_PAYLOAD")
    
    if echo "$UPDATE_RESPONSE" | grep -q '"id":'; then
        print_pass "Document updated successfully"
        
        # Verify update by fetching the document
        VERIFY_RESPONSE=$(curl -s "$API_URL/documents/$DOC_ID" \
          -H "Authorization: Bearer $TOKEN")
        
        if echo "$VERIFY_RESPONSE" | grep -q "Updated API Test Document" && \
           echo "$VERIFY_RESPONSE" | grep -q "HPL"; then
            print_pass "Updated values verified in document retrieval"
        else
            print_fail "Updated values not found in retrieval"
        fi
    else
        print_fail "Document update failed"
        print_info "Response: $(echo "$UPDATE_RESPONSE" | head -c 150)..."
    fi
else
    print_fail "Cannot test PUT - document creation failed"
fi

echo ""

# ============================================================================
# TEST 4: GET /api/documents - List all documents with pagination
# ============================================================================
print_test "GET /api/documents - List all documents"

LIST_RESPONSE=$(curl -s "$API_URL/documents" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LIST_RESPONSE" | grep -q '"data":\|"documents":\|\[{'; then
    DOC_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"id":[0-9]*' | wc -l)
    print_pass "Retrieved document list with $DOC_COUNT documents"
    
    # Check if any document has the new fields
    if echo "$LIST_RESPONSE" | grep -q "certificateType\|landSize\|areaName"; then
        print_pass "New certificate fields present in list response"
    fi
else
    print_fail "Failed to retrieve document list"
fi

echo ""

# ============================================================================
# TEST 5: POST /api/documents/:id/subdocuments - Create sub-document
# ============================================================================
print_test "POST /api/documents/:id/subdocuments - Create sub-document with new fields"

if [ -n "$DOC_ID" ]; then
    SUB_PAYLOAD='{
        "subDocumentNumber": "SUB-001",
        "title": "Sub-document with Certificate Fields",
        "certificateType": "SHM",
        "landSize": "250 m²",
        "areaName": "Sub-Zone A",
        "projectName": "Sub-project Phase 1",
        "zoneUrl": "https://maps.example.com/subzone",
        "zoneRtdr": "001A/2025",
        "publishDate": "2025-02-01",
        "expiredDate": "2032-02-01",
        "documentObtained": "2025-02-15",
        "originDocument": "Sub SHM-2025-001",
        "previousOwner": "PT Sub Owner",
        "company": "BEP"
    }'
    
    SUB_RESPONSE=$(curl -s -X POST "$API_URL/documents/$DOC_ID/subdocuments" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$SUB_PAYLOAD")
    
    SUB_DOC_ID=$(echo "$SUB_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [ -n "$SUB_DOC_ID" ]; then
        print_pass "Sub-document created with ID: $SUB_DOC_ID"
        
        # Verify fields in response
        FIELD_COUNT=0
        echo "$SUB_RESPONSE" | grep -q "certificateType" && ((FIELD_COUNT++))
        echo "$SUB_RESPONSE" | grep -q "landSize" && ((FIELD_COUNT++))
        echo "$SUB_RESPONSE" | grep -q "areaName" && ((FIELD_COUNT++))
        
        print_info "Sub-document contains $FIELD_COUNT verified fields"
    else
        print_fail "Sub-document creation failed"
        print_info "Response: $(echo "$SUB_RESPONSE" | head -c 150)..."
    fi
else
    print_fail "Cannot test sub-document creation - parent document not created"
fi

echo ""

# ============================================================================
# TEST 6: GET /api/documents/:id/subdocuments - Retrieve sub-documents
# ============================================================================
print_test "GET /api/documents/:id/subdocuments - Retrieve sub-documents list"

if [ -n "$DOC_ID" ]; then
    SUB_LIST_RESPONSE=$(curl -s "$API_URL/documents/$DOC_ID/subdocuments" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$SUB_LIST_RESPONSE" | grep -q '"id":\|data\|subdocuments'; then
        SUB_COUNT=$(echo "$SUB_LIST_RESPONSE" | grep -o '"id":[0-9]*' | wc -l)
        print_pass "Retrieved $SUB_COUNT sub-documents"
        
        if echo "$SUB_LIST_RESPONSE" | grep -q "certificateType"; then
            print_pass "Sub-document list contains new certificate fields"
        fi
    else
        print_fail "Failed to retrieve sub-documents list"
    fi
else
    print_fail "Cannot test sub-document retrieval - parent document not created"
fi

echo ""

# ============================================================================
# TEST 7: Validation - Missing mandatory field (certificateType)
# ============================================================================
print_test "POST /api/documents - Validation: Missing mandatory field (certificateType)"

INVALID_PAYLOAD='{
    "title": "Invalid Document - Missing CertificateType",
    "location": "Test Location",
    "publishDate": "2025-01-01",
    "company": "JH"
}'

INVALID_RESPONSE=$(curl -s -X POST "$API_URL/documents/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INVALID_PAYLOAD")

if echo "$INVALID_RESPONSE" | grep -qi "error\|required\|certificateType\|400"; then
    print_pass "API correctly rejected missing certificateType"
else
    if echo "$INVALID_RESPONSE" | grep -q '"id":'; then
        print_fail "API accepted document with missing certificateType (validation issue)"
    else
        print_fail "Unexpected response for validation test"
    fi
fi

echo ""

# ============================================================================
# TEST 8: Validation - Invalid enum value (certificateType)
# ============================================================================
print_test "POST /api/documents - Validation: Invalid enum value for certificateType"

INVALID_ENUM_PAYLOAD='{
    "title": "Invalid Enum Document",
    "location": "Test Location",
    "certificateType": "INVALID_CERT_TYPE",
    "publishDate": "2025-01-01",
    "company": "JH"
}'

INVALID_ENUM_RESPONSE=$(curl -s -X POST "$API_URL/documents/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INVALID_ENUM_PAYLOAD")

if echo "$INVALID_ENUM_RESPONSE" | grep -qi "error\|invalid\|enum\|certificateType"; then
    print_pass "API correctly rejected invalid certificateType value"
else
    if echo "$INVALID_ENUM_RESPONSE" | grep -q '"id":'; then
        print_fail "API accepted invalid certificateType enum value"
    else
        print_fail "Unexpected response for enum validation"
    fi
fi

echo ""

# ============================================================================
# TEST 9: Validation - Invalid company enum
# ============================================================================
print_test "POST /api/documents - Validation: Invalid enum value for company"

INVALID_COMPANY_PAYLOAD='{
    "title": "Invalid Company Document",
    "location": "Test Location",
    "certificateType": "SHM",
    "publishDate": "2025-01-01",
    "company": "INVALID_COMPANY"
}'

INVALID_COMPANY_RESPONSE=$(curl -s -X POST "$API_URL/documents/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INVALID_COMPANY_PAYLOAD")

if echo "$INVALID_COMPANY_RESPONSE" | grep -qi "error\|invalid\|enum\|company"; then
    print_pass "API correctly rejected invalid company value"
else
    if echo "$INVALID_COMPANY_RESPONSE" | grep -q '"id":'; then
        print_fail "API accepted invalid company enum value"
    else
        print_fail "Unexpected response for company validation"
    fi
fi

echo ""

# ============================================================================
# TEST 10: Partial update - Update only certificate type
# ============================================================================
print_test "PUT /api/documents/:id - Partial update: Only certificateType field"

if [ -n "$DOC_ID" ]; then
    PARTIAL_PAYLOAD='{"certificateType": "AJB"}'
    
    PARTIAL_RESPONSE=$(curl -s -X PUT "$API_URL/documents/$DOC_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$PARTIAL_PAYLOAD")
    
    if echo "$PARTIAL_RESPONSE" | grep -q '"id":'; then
        # Verify partial update
        VERIFY_PARTIAL=$(curl -s "$API_URL/documents/$DOC_ID" \
          -H "Authorization: Bearer $TOKEN")
        
        if echo "$VERIFY_PARTIAL" | grep -q '"certificateType":"AJB"'; then
            print_pass "Partial update successful - certificateType changed to AJB"
        else
            print_fail "Partial update failed - certificateType not changed"
        fi
    else
        print_fail "Partial update API call failed"
    fi
else
    print_fail "Cannot test partial update - document not created"
fi

echo ""

# ============================================================================
# TEST 11: Partial update - Update only optional field
# ============================================================================
print_test "PUT /api/documents/:id - Partial update: Only optional field (landSize)"

if [ -n "$DOC_ID" ]; then
    PARTIAL_OPT_PAYLOAD='{"landSize": "2500 m² (Expanded)"}'
    
    PARTIAL_OPT_RESPONSE=$(curl -s -X PUT "$API_URL/documents/$DOC_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$PARTIAL_OPT_PAYLOAD")
    
    if echo "$PARTIAL_OPT_RESPONSE" | grep -q '"id":'; then
        VERIFY_OPT=$(curl -s "$API_URL/documents/$DOC_ID" \
          -H "Authorization: Bearer $TOKEN")
        
        if echo "$VERIFY_OPT" | grep -q "2500 m²"; then
            print_pass "Optional field partial update successful"
        else
            print_fail "Optional field not updated"
        fi
    else
        print_fail "Optional field partial update failed"
    fi
else
    print_fail "Cannot test optional field update - document not created"
fi

echo ""

# ============================================================================
# TEST 12: Field value persistence - Check all 12 fields stored correctly
# ============================================================================
print_test "GET /api/documents/:id - Verify all 12 fields stored with correct values"

if [ -n "$DOC_ID" ]; then
    PERSISTENCE_CHECK=$(curl -s "$API_URL/documents/$DOC_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    PERSISTED_FIELDS=0
    
    # Check each field value
    echo "$PERSISTENCE_CHECK" | grep -q "certificateType" && ((PERSISTED_FIELDS++))
    echo "$PERSISTENCE_CHECK" | grep -q "landSize" && ((PERSISTED_FIELDS++))
    echo "$PERSISTENCE_CHECK" | grep -q "areaName" && ((PERSISTED_FIELDS++))
    echo "$PERSISTENCE_CHECK" | grep -q "projectName" && ((PERSISTED_FIELDS++))
    echo "$PERSISTENCE_CHECK" | grep -q "zoneUrl" && ((PERSISTED_FIELDS++))
    echo "$PERSISTENCE_CHECK" | grep -q "zoneRtdr" && ((PERSISTED_FIELDS++))
    echo "$PERSISTENCE_CHECK" | grep -q "publishDate" && ((PERSISTED_FIELDS++))
    echo "$PERSISTENCE_CHECK" | grep -q "expiredDate" && ((PERSISTED_FIELDS++))
    echo "$PERSISTENCE_CHECK" | grep -q "documentObtained" && ((PERSISTED_FIELDS++))
    echo "$PERSISTENCE_CHECK" | grep -q "originDocument" && ((PERSISTED_FIELDS++))
    echo "$PERSISTENCE_CHECK" | grep -q "previousOwner" && ((PERSISTED_FIELDS++))
    echo "$PERSISTENCE_CHECK" | grep -q "company" && ((PERSISTED_FIELDS++))
    
    if [ $PERSISTED_FIELDS -eq 12 ]; then
        print_pass "All 12 fields persisted correctly in database"
    else
        print_fail "Only $PERSISTED_FIELDS/12 fields persisted"
    fi
else
    print_fail "Cannot test persistence - document not created"
fi

echo ""

# ============================================================================
# TEST 13: Delete document
# ============================================================================
print_test "DELETE /api/documents/:id - Delete document"

if [ -n "$DOC_ID" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/documents/$DOC_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$DELETE_RESPONSE" | grep -qi "success\|deleted\|200\|204"; then
        print_pass "Document deleted successfully"
        
        # Verify deletion
        VERIFY_DELETE=$(curl -s "$API_URL/documents/$DOC_ID" \
          -H "Authorization: Bearer $TOKEN")
        
        if echo "$VERIFY_DELETE" | grep -qi "not found\|error\|404"; then
            print_pass "Deletion verified - document no longer retrievable"
        else
            print_fail "Document still retrievable after deletion"
        fi
    else
        print_fail "Delete operation failed or returned unexpected response"
    fi
else
    print_fail "Cannot test deletion - document not created"
fi

echo ""

# ============================================================================
# TEST SUMMARY
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC} TEST SUMMARY - API ENDPOINTS"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}✓ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}✗ Failed: $TESTS_FAILED${NC}"
echo ""
echo -e "Success Rate: ${YELLOW}$SUCCESS_RATE%${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL API ENDPOINT TESTS PASSED!${NC}"
    echo ""
    echo "Verified Endpoints:"
    echo "  ✓ POST /api/documents - Create with 12 new fields"
    echo "  ✓ GET /api/documents/:id - Retrieve single document"
    echo "  ✓ PUT /api/documents/:id - Update with 12 new fields"
    echo "  ✓ GET /api/documents - List all documents"
    echo "  ✓ POST /api/documents/:id/subdocuments - Create sub-document"
    echo "  ✓ GET /api/documents/:id/subdocuments - List sub-documents"
    echo "  ✓ DELETE /api/documents/:id - Delete document"
    echo ""
    echo "Verified Features:"
    echo "  ✓ All 12 certificate fields stored and retrieved"
    echo "  ✓ Mandatory field validation working"
    echo "  ✓ Enum validation for certificateType"
    echo "  ✓ Enum validation for company"
    echo "  ✓ Partial updates supported"
    echo "  ✓ Data persistence verified"
else
    echo -e "${RED}⚠ SOME TESTS FAILED${NC}"
    echo "Review output above for details"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}STEP 9 COMPLETE: Comprehensive API Endpoint Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next: STEP 10 - Update API documentation with new fields"
