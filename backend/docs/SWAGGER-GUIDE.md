# Swagger/OpenAPI Configuration Guide

## Overview

This guide explains the Swagger/OpenAPI configuration for the Document Management System API and how it documents all 12 certificate metadata fields.

## Configuration File Location

- **File**: `backend/src/config/swagger.js`
- **Size**: ~332 lines
- **Format**: OpenAPI 3.0.0 specification with swagger-jsdoc

## Configuration Structure

### 1. Basic API Information
```javascript
openapi: '3.0.0'
info:
  title: 'Document Management System API'
  version: '1.0.0'
  description: 'A comprehensive document management system with role-based access control'
```

### 2. Server Configuration
```javascript
servers:
  - url: http://localhost:5000/api (Development)
  - url: https://your-production-url.com/api (Production)
```

The server URL automatically adjusts based on `NODE_ENV` variable.

### 3. Security Schemes

#### Bearer Token Authentication
```javascript
securitySchemes:
  bearerAuth:
    type: 'http'
    scheme: 'bearer'
    bearerFormat: 'JWT'
```

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Component Schemas

#### Document Schema
The Document schema includes:

**Standard Fields:**
- `id`: integer - Document ID
- `title`: string - Document title (mandatory)
- `location`: string - Document location/category (mandatory)
- `filePath`: string - File path on server
- `status`: enum [active, archived, deleted]
- `createdBy`: integer - User ID who created
- `metadata`: object - Additional metadata
- `createdAt`: date-time - Creation timestamp
- `updatedAt`: date-time - Last update timestamp
- `creator`: object - Creator info with username

**12 Certificate Metadata Fields:**
1. **certificateType** (enum, mandatory)
   - Values: SHM, SHGB, SHGU, SHP, HPL, AJB, Girik, Others
   - Description: Certificate type designation

2. **landSize** (string, optional)
   - Example: "500 m²", "1 hectare", "250 sq ft"
   - Description: Land size measurement with units

3. **areaName** (string, optional)
   - Example: "Jimbaran Hijau Zone", "Zone A"
   - Description: Area name or zone designation

4. **projectName** (string, optional)
   - Example: "Luxury Beachfront Villas Phase 2"
   - Description: Associated project name

5. **zoneUrl** (uri, optional)
   - Example: "https://maps.google.com/?q=-8.7245,115.1689"
   - Description: Maps/location URL for the property

6. **zoneRtdr** (string, optional)
   - Example: "001/2025", "RT 001/RW 002"
   - Description: RT/RW designation or zone code

7. **publishDate** (date, mandatory)
   - Format: YYYY-MM-DD
   - Example: "2025-12-08"
   - Description: Certificate publication date

8. **expiredDate** (date, optional)
   - Format: YYYY-MM-DD
   - Example: "2030-12-08"
   - Description: Certificate expiration date

9. **documentObtained** (date, optional)
   - Format: YYYY-MM-DD
   - Example: "2025-12-08"
   - Description: Date document was obtained

10. **originDocument** (string, optional)
    - Example: "SHGB-2025-001-JH"
    - Description: Original document reference or serial number

11. **previousOwner** (string, optional)
    - Example: "PT Bumi Pertiwi Indonesia"
    - Description: Previous property owner name or entity

12. **company** (enum, mandatory)
    - Values: JH, JHT, BEP, PIJ
    - Description: Associated company code

#### SubDocument Schema
Identical to Document schema with all 12 certificate fields, supporting:
- `parentDocumentId`: Reference to parent document
- All certificate fields for sub-document level detail

#### User Schema
```
id: integer
username: string
email: string (format: email)
userLevel: enum [admin, level1, level2, level3]
lastLogin: date-time
createdAt: date-time
updatedAt: date-time
```

#### Error Schema
```
message: string - Error message
```

#### AuthResponse Schema
```
id: integer
username: string
email: string
userLevel: string
token: string (JWT token)
```

### 5. Global Security

All endpoints are secured with JWT Bearer authentication by default:
```javascript
security:
  - bearerAuth: []
```

Individual endpoints can override this setting.

## How Swagger Generates Documentation

### Method 1: Component Schemas (swagger.js)
Defines reusable schemas for Document, SubDocument, User, etc.

```javascript
components:
  schemas:
    Document: { ... 12 certificate fields ... }
    SubDocument: { ... 12 certificate fields ... }
```

### Method 2: JSDoc Comments (Route Files)
Route files in `backend/src/routes/` contain JSDoc comments that swagger-jsdoc parses:

```javascript
/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Create document
 *     tags: [Documents]
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
 *         description: Document created
 */
```

### Method 3: Automatic Route Parsing
Swagger configuration includes:
```javascript
apis: [
  './src/routes/*.js',
  './src/controllers/*.js'
]
```

This automatically parses all route files for JSDoc swagger annotations.

## Swagger UI Access

### Development
```
http://localhost:5000/api-docs
```
or
```
http://localhost:3000/api-docs (if running through proxy)
```

### Production
```
https://your-production-url.com/api-docs
```

## Key Features in Swagger UI

### 1. Interactive Testing
- **Try It Out**: Execute actual API requests
- **Request Body Editor**: Syntax-highlighted JSON editor
- **Response Display**: HTTP status, headers, body
- **Response Headers**: View response metadata

### 2. Authentication
- **Authorize Button**: Top-right corner
- **Token Input**: Paste your JWT token
- **Scope Selection**: Bearer token applied to all requests
- **Authorization Persistence**: Valid for current session

### 3. Field Validation
- **Mandatory Fields** (indicated with red asterisk):
  - title, location, certificateType, publishDate, company
- **Optional Fields**: Other 7 certificate fields
- **Enum Constraints**: Dropdown menus for:
  - certificateType: SHM, SHGB, SHGU, SHP, HPL, AJB, Girik, Others
  - company: JH, JHT, BEP, PIJ
  - status: active, archived, deleted
  - userLevel: admin, level1, level2, level3

### 4. Date Handling
- **Date Fields**: zoneUrl shows URI format
- **Date Picker**: Automatic date picker for:
  - publishDate, expiredDate, documentObtained
- **Format**: ISO 8601 (YYYY-MM-DD)

### 5. Endpoint Documentation
Each endpoint shows:
- **Summary**: Brief description
- **Tags**: Categorization (Documents, Auth, Users, etc.)
- **Security**: Required authentication
- **Parameters**: Path, query, header parameters
- **Request Schema**: Body structure with all fields
- **Response Schemas**: Success and error responses
- **HTTP Status Codes**: 200, 201, 400, 401, 403, 404, 500, etc.

## Testing with Swagger UI

### Step-by-Step Example: Create Document

1. **Open Swagger UI**
   ```
   http://localhost:5000/api-docs
   ```

2. **Authorize with JWT Token**
   - Click "Authorize" button (top-right)
   - Paste your JWT token in the value field
   - Click "Authorize"
   - Click "Close"

3. **Navigate to Create Document Endpoint**
   - Find "POST /api/documents" under Documents section
   - Click to expand

4. **Click "Try It Out"**
   - Request body editor becomes editable

5. **Enter Full Request Body**
   ```json
   {
     "title": "SHGB Certificate - Bali Property",
     "location": "Jimbaran, Bali, Indonesia",
     "certificateType": "SHGB",
     "publishDate": "2025-12-08",
     "company": "JH",
     "landSize": "500 m²",
     "areaName": "Jimbaran Hijau Zone",
     "projectName": "Luxury Beachfront Villas Phase 2",
     "zoneUrl": "https://maps.google.com/?q=-8.7245,115.1689",
     "zoneRtdr": "001/2025",
     "expiredDate": "2030-12-08",
     "documentObtained": "2025-12-08",
     "originDocument": "SHGB-2025-001-JH",
     "previousOwner": "PT Bumi Pertiwi Indonesia"
   }
   ```

6. **Click "Execute"**
   - Request is sent to API
   - Response displayed below
   - Check status code (should be 201)
   - Review response body with all fields

7. **View Response**
   - Full document returned with all 12 certificate fields
   - Database ID assigned
   - Timestamps generated
   - All fields persisted

### Common Swagger Operations

#### Test Filter by Certificate Type
```
GET /api/documents?certificateType=SHGB
```
- Returns only SHGB certificates
- Useful for filtering by certificate type

#### Test Filter by Company
```
GET /api/documents?company=JH
```
- Returns documents for specified company
- Available companies: JH, JHT, BEP, PIJ

#### Update Single Field
```
PUT /api/documents/142
```
Body:
```json
{
  "expiredDate": "2035-12-08"
}
```
- Only specified field is updated
- Other fields remain unchanged

#### Retrieve with SubDocuments
```
GET /api/documents/142
```
- Returns document with all 12 certificate fields
- Includes subDocuments array
- Each sub-document also has all 12 certificate fields

## Swagger Configuration Best Practices

### 1. Keep Descriptions Clear
```javascript
certificateType: {
  type: 'string',
  enum: ['SHM', 'SHGB', ...],
  description: 'Certificate type - required for property identification'
}
```

### 2. Use Format Specifications
```javascript
publishDate: {
  type: 'string',
  format: 'date',  // Triggers date picker in Swagger UI
  description: 'Certificate publication date in YYYY-MM-DD format'
}
```

### 3. Indicate Mandatory vs Optional
- Add to description: "(mandatory)" or "(optional)"
- Use required array in request schema

### 4. Provide Examples
```javascript
landSize: {
  type: 'string',
  example: '500 m²',
  description: 'Land size measurement'
}
```

### 5. Use References
```javascript
subDocuments: {
  type: 'array',
  items: {
    $ref: '#/components/schemas/SubDocument'  // Reuse schema
  }
}
```

## Troubleshooting Swagger

### Issue: Swagger UI not loading
**Solution**: 
- Ensure swagger-ui-express middleware is registered in app.js
- Check swagger.js configuration syntax
- Verify route files exist in src/routes/

### Issue: Authorization not persisting
**Solution**:
- Re-enter token after page refresh
- Ensure token format is correct (JWT)
- Check token expiration

### Issue: Missing endpoints
**Solution**:
- Verify JSDoc comments in route files
- Check that files are in src/routes/ directory
- Ensure swagger config includes the route pattern

### Issue: Incorrect schema display
**Solution**:
- Clear browser cache
- Restart development server
- Verify schema definition syntax in swagger.js

## Updating Swagger Documentation

### When Adding New Endpoint
1. Add JSDoc comment to route file
2. Include @swagger tag with endpoint definition
3. Reference appropriate schema
4. Add security requirements if protected
5. Restart server
6. Verify in Swagger UI

### When Modifying Document Schema
1. Edit Document schema in swagger.js
2. Update SubDocument schema if needed
3. Restart server
4. Test with Swagger UI

### When Adding New Certificate Field
1. Add field to Document schema in swagger.js
2. Add field to SubDocument schema
3. Update database migration
4. Update backend controller
5. Update frontend form
6. Document in API_DOCUMENTATION.md
7. Restart server

## Environment Variables

Swagger configuration uses:
- `NODE_ENV`: Determines server URL (development/production)
- `PORT`: API server port (default 5000)

Configuration in swagger.js:
```javascript
servers: [
  {
    url: process.env.NODE_ENV === 'production' 
      ? 'https://your-production-url.com/api' 
      : `http://localhost:${process.env.PORT || 5000}/api`
  }
]
```

## Related Documentation

- **API_DOCUMENTATION.md**: Complete API documentation
- **swagger.js**: Configuration file
- **Route Files**: JSDoc annotations in src/routes/
- **Controllers**: Endpoint implementations

## Summary

The Swagger/OpenAPI integration provides:

✅ Interactive API documentation with Try It Out functionality  
✅ Complete schema definitions for all 12 certificate fields  
✅ JWT authentication support with token management  
✅ Automatic route documentation from JSDoc comments  
✅ Real-time API testing in Swagger UI  
✅ Comprehensive request/response examples  
✅ Field validation and enum constraints  
✅ Date picker for date fields  
✅ Production-ready OpenAPI 3.0 specification  

All 12 certificate metadata fields are fully integrated and documented in Swagger for seamless API exploration and testing.
