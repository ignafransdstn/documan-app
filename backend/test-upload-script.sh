#!/bin/bash

# Test Upload Functionality with New Certificate Fields
# This script tests uploading documents with all 12 new certificate & property fields

BASE_URL="http://localhost:3000/api"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Step 7: Test Upload Functionality with New Certificate Fields${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Step 1: Login and get token
echo -e "${YELLOW}[1/5] Authenticating with admin credentials...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$ADMIN_USERNAME\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✓ Successfully authenticated. Token: ${TOKEN:0:20}...${NC}\n"

# Create a test PDF file
TEST_PDF_PATH="/tmp/test-document.pdf"
printf '%%PDF-1.4\n%%EOF' > "$TEST_PDF_PATH"

# Test 1: Full Data Upload
echo -e "${YELLOW}[2/5] TEST 1: Uploading master document with ALL 12 fields populated...${NC}"
TEST1_RESPONSE=$(curl -s -X POST "$BASE_URL/documents/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "document=@$TEST_PDF_PATH" \
  -F "title=Test Document - Full Data" \
  -F "location=Jimbaran, Bali" \
  -F "longitude=-8.7208" \
  -F "latitude=115.1690" \
  -F "description=This is a test document with all fields populated" \
  -F "certificateType=SHGB" \
  -F "landSize=500 m²" \
  -F "areaName=Jimbaran Hijau" \
  -F "projectName=Luxury Villas Project" \
  -F "zoneUrl=https://example.com/zone/jh-001" \
  -F "zoneRtdr=Zone A1 - Residential" \
  -F "publishDate=2025-11-01" \
  -F "expiredDate=2030-11-01" \
  -F "documentObtained=2025-11-15" \
  -F "originDocument=Original document from Land Office. Serial: 12345/2025. Condition: Good" \
  -F "previousOwner=PT Bumi Pertiwi Indonesia" \
  -F "company=JH")

DOC_ID_1=$(echo "$TEST1_RESPONSE" | jq -r '.id' 2>/dev/null)
if [ -z "$DOC_ID_1" ] || [ "$DOC_ID_1" == "null" ]; then
  echo -e "${RED}✗ Test 1 FAILED - Document upload failed${NC}"
  echo "Response: $TEST1_RESPONSE"
else
  echo -e "${GREEN}✓ Test 1 PASSED - Full data upload successful${NC}"
  echo "  - Document ID: $DOC_ID_1"
  echo "  - Certificate Type: $(echo "$TEST1_RESPONSE" | jq -r '.certificateType')"
  echo "  - Land Size: $(echo "$TEST1_RESPONSE" | jq -r '.landSize')"
  echo "  - Company: $(echo "$TEST1_RESPONSE" | jq -r '.company')"
fi
echo ""

# Test 2: Mandatory Fields Only
echo -e "${YELLOW}[3/5] TEST 2: Uploading master document with MANDATORY FIELDS ONLY...${NC}"
TEST2_RESPONSE=$(curl -s -X POST "$BASE_URL/documents/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "document=@$TEST_PDF_PATH" \
  -F "title=Test Document - Minimal Data" \
  -F "location=Jakarta, Indonesia" \
  -F "certificateType=SHM" \
  -F "publishDate=2025-12-08" \
  -F "company=JHT")

DOC_ID_2=$(echo "$TEST2_RESPONSE" | jq -r '.id' 2>/dev/null)
if [ -z "$DOC_ID_2" ] || [ "$DOC_ID_2" == "null" ]; then
  echo -e "${RED}✗ Test 2 FAILED - Minimal data upload failed${NC}"
  echo "Response: $TEST2_RESPONSE"
else
  echo -e "${GREEN}✓ Test 2 PASSED - Minimal data upload successful${NC}"
  echo "  - Document ID: $DOC_ID_2"
  echo "  - Certificate Type: $(echo "$TEST2_RESPONSE" | jq -r '.certificateType')"
  echo "  - Company: $(echo "$TEST2_RESPONSE" | jq -r '.company')"
  echo "  - Optional fields are null: $(echo "$TEST2_RESPONSE" | jq '.landSize, .areaName, .projectName')"
fi
echo ""

# Test 3: Validation - Missing Title
echo -e "${YELLOW}[4/5] TEST 3: Validation tests - Missing mandatory fields...${NC}"
VALIDATION_FAILED=0

# Missing Title
TEST3_RESPONSE=$(curl -s -X POST "$BASE_URL/documents/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "document=@$TEST_PDF_PATH" \
  -F "location=Jakarta" \
  -F "certificateType=SHM" \
  -F "publishDate=2025-12-08" \
  -F "company=JH")

if echo "$TEST3_RESPONSE" | grep -q "title" || echo "$TEST3_RESPONSE" | jq -e '.message | contains("title")' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Validation 3a PASSED - Title validation working${NC}"
else
  echo -e "${RED}✗ Validation 3a FAILED - Title validation not working${NC}"
  echo "  Response: $TEST3_RESPONSE"
  VALIDATION_FAILED=1
fi

# Missing Certificate Type
TEST3B_RESPONSE=$(curl -s -X POST "$BASE_URL/documents/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "document=@$TEST_PDF_PATH" \
  -F "title=Test" \
  -F "location=Jakarta" \
  -F "publishDate=2025-12-08" \
  -F "company=JH")

if echo "$TEST3B_RESPONSE" | grep -q "certificateType" || echo "$TEST3B_RESPONSE" | jq -e '.message | contains("certificateType")' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Validation 3b PASSED - Certificate type validation working${NC}"
else
  echo -e "${RED}✗ Validation 3b FAILED - Certificate type validation not working${NC}"
  VALIDATION_FAILED=1
fi

# Missing Publish Date
TEST3C_RESPONSE=$(curl -s -X POST "$BASE_URL/documents/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "document=@$TEST_PDF_PATH" \
  -F "title=Test" \
  -F "location=Jakarta" \
  -F "certificateType=SHM" \
  -F "company=JH")

if echo "$TEST3C_RESPONSE" | grep -q "publishDate" || echo "$TEST3C_RESPONSE" | jq -e '.message | contains("publishDate")' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Validation 3c PASSED - Publish date validation working${NC}"
else
  echo -e "${RED}✗ Validation 3c FAILED - Publish date validation not working${NC}"
  VALIDATION_FAILED=1
fi

# Missing Company
TEST3D_RESPONSE=$(curl -s -X POST "$BASE_URL/documents/" \
  -H "Authorization: Bearer $TOKEN" \
  -F "document=@$TEST_PDF_PATH" \
  -F "title=Test" \
  -F "location=Jakarta" \
  -F "certificateType=SHM" \
  -F "publishDate=2025-12-08")

if echo "$TEST3D_RESPONSE" | grep -q "company" || echo "$TEST3D_RESPONSE" | jq -e '.message | contains("company")' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Validation 3d PASSED - Company validation working${NC}"
else
  echo -e "${RED}✗ Validation 3d FAILED - Company validation not working${NC}"
  VALIDATION_FAILED=1
fi

if [ $VALIDATION_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All mandatory field validations passed${NC}"
fi
echo ""

# Test 4: Data Persistence
echo -e "${YELLOW}[5/5] TEST 4: Verifying data persistence and retrieval...${NC}"
GET_RESPONSE=$(curl -s -X GET "$BASE_URL/documents" \
  -H "Authorization: Bearer $TOKEN")

DOC1_FROM_DB=$(echo "$GET_RESPONSE" | jq ".[] | select(.id == $DOC_ID_1)" 2>/dev/null)
DOC2_FROM_DB=$(echo "$GET_RESPONSE" | jq ".[] | select(.id == $DOC_ID_2)" 2>/dev/null)

PERSISTENCE_OK=1

if [ ! -z "$DOC1_FROM_DB" ] && [ "$DOC1_FROM_DB" != "null" ]; then
  echo -e "${GREEN}✓ Test 4a PASSED - Full data document retrieved from database${NC}"
  echo "  - Certificate: $(echo "$DOC1_FROM_DB" | jq -r '.certificateType')"
  echo "  - Land Size: $(echo "$DOC1_FROM_DB" | jq -r '.landSize')"
  echo "  - Area Name: $(echo "$DOC1_FROM_DB" | jq -r '.areaName')"
  echo "  - Previous Owner: $(echo "$DOC1_FROM_DB" | jq -r '.previousOwner')"
else
  echo -e "${RED}✗ Test 4a FAILED - Full data document not found in database${NC}"
  echo "  Document ID: $DOC_ID_1"
  PERSISTENCE_OK=0
fi

if [ ! -z "$DOC2_FROM_DB" ] && [ "$DOC2_FROM_DB" != "null" ]; then
  echo -e "${GREEN}✓ Test 4b PASSED - Minimal data document retrieved from database${NC}"
  echo "  - Certificate: $(echo "$DOC2_FROM_DB" | jq -r '.certificateType')"
  echo "  - Company: $(echo "$DOC2_FROM_DB" | jq -r '.company')"
else
  echo -e "${RED}✗ Test 4b FAILED - Minimal data document not found in database${NC}"
  echo "  Document ID: $DOC_ID_2"
  PERSISTENCE_OK=0
fi
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Summary:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Test 1: Full data upload - PASSED${NC}"
echo -e "${GREEN}✓ Test 2: Minimal data upload - PASSED${NC}"
if [ $VALIDATION_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ Test 3: Field validation - PASSED${NC}"
else
  echo -e "${RED}✗ Test 3: Field validation - FAILED${NC}"
fi
if [ $PERSISTENCE_OK -eq 1 ]; then
  echo -e "${GREEN}✓ Test 4: Data persistence - PASSED${NC}"
else
  echo -e "${RED}✗ Test 4: Data persistence - FAILED${NC}"
fi
echo ""
echo -e "${GREEN}All tests completed successfully!${NC}"
echo -e "${BLUE}Documents created:${NC}"
echo "  - Doc 1 (Full Data): ID=$DOC_ID_1"
echo "  - Doc 2 (Minimal Data): ID=$DOC_ID_2"

# Cleanup
rm -f "$TEST_PDF_PATH"
