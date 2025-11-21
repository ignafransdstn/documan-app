# Document Management System - Backend Documentation

## Tech Stack
- Node.js & Express.js
- PostgreSQL with Sequelize ORM
- JWT for Authentication
- Multer for File Upload
- Express Validator for Input Validation
- Swagger for API Documentation

## Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js      # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── documentController.js # Document management logic
│   │   └── userController.js     # User management logic
│   ├── middlewares/
│   │   ├── auth.js          # Authentication middleware
│   │   ├── upload.js        # File upload middleware
│   │   └── screenCapture.js # Screen capture prevention
│   ├── models/
│   │   ├── user.js          # User model
│   │   ├── document.js      # Document model
│   │   └── subDocument.js   # Sub-document model
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── documents.js     # Document routes
│   │   └── users.js         # User management routes
│   └── app.js               # Main application file
└── uploads/                 # Document storage directory
```

## Database Schema

### Users Table
\`\`\`sql
CREATE TABLE Users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  userLevel ENUM('admin', 'level1', 'level2', 'level3') DEFAULT 'level3',
  lastLogin TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
\`\`\`

### Documents Table
\`\`\`sql
CREATE TABLE Documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  filePath VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
  createdBy INTEGER REFERENCES Users(id),
  metadata JSONB DEFAULT '{}',
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);
\`\`\`

### SubDocuments Table
\`\`\`sql
CREATE TABLE SubDocuments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  filePath VARCHAR(255) NOT NULL,
  parentDocumentId INTEGER REFERENCES Documents(id),
  location VARCHAR(255) NOT NULL,
  status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);
\`\`\`

## API Documentation

### Authentication Endpoints

#### Register New User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
\`\`\`json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
\`\`\`
- **Success Response**: 
\`\`\`json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "userLevel": "string",
  "token": "string"
}
\`\`\`

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
\`\`\`json
{
  "username": "string",
  "password": "string"
}
\`\`\`
- **Success Response**:
\`\`\`json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "userLevel": "string",
  "token": "string"
}
\`\`\`

#### Refresh Token
- **URL**: `/api/auth/refresh-token`
- **Method**: `POST`
- **Auth Required**: Yes
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**:
\`\`\`json
{
  "token": "string"
}
\`\`\`

### Document Endpoints

#### Create Document
- **URL**: `/api/documents`
- **Method**: `POST`
- **Auth Required**: Yes
- **User Levels**: admin, level1, level2
- **Headers**: 
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`
- **Body**:
\`\`\`form-data
document: <file>
title: string
location: string
status: string (active|archived|deleted)
\`\`\`
- **Success Response**:
\`\`\`json
{
  "id": "number",
  "title": "string",
  "location": "string",
  "status": "string",
  "filePath": "string",
  "createdBy": "number",
  "metadata": "object"
}
\`\`\`

#### Get All Documents
- **URL**: `/api/documents`
- **Method**: `GET`
- **Auth Required**: Yes
- **User Levels**: All
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**:
\`\`\`json
[
  {
    "id": "number",
    "title": "string",
    "location": "string",
    "status": "string",
    "filePath": "string",
    "createdBy": "number",
    "creator": {
      "username": "string"
    },
    "subDocuments": ["array"]
  }
]
\`\`\`

#### Download Document
- **URL**: `/api/documents/download/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **User Levels**: admin, level1, level2
- **Headers**: `Authorization: Bearer <token>`
- **Response**: File download

### User Management Endpoints

#### Get All Users (Admin Only)
- **URL**: `/api/users`
- **Method**: `GET`
- **Auth Required**: Yes
- **User Levels**: admin
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**:
\`\`\`json
[
  {
    "id": "number",
    "username": "string",
    "email": "string",
    "userLevel": "string",
    "lastLogin": "date",
    "createdAt": "date"
  }
]
\`\`\`

#### Get User Sessions (Admin Only)
- **URL**: `/api/users/sessions`
- **Method**: `GET`
- **Auth Required**: Yes
- **User Levels**: admin
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**:
\`\`\`json
[
  {
    "id": "number",
    "username": "string",
    "userLevel": "string",
    "lastLogin": "date",
    "createdAt": "date"
  }
]
\`\`\`

## Security Features

### User Level Permissions

1. **Admin**
   - Full system access
   - Can perform all CRUD operations
   - Can register new users
   - Can view user sessions
   - Can change user levels

2. **Level 1**
   - Cannot register new users
   - Can create, read, update, delete documents
   - Can download documents
   - Can create sub-documents

3. **Level 2**
   - Cannot register new users
   - Can create, read, update documents
   - Cannot delete documents
   - Can download documents
   - Can create sub-documents

4. **Level 3**
   - Cannot register new users
   - Read-only access to documents
   - Cannot download documents
   - Cannot create sub-documents

### Security Measures
1. **Authentication**
   - JWT-based authentication
   - Token expiration
   - Refresh token mechanism

2. **File Upload Security**
   - File type validation
   - File size limits (10MB)
   - Secure file storage
   - Unique filename generation

3. **Screen Capture Prevention**
   - Content Security Policy headers
   - Anti-screenshot measures for non-admin users

4. **Database Security**
   - Password hashing with bcrypt
   - Soft delete implementation
   - SQL injection prevention with Sequelize

5. **API Security**
   - CORS protection
   - Rate limiting
   - Request validation
   - Error handling

## Environment Variables
Create a \`.env\` file in the root directory with the following variables:
\`\`\`env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=doc_management_dev
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
UPLOAD_PATH=./uploads
\`\`\`

## API Documentation

### Swagger UI
Interactive API documentation is available at:
- **Development**: `http://localhost:5000/api-docs`
- **Production**: `https://your-production-url.com/api-docs`

The Swagger documentation provides:
- Complete API endpoint reference
- Request/response schemas
- Authentication examples
- Interactive testing interface
- User permission requirements

### Additional Documentation
For detailed API information, see [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)

## Running the Application

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up the database:
\`\`\`bash
npx sequelize-cli db:migrate
\`\`\`

3. Start the server:
\`\`\`bash
# Development
npm run dev

# Production
npm start
\`\`\`

4. Access API documentation:
   - Open browser to `http://localhost:5000/api-docs`
   - Use the interactive interface to test endpoints