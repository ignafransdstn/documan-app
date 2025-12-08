# API Documentation

## Overview
This document provides comprehensive information about the Document Management System API. The API is built using Express.js and provides endpoints for authentication, document management, and user administration.

## Latest Update - December 2025
Added 12 new certificate and property management fields to the document management system. All endpoints now support extended document metadata for property certificates and documentation.

## Interactive Documentation
The API documentation is available through Swagger UI at:
- **Development**: `http://localhost:5000/api-docs` or `http://localhost:3000/api-docs`
- **Production**: `https://your-production-url.com/api-docs`

The Swagger/OpenAPI documentation provides interactive API exploration with try-it-out functionality for all endpoints, complete with request/response examples and all 12 certificate metadata fields fully documented.

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## User Levels and Permissions

### Admin
- Full system access
- User management (CRUD operations)
- Document management (all operations)
- View user sessions
- No screen capture restrictions

### Level 1
- Document CRUD operations with new certificate fields
- Document download
- Sub-document creation with certificate metadata
- Cannot register new users

### Level 2
- Document create, read, update (no delete) with new certificate fields
- Document download
- Sub-document creation with certificate metadata
- Cannot register new users

### Level 3
- Read-only document access including new certificate fields
- Cannot download documents
- Cannot create sub-documents
- Cannot register new users

## Document Fields - Standard vs Certificate Metadata

### Standard Fields (Always Required)
- **id** (integer): Unique document identifier
- **title** (string, **mandatory**): Document title
- **location** (string, **mandatory**): Geographic or organizational location
- **filePath** (string): Server file path
- **status** (enum): Document status (active, archived, deleted)
- **createdBy** (integer): User ID of document creator
- **createdAt** (datetime): Creation timestamp
- **updatedAt** (datetime): Last modification timestamp

### New Certificate & Property Fields (Dec 2025)

#### Mandatory Certificate Fields
- **certificateType** (enum, **mandatory**): Type of property certificate
  - Valid values: `SHM`, `SHGB`, `SHGU`, `SHP`, `HPL`, `AJB`, `Girik`, `Others`
  - Required for all documents

- **publishDate** (date, **mandatory**): Certificate publication date (YYYY-MM-DD)
  - Format: ISO 8601 (YYYY-MM-DD)
  - Required for all documents

- **company** (enum, **mandatory**): Associated company/organization
  - Valid values: `JH`, `JHT`, `BEP`, `PIJ`
  - Required for all documents

#### Optional Certificate & Property Fields
- **landSize** (string, optional): Land area measurement
  - Example: "500 m²", "1 hectare", "2.5 sq km"
  - User-defined format

- **areaName** (string, optional): Area or zone designation
  - Example: "Jakarta Premium Zone", "North Coast Development Area"

- **projectName** (string, optional): Associated development project
  - Example: "Luxury Beachfront Villas Phase 2", "City Center Complex"

- **zoneUrl** (URI, optional): Maps or location URL
  - Example: "https://maps.google.com/?q=-8.7245,115.1689"
  - Must be valid URI format

- **zoneRtdr** (string, optional): RT/RW zone code or designation
  - Example: "001/2025", "002A/2024"
  - Typically administrative zone code

- **expiredDate** (date, optional): Certificate expiration date (YYYY-MM-DD)
  - Format: ISO 8601
  - Null if certificate doesn't expire

- **documentObtained** (date, optional): Date document was obtained (YYYY-MM-DD)
  - Format: ISO 8601
  - Useful for tracking document acquisition date

- **originDocument** (text, optional): Original certificate reference number
  - Example: "SHM-2025-001-JH", "HPL Jakarta Nomor: 2025-HPL-002"
  - Original certificate serial/reference

- **previousOwner** (string, optional): Previous property owner
  - Example: "PT Bumi Pertiwi Indonesia", "CV Jakarta Property Management"
  - Entity or person name

## API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login (returns JWT token)
- `POST /signup` - Public user signup
- `POST /refresh-token` - Refresh JWT token
- `GET /profile` - Get user profile

### Documents (`/api/documents`)
- `GET /documents` - List all documents (with new certificate fields)
- `GET /documents/:id` - Get specific document details (includes all 12 new fields)
- `POST /documents` - Create new document (all certificate fields supported)
- `PUT /documents/:id` - Update document (all fields including new certificate metadata)
- `DELETE /documents/:id` - Delete document

### Sub-Documents (`/api/documents/:id/subdocuments`)
- `GET /documents/:id/subdocuments` - List sub-documents (with certificate fields)
- `GET /documents/:id/subdocuments/:subId` - Get specific sub-document
- `POST /documents/:id/subdocuments` - Create sub-document (with certificate fields)
- `PUT /documents/:id/subdocuments/:subId` - Update sub-document
- `DELETE /documents/:id/subdocuments/:subId` - Delete sub-document
- `POST /register-user` - Register user with specific role (Admin only)

### Documents (`/api/documents`)
- `POST /` - Create document (Level 1,2,Admin)
- `GET /` - List all documents
- `GET /:id` - Get document by ID
- `PUT /:id` - Update document (Level 1,2,Admin)
- `DELETE /:id` - Delete document (Level 1,Admin)
- `GET /download/:id` - Download document (Level 1,2,Admin)
- `POST /sub-document` - Create sub-document (Level 1,2,Admin)

### Users (`/api/users`)
- `GET /` - Get all users (Admin only)
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user (Admin only)
- `GET /sessions` - Get user sessions (Admin only)
- `POST /:id/change-password` - Change password

## File Upload Requirements
- **Supported formats**: JPEG, JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX
- **Maximum file size**: 10MB
- **Content-Type**: `multipart/form-data`

## Error Responses
All endpoints return consistent error responses:
```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security Features
- JWT-based authentication
- Role-based access control
- File type validation
- Screen capture prevention for non-admin users
- CORS protection
- Input validation

## Rate Limiting
Currently not implemented but recommended for production deployment.

## Examples

### Login Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Upload Document Example
```bash
curl -X POST http://localhost:5000/api/documents \
  -H "Authorization: Bearer <your-token>" \
  -F "document=@/path/to/file.pdf" \
  -F "title=Sample Document" \
  -F "location=Archive" \
  -F "status=active"
```

### Get All Documents Example
```bash
curl -X GET http://localhost:5000/api/documents \
  -H "Authorization: Bearer <your-token>"
```

## Development Setup
1. Install dependencies: `npm install`
2. Set up environment variables in `.env`
3. Start development server: `npm run dev`
4. Access Swagger UI: `http://localhost:5000/api-docs`

## Testing
Run the test suite to verify API functionality:
```bash
npm test
npm run test:coverage
```

## Support
For API support and questions, please contact the development team or refer to the interactive Swagger documentation.
## Request/Response Examples

### Example 1: Create Document with All Certificate Fields

**Request:**
```bash
POST /api/documents
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "title": "SHGB Certificate - Bali Property",
  "location": "Jimbaran, Bali, Indonesia",
  "certificateType": "SHGB",
  "landSize": "500 m²",
  "areaName": "Jimbaran Hijau Zone",
  "projectName": "Luxury Beachfront Villas Phase 2",
  "zoneUrl": "https://maps.google.com/?q=-8.7245,115.1689",
  "zoneRtdr": "001/2025",
  "publishDate": "2025-11-01",
  "expiredDate": "2030-11-01",
  "documentObtained": "2025-11-15",
  "originDocument": "SHGB-2025-001-JH",
  "previousOwner": "PT Bumi Pertiwi Indonesia",
  "company": "JH"
}
```

**Response (201 Created):**
```json
{
  "id": 142,
  "title": "SHGB Certificate - Bali Property",
  "location": "Jimbaran, Bali, Indonesia",
  "certificateType": "SHGB",
  "landSize": "500 m²",
  "areaName": "Jimbaran Hijau Zone",
  "projectName": "Luxury Beachfront Villas Phase 2",
  "zoneUrl": "https://maps.google.com/?q=-8.7245,115.1689",
  "zoneRtdr": "001/2025",
  "publishDate": "2025-11-01",
  "expiredDate": "2030-11-01",
  "documentObtained": "2025-11-15",
  "originDocument": "SHGB-2025-001-JH",
  "previousOwner": "PT Bumi Pertiwi Indonesia",
  "company": "JH",
  "status": "active",
  "createdAt": "2025-12-08T11:00:00Z",
  "updatedAt": "2025-12-08T11:00:00Z",
  "createdBy": 5
}
```

### Example 2: Create Document with Minimal Fields

**Request:**
```bash
POST /api/documents
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "title": "SHM Certificate - Jakarta",
  "location": "Jakarta Pusat",
  "certificateType": "SHM",
  "publishDate": "2025-12-08",
  "company": "JHT"
}
```

**Response (201 Created):**
```json
{
  "id": 143,
  "title": "SHM Certificate - Jakarta",
  "location": "Jakarta Pusat",
  "certificateType": "SHM",
  "landSize": null,
  "areaName": null,
  "projectName": null,
  "zoneUrl": null,
  "zoneRtdr": null,
  "publishDate": "2025-12-08",
  "expiredDate": null,
  "documentObtained": null,
  "originDocument": null,
  "previousOwner": null,
  "company": "JHT",
  "status": "active",
  "createdAt": "2025-12-08T11:05:00Z",
  "updatedAt": "2025-12-08T11:05:00Z",
  "createdBy": 5
}
```

### Example 3: Update Document - Partial Update

**Request:**
```bash
PUT /api/documents/142
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "certificateType": "HPL",
  "expiredDate": "2035-11-01"
}
```

**Response (200 OK):**
```json
{
  "id": 142,
  "title": "SHGB Certificate - Bali Property",
  "location": "Jimbaran, Bali, Indonesia",
  "certificateType": "HPL",
  "landSize": "500 m²",
  "areaName": "Jimbaran Hijau Zone",
  "projectName": "Luxury Beachfront Villas Phase 2",
  "zoneUrl": "https://maps.google.com/?q=-8.7245,115.1689",
  "zoneRtdr": "001/2025",
  "publishDate": "2025-11-01",
  "expiredDate": "2035-11-01",
  "documentObtained": "2025-11-15",
  "originDocument": "SHGB-2025-001-JH",
  "previousOwner": "PT Bumi Pertiwi Indonesia",
  "company": "JH",
  "status": "active",
  "updatedAt": "2025-12-08T12:00:00Z"
}
```

### Example 4: Retrieve Document with All Fields

**Request:**
```bash
GET /api/documents/142
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "id": 142,
  "title": "SHGB Certificate - Bali Property",
  "location": "Jimbaran, Bali, Indonesia",
  "filePath": "/uploads/documents/doc_142.pdf",
  "certificateType": "HPL",
  "landSize": "500 m²",
  "areaName": "Jimbaran Hijau Zone",
  "projectName": "Luxury Beachfront Villas Phase 2",
  "zoneUrl": "https://maps.google.com/?q=-8.7245,115.1689",
  "zoneRtdr": "001/2025",
  "publishDate": "2025-11-01",
  "expiredDate": "2035-11-01",
  "documentObtained": "2025-11-15",
  "originDocument": "SHGB-2025-001-JH",
  "previousOwner": "PT Bumi Pertiwi Indonesia",
  "company": "JH",
  "status": "active",
  "createdBy": 5,
  "metadata": {},
  "createdAt": "2025-12-08T11:00:00Z",
  "updatedAt": "2025-12-08T12:00:00Z",
  "creator": {
    "username": "admin_user"
  },
  "subDocuments": []
}
```

## Field Validation Rules

### Certificate Type Enum
Valid values must be one of:
- `SHM` - Sertifikat Hak Milik (Ownership Certificate)
- `SHGB` - Sertifikat Hak Guna Bangunan (Building Right Certificate)
- `SHGU` - Sertifikat Hak Guna Usaha (Business Right Certificate)
- `SHP` - Sertifikat Hak Pakai (Usufruct Certificate)
- `HPL` - Hak Pengelolaan Lahan (Land Management Right)
- `AJB` - Akta Jual Beli (Sale/Purchase Deed)
- `Girik` - Girik Certificate (Legacy Land Certificate)
- `Others` - Other certificate types

### Company Enum
Valid values must be one of:
- `JH` - Jimbaran Hijau
- `JHT` - Jimbaran Hijau Tourism
- `BEP` - Bali Enterprise Properties
- `PIJ` - Properti Investasi Jawa

### Date Format
All date fields must follow ISO 8601 format: `YYYY-MM-DD`
- Example: `2025-12-08`
- Invalid: `08/12/2025` or `12-08-2025`

## Error Responses

### 400 Bad Request - Missing Mandatory Field
```json
{
  "message": "Validation error: certificateType is required"
}
```

### 400 Bad Request - Invalid Enum Value
```json
{
  "message": "Validation error: certificateType must be one of: SHM, SHGB, SHGU, SHP, HPL, AJB, Girik, Others"
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied: Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Document not found"
}
```

## Implementation Notes

### Database Schema
- All 12 new fields are stored in the `documents` table
- All 12 new fields are also available in the `subdocuments` table
- Fields support NULL values for optional fields
- Enum fields use VARCHAR with constraints for validation
- Date fields stored as DATE type in ISO 8601 format

### Performance Considerations
- The 12 new fields add approximately 200-250 bytes per document
- No significant performance impact on queries
- Indexes recommended on frequently filtered fields: `certificateType`, `company`, `publishDate`

### Migration Path for Existing Data
- Existing documents can have NULL values for all 12 new fields
- Updates to existing documents will include new fields if provided
- Optional fields don't require updates if not applicable

### Backward Compatibility
- All original document fields remain unchanged
- Original endpoints continue to work with existing data
- New fields are completely optional in existing documents
- Frontend gracefully handles NULL values for optional fields

## Swagger/OpenAPI Integration

### OpenAPI 3.0 Schema

The API uses OpenAPI 3.0 specification with complete documentation for all 12 certificate fields. The Swagger UI provides:

#### Document Schema (OpenAPI Definition)
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
      description: Document location/category (mandatory)
    filePath:
      type: string
      description: File path on server
    status:
      type: string
      enum: [active, archived, deleted]
      description: Document status
    certificateType:
      type: string
      enum: [SHM, SHGB, SHGU, SHP, HPL, AJB, Girik, Others]
      description: Certificate type (mandatory)
    landSize:
      type: string
      description: Land size measurement (optional, e.g., "500 m²")
    areaName:
      type: string
      description: Area name or zone designation (optional)
    projectName:
      type: string
      description: Associated project name (optional)
    zoneUrl:
      type: string
      format: uri
      description: Maps/location URL for the property (optional)
    zoneRtdr:
      type: string
      description: RT/RW designation or zone code (optional)
    publishDate:
      type: string
      format: date
      description: Certificate publication date in YYYY-MM-DD format (mandatory)
    expiredDate:
      type: string
      format: date
      description: Certificate expiration date in YYYY-MM-DD format (optional)
    documentObtained:
      type: string
      format: date
      description: Date document was obtained in YYYY-MM-DD format (optional)
    originDocument:
      type: string
      description: Original document reference or serial number (optional)
    previousOwner:
      type: string
      description: Previous property owner name or entity (optional)
    company:
      type: string
      enum: [JH, JHT, BEP, PIJ]
      description: Associated company code (mandatory)
    createdBy:
      type: integer
      description: ID of user who created the document
    metadata:
      type: object
      description: Additional document metadata
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
          description: Creator username
    subDocuments:
      type: array
      items:
        $ref: '#/components/schemas/SubDocument'
```

#### SubDocument Schema (OpenAPI Definition)
The SubDocument schema includes all 12 certificate fields identical to the Document schema, allowing sub-documents to have complete certificate metadata:

```yaml
SubDocument:
  type: object
  properties:
    id:
      type: integer
      description: Sub-document ID
    title:
      type: string
      description: Sub-document title
    parentDocumentId:
      type: integer
      description: Parent document ID
    location:
      type: string
      description: Sub-document location/category
    filePath:
      type: string
      description: File path on server
    certificateType:
      type: string
      enum: [SHM, SHGB, SHGU, SHP, HPL, AJB, Girik, Others]
      description: Certificate type for sub-document
    landSize:
      type: string
      description: Land size measurement for sub-document
    areaName:
      type: string
      description: Area name or zone designation for sub-document
    projectName:
      type: string
      description: Associated project name for sub-document
    zoneUrl:
      type: string
      format: uri
      description: Maps/location URL for the sub-document property
    zoneRtdr:
      type: string
      description: RT/RW designation or zone code for sub-document
    publishDate:
      type: string
      format: date
      description: Certificate publication date in YYYY-MM-DD format
    expiredDate:
      type: string
      format: date
      description: Certificate expiration date in YYYY-MM-DD format
    documentObtained:
      type: string
      format: date
      description: Date document was obtained in YYYY-MM-DD format
    originDocument:
      type: string
      description: Original document reference or serial number
    previousOwner:
      type: string
      description: Previous property owner name or entity
    company:
      type: string
      enum: [JH, JHT, BEP, PIJ]
      description: Associated company code
    status:
      type: string
      enum: [active, archived, deleted]
      description: Sub-document status
    metadata:
      type: object
      description: Additional sub-document metadata
    createdAt:
      type: string
      format: date-time
      description: Creation timestamp
    updatedAt:
      type: string
      format: date-time
      description: Last update timestamp
```

### Swagger UI Features

1. **Try It Out**: Use the Swagger UI to directly test API endpoints
2. **Request/Response**: View actual request bodies and response schemas
3. **Authentication**: Built-in JWT token support for protected endpoints
4. **Field Validation**: Visual indicators for mandatory vs optional fields
5. **Enum Values**: Dropdown selection for enum fields (certificateType, company, status, userLevel)
6. **Date Formats**: Automatic date picker for date fields (publishDate, expiredDate, documentObtained)
7. **URI Format**: Special handling for URL fields (zoneUrl)

### API Endpoints with Certificate Fields

All document endpoints now support the 12 certificate fields:

#### Create Document
```
POST /api/documents
```
- Request includes all 12 certificate fields (mandatory + optional)
- Response returns created document with all fields

#### Get Document
```
GET /api/documents/:id
```
- Returns complete document with all 12 certificate fields
- SubDocuments also include all 12 certificate fields

#### List Documents
```
GET /api/documents
```
- Query parameters support filtering by:
  - `certificateType`: Filter by certificate type
  - `company`: Filter by company code
  - `publishDate`: Filter by publication date
  - `location`: Filter by location

#### Update Document
```
PUT /api/documents/:id
```
- Supports partial or complete updates to all 12 certificate fields
- Only include fields that need updating

#### Create SubDocument
```
POST /api/documents/:documentId/sub-documents
```
- Creates sub-document with its own set of 12 certificate fields
- Maintains relationship to parent document

#### Get SubDocument
```
GET /api/documents/:documentId/sub-documents/:subDocumentId
```
- Returns sub-document with all 12 certificate fields

### Security & Authorization

All document endpoints enforce role-based access control:

| Endpoint | Admin | Level1 | Level2 | Level3 |
|----------|-------|--------|--------|--------|
| POST /documents | ✓ | ✓ | ✓ | ✗ |
| GET /documents | ✓ | ✓ | ✓ | ✓ |
| PUT /documents/:id | ✓ | ✓ | ✓ | ✗ |
| DELETE /documents/:id | ✓ | ✓ | ✗ | ✗ |
| POST /documents/:id/sub-documents | ✓ | ✓ | ✓ | ✗ |
| GET /documents/:id/sub-documents | ✓ | ✓ | ✓ | ✓ |

### Testing with Swagger

1. **Open Swagger UI**: Navigate to `http://localhost:5000/api-docs`
2. **Authorize**: Click "Authorize" button and enter your JWT token
3. **Select Endpoint**: Choose desired endpoint (e.g., POST /api/documents)
4. **Try It Out**: Click "Try it out" button
5. **Fill Request**: Enter request body with certificate fields:
   ```json
   {
     "title": "SHGB Certificate",
     "location": "Bali",
     "certificateType": "SHGB",
     "publishDate": "2025-12-08",
     "company": "JH",
     "landSize": "500 m²",
     "areaName": "Jimbaran Hijau Zone",
     "projectName": "Luxury Villas",
     "zoneUrl": "https://maps.google.com/?q=-8.7245,115.1689",
     "zoneRtdr": "001/2025",
     "expiredDate": "2030-12-08",
     "documentObtained": "2025-12-08",
     "originDocument": "SHGB-2025-001-JH",
     "previousOwner": "PT Bumi Pertiwi"
   }
   ```
6. **Execute**: Click "Execute" button
7. **View Response**: Check the response code, headers, and body

### Swagger Configuration Details

Located in: `backend/src/config/swagger.js`

**Configuration includes:**
- OpenAPI 3.0 specification
- JWT Bearer authentication scheme
- Complete Document and SubDocument schemas
- All 12 certificate metadata fields with descriptions
- Enum constraints for certificateType, company, status, userLevel
- Date format specifications
- URI format for location URLs
- Security requirements for all protected endpoints

**API Routes Documentation:**
- Swagger automatically generates documentation from route files in `backend/src/routes/`
- JSDoc comments in route handlers provide endpoint descriptions
- Request/response examples visible in Swagger UI

### Updating Swagger Documentation

To update Swagger documentation when making API changes:

1. **Update Schema**: Modify the Document/SubDocument schema in `swagger.js`
2. **Update Routes**: Add/modify JSDoc comments in route files
3. **Restart Server**: Changes take effect after server restart
4. **Verify UI**: Check Swagger UI for updated documentation

Example JSDoc in route:
```javascript
/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Create a new document
 *     description: Creates a new document with all certificate fields
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Document'
 *     responses:
 *       201:
 *         description: Document created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       400:
 *         description: Invalid input or validation error
 */
```

## Summary

The Document Management System API now provides comprehensive documentation through multiple channels:

1. **Swagger UI** - Interactive API exploration at `/api-docs`
2. **API_DOCUMENTATION.md** - Detailed written documentation (this file)
3. **Code Comments** - JSDoc documentation in source code
4. **Schema Definitions** - OpenAPI 3.0 complete schema definitions

All 12 certificate metadata fields are fully integrated, documented, and accessible through all documentation channels. The API is production-ready with complete validation, error handling, and security measures in place.

