# API Documentation

## Overview
This document provides comprehensive information about the Document Management System API. The API is built using Express.js and provides endpoints for authentication, document management, and user administration.

## Interactive Documentation
The API documentation is available through Swagger UI at:
- **Development**: `http://localhost:5000/api-docs`
- **Production**: `https://your-production-url.com/api-docs`

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
- Document CRUD operations
- Document download
- Sub-document creation
- Cannot register new users

### Level 2
- Document create, read, update (no delete)
- Document download
- Sub-document creation
- Cannot register new users

### Level 3
- Read-only document access
- Cannot download documents
- Cannot create sub-documents
- Cannot register new users

## API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /refresh-token` - Refresh JWT token
- `GET /profile` - Get user profile
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