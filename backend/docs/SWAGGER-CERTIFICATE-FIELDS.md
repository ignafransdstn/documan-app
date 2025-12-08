# Certificate Metadata Integration - Swagger Documentation

**Project**: Document Management System  
**Enhancement**: 12 Certificate Metadata Fields  
**Date**: December 8, 2025  
**Status**: ✅ Complete & Production Ready

---

## 🌐 Interactive API Documentation

The Swagger/OpenAPI UI provides interactive API documentation with live testing capabilities.

### Access Points
```
Development:  http://localhost:5000/api-docs
Production:   https://your-domain.com/api-docs
```

---

## 📋 The 12 Certificate Fields

### Field Reference Table

| # | Field | Type | Required | Enum Values | Example |
|----|-------|------|----------|-------------|---------|
| 1 | certificateType | String | ⭐ Yes | SHM, SHGB, SHGU, SHP, HPL, AJB, Girik, Others | SHGB |
| 2 | publishDate | Date | ⭐ Yes | - | 2025-12-08 |
| 3 | company | String | ⭐ Yes | JH, JHT, BEP, PIJ | JH |
| 4 | landSize | String | No | - | 500 m² |
| 5 | areaName | String | No | - | Jimbaran Hijau Zone |
| 6 | projectName | String | No | - | Luxury Beachfront Villas |
| 7 | zoneUrl | URI | No | - | https://maps.google.com/... |
| 8 | zoneRtdr | String | No | - | 001/2025 |
| 9 | expiredDate | Date | No | - | 2030-12-08 |
| 10 | documentObtained | Date | No | - | 2025-11-15 |
| 11 | originDocument | String | No | - | SHGB-2025-001-JH |
| 12 | previousOwner | String | No | - | PT Bumi Pertiwi |

---

## 🔌 API Endpoints

### Documents

#### Create Document
```
POST /api/documents
Content-Type: application/json
Authorization: Bearer <jwt-token>

Request Body:
{
  "title": "SHGB Certificate",
  "location": "Bali, Indonesia",
  "certificateType": "SHGB",        // Required
  "publishDate": "2025-12-08",      // Required (YYYY-MM-DD)
  "company": "JH",                  // Required
  "landSize": "500 m²",             // Optional
  "areaName": "Jimbaran Hijau",     // Optional
  "projectName": "Luxury Villas",   // Optional
  "zoneUrl": "https://maps.google.com/...", // Optional
  "zoneRtdr": "001/2025",           // Optional
  "expiredDate": "2030-12-08",      // Optional (YYYY-MM-DD)
  "documentObtained": "2025-11-15", // Optional (YYYY-MM-DD)
  "originDocument": "SHGB-2025-001",// Optional
  "previousOwner": "PT Bumi"        // Optional
}

Response: 201 Created
{
  "id": 142,
  "title": "SHGB Certificate",
  "location": "Bali, Indonesia",
  "certificateType": "SHGB",
  "publishDate": "2025-12-08",
  "company": "JH",
  ... (all other fields)
  "status": "active",
  "createdAt": "2025-12-08T11:00:00Z",
  "createdBy": 5
}
```

#### List Documents
```
GET /api/documents
Authorization: Bearer <jwt-token>

Query Parameters (all optional):
  ?certificateType=SHGB
  ?company=JH
  ?location=Bali
  ?limit=10&offset=0

Response: 200 OK
{
  "documents": [
    { ... document with all 12 fields ... },
    { ... more documents ... }
  ],
  "total": 45,
  "limit": 10,
  "offset": 0
}
```

#### Get Document by ID
```
GET /api/documents/:id
Authorization: Bearer <jwt-token>

Response: 200 OK
{
  "id": 142,
  "title": "SHGB Certificate",
  "location": "Bali, Indonesia",
  "filePath": "/uploads/documents/doc_142.pdf",
  "certificateType": "SHGB",
  "landSize": "500 m²",
  "areaName": "Jimbaran Hijau Zone",
  "projectName": "Luxury Beachfront Villas Phase 2",
  "zoneUrl": "https://maps.google.com/?q=-8.7245,115.1689",
  "zoneRtdr": "001/2025",
  "publishDate": "2025-12-08",
  "expiredDate": "2030-12-08",
  "documentObtained": "2025-11-15",
  "originDocument": "SHGB-2025-001-JH",
  "previousOwner": "PT Bumi Pertiwi Indonesia",
  "company": "JH",
  "status": "active",
  "createdBy": 5,
  "metadata": {},
  "createdAt": "2025-12-08T11:00:00Z",
  "updatedAt": "2025-12-08T11:00:00Z",
  "creator": {
    "username": "admin_user"
  },
  "subDocuments": []
}
```

#### Update Document
```
PUT /api/documents/:id
Content-Type: application/json
Authorization: Bearer <jwt-token>

Request Body (only include fields to update):
{
  "expiredDate": "2035-12-08",
  "previousOwner": "New Owner Name"
}

Response: 200 OK
{ ... updated document with all fields ... }
```

#### Delete Document
```
DELETE /api/documents/:id
Authorization: Bearer <jwt-token>

Response: 200 OK
{ "message": "Document deleted successfully" }
```

### SubDocuments

#### Create SubDocument
```
POST /api/documents/:documentId/sub-documents
Content-Type: application/json
Authorization: Bearer <jwt-token>

Request Body (same 12 certificate fields as document):
{
  "title": "SHGB Sub-Document",
  "location": "Sub-location",
  "certificateType": "SHGB",
  "publishDate": "2025-12-08",
  "company": "JH",
  ... (other optional certificate fields)
}

Response: 201 Created
{ ... subdocument with all 12 fields ... }
```

#### Get SubDocument
```
GET /api/documents/:documentId/sub-documents/:subDocumentId
Authorization: Bearer <jwt-token>

Response: 200 OK
{ ... subdocument with all 12 fields ... }
```

#### Update SubDocument
```
PUT /api/documents/:documentId/sub-documents/:subDocumentId
Content-Type: application/json
Authorization: Bearer <jwt-token>

Request Body (only fields to update):
{
  "expiredDate": "2035-12-08"
}

Response: 200 OK
{ ... updated subdocument ... }
```

---

## 🔐 Authentication

### Get JWT Token
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "id": 5,
  "username": "admin",
  "email": "admin@example.com",
  "userLevel": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Use Token in Requests
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Authorization Levels
```
Admin:   Full access to all certificate fields (Create, Read, Update, Delete)
Level1:  Full access to all certificate fields (Create, Read, Update, Delete)
Level2:  Read, Update only - cannot delete
Level3:  Read only - view certificate fields only
```

---

## 💾 OpenAPI/Swagger Schema

### Document Schema
```yaml
Document:
  type: object
  properties:
    id:
      type: integer
      description: Document ID
    title:
      type: string
      description: Document title (mandatory)
    location:
      type: string
      description: Location/category (mandatory)
    filePath:
      type: string
      description: File path on server
    status:
      type: string
      enum: [active, archived, deleted]
      description: Document status
    
    # Certificate Metadata Fields
    certificateType:
      type: string
      enum: [SHM, SHGB, SHGU, SHP, HPL, AJB, Girik, Others]
      description: Certificate type (mandatory)
    landSize:
      type: string
      description: Land size (e.g., "500 m²")
    areaName:
      type: string
      description: Area/zone name
    projectName:
      type: string
      description: Associated project name
    zoneUrl:
      type: string
      format: uri
      description: Maps/location URL
    zoneRtdr:
      type: string
      description: RT/RW or zone code
    publishDate:
      type: string
      format: date
      description: Certificate publication date (mandatory)
    expiredDate:
      type: string
      format: date
      description: Certificate expiration date
    documentObtained:
      type: string
      format: date
      description: Date document was obtained
    originDocument:
      type: string
      description: Original document reference
    previousOwner:
      type: string
      description: Previous owner name
    company:
      type: string
      enum: [JH, JHT, BEP, PIJ]
      description: Company code (mandatory)
    
    # System Fields
    createdBy:
      type: integer
      description: User ID who created
    metadata:
      type: object
      description: Additional metadata
    createdAt:
      type: string
      format: date-time
      description: Creation timestamp
    updatedAt:
      type: string
      format: date-time
      description: Last update timestamp
    creator:
      type: object
      properties:
        username:
          type: string
    subDocuments:
      type: array
      items:
        $ref: '#/components/schemas/SubDocument'
```

---

## 📊 Database Schema

### Documents Table Columns (New)
```sql
certificateType VARCHAR(50) NULL
landSize VARCHAR(255) NULL
areaName VARCHAR(255) NULL
projectName VARCHAR(255) NULL
zoneUrl VARCHAR(2083) NULL
zoneRtdr VARCHAR(255) NULL
publishDate DATE NOT NULL
expiredDate DATE NULL
documentObtained DATE NULL
originDocument VARCHAR(255) NULL
previousOwner VARCHAR(255) NULL
company VARCHAR(10) NOT NULL
```

### SubDocuments Table Columns (Same)
All 12 certificate fields also available in subdocuments table.

---

## 🧪 Testing Examples

### Using Swagger UI
1. Navigate to `http://localhost:5000/api-docs`
2. Click "Authorize" button
3. Paste JWT token from login endpoint
4. Click "Try it out" on desired endpoint
5. Fill request body
6. Click "Execute"
7. View response

### Using cURL

#### Test Create with All Fields
```bash
TOKEN="your-jwt-token"

curl -X POST http://localhost:5000/api/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "SHGB Certificate - Bali Property",
    "location": "Jimbaran, Bali",
    "certificateType": "SHGB",
    "landSize": "500 m²",
    "areaName": "Jimbaran Hijau Zone",
    "projectName": "Luxury Beachfront Villas",
    "zoneUrl": "https://maps.google.com/?q=-8.7245,115.1689",
    "zoneRtdr": "001/2025",
    "publishDate": "2025-12-08",
    "expiredDate": "2030-12-08",
    "documentObtained": "2025-11-15",
    "originDocument": "SHGB-2025-001-JH",
    "previousOwner": "PT Bumi Pertiwi",
    "company": "JH"
  }'
```

#### Test Filter by Certificate Type
```bash
TOKEN="your-jwt-token"

curl -X GET "http://localhost:5000/api/documents?certificateType=SHGB" \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Update Single Field
```bash
TOKEN="your-jwt-token"

curl -X PUT http://localhost:5000/api/documents/142 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expiredDate": "2035-12-08"
  }'
```

---

## ✅ Validation & Error Handling

### Field Validation

#### Certificate Type
- Must be one of: SHM, SHGB, SHGU, SHP, HPL, AJB, Girik, Others
- Error (400): `Validation error: certificateType must be one of: ...`

#### Company
- Must be one of: JH, JHT, BEP, PIJ
- Error (400): `Validation error: company must be one of: ...`

#### Dates (publishDate, expiredDate, documentObtained)
- Format: YYYY-MM-DD (ISO 8601)
- Error (400): `Validation error: publishDate must be in YYYY-MM-DD format`

#### Text Fields (landSize, areaName, projectName, zoneRtdr, originDocument, previousOwner)
- Max length: 255 characters
- Error (400): `Validation error: landSize exceeds maximum length`

#### zoneUrl
- Must be valid URI
- Max length: 2083 characters
- Error (400): `Validation error: zoneUrl must be valid URI`

### Error Responses

#### 400 Bad Request
```json
{
  "message": "Validation error: certificateType is required"
}
```

#### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

#### 403 Forbidden
```json
{
  "message": "Access denied: Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "message": "Document not found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
npm install
npm start
# Server running on http://localhost:5000
```

### 2. Open Swagger UI
```
http://localhost:5000/api-docs
```

### 3. Get Login Token
- Click Authorize
- Use POST /api/auth/login endpoint
- Username: admin, Password: admin123
- Copy the token from response

### 4. Test Create Document
- Click "Try it out" on POST /api/documents
- Paste token in Authorization header (already done)
- Fill request body with certificate fields:
  ```json
  {
    "title": "Test Certificate",
    "location": "Bali",
    "certificateType": "SHGB",
    "publishDate": "2025-12-08",
    "company": "JH",
    "landSize": "500 m²",
    "areaName": "Zone A"
  }
  ```
- Click Execute
- See response with document ID and all fields

### 5. Verify with GET
- Click GET /api/documents/:id
- Enter document ID from previous response
- Click Execute
- See all 12 certificate fields returned

---

## 📚 Related Documentation

| Document | Purpose |
|----------|---------|
| API_DOCUMENTATION.md | Complete API reference with examples |
| SWAGGER-GUIDE.md | Swagger configuration details |
| PROJECT-COMPLETION-SUMMARY.md | Full project completion summary |
| swagger.js | OpenAPI 3.0 specification (code) |

---

**Status**: ✅ Production Ready  
**Last Updated**: December 8, 2025  
**All 12 Certificate Fields**: Fully Integrated & Documented

