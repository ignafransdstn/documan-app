# Document Management System - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Edit .env file with your settings:
# - DATABASE_URL
# - JWT_SECRET
# - PORT (default: 5001)

# Run database migrations
npm run migrate

# Create admin user
npm run create-admin

# Start development server
npm run dev
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory  
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5001
- **API Documentation:** http://localhost:5001/api-docs

### Default Admin Credentials
```
Username: admin
Password: admin123
```

---

## 📁 Project Structure

```
document-management-system/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app setup
│   │   ├── config/             # Configuration files
│   │   ├── controllers/        # Request handlers
│   │   ├── middlewares/        # Auth, validation
│   │   ├── models/             # Sequelize models
│   │   ├── routes/             # API routes
│   │   └── scripts/            # Utility scripts
│   ├── tests/                  # Unit & E2E tests
│   ├── uploads/                # File storage
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── contexts/           # Context providers
│   │   ├── pages/              # Page components
│   │   ├── styles/             # CSS files
│   │   └── main.tsx            # Entry point
│   └── package.json
│
├── test-e2e.sh                 # E2E test script
├── FINAL-TEST-REPORT.md        # Test results
└── README.md
```

---

## 🔧 Configuration

### Backend Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/doc_management
DB_HOST=localhost
DB_PORT=5432
DB_NAME=doc_management
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:5001/api
```

---

## 🎯 Features

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin, Level1, Level2, Level3)
- ✅ Secure password hashing with bcrypt
- ✅ Token refresh mechanism
- ✅ Session management

### Document Management
- ✅ Upload documents with metadata
- ✅ Create sub-documents linked to master documents
- ✅ Edit document details
- ✅ Delete documents (cascade to sub-documents)
- ✅ Search and filter
- ✅ Status management (active/archived/deleted)
- ✅ GPS coordinates tracking (longitude/latitude)
- ✅ Map visualization with OpenStreetMap

### User Management (Admin)
- ✅ Create users with different permission levels
- ✅ Edit user details and permissions
- ✅ Activate/deactivate users
- ✅ Password reset functionality
- ✅ User activity tracking

### UI/UX
- ✅ Smooth page transitions (fade + slide + blur)
- ✅ Button hover animations
- ✅ Modal animations
- ✅ Active tab indicators
- ✅ Responsive design
- ✅ Loading states
- ✅ Error boundaries

---

## 🧪 Testing

### Run All Tests

```bash
cd backend
npm test
```

### Run E2E Tests

```bash
# Make sure backend is running on port 5001
cd backend && npm start

# In another terminal, run E2E tests
./test-e2e.sh
```

### Test Coverage

```bash
cd backend
npm run test:coverage
```

---

## 📊 API Endpoints

### Authentication

```
POST   /api/auth/signup         # Public user registration
POST   /api/auth/register       # Admin creates user (requires admin token)
POST   /api/auth/login          # User login
POST   /api/auth/logout         # User logout
POST   /api/auth/refresh-token  # Refresh JWT token
GET    /api/auth/profile        # Get user profile (requires token)
```

### Documents

```
GET    /api/documents           # Get all documents (requires token)
GET    /api/documents/:id       # Get document by ID
POST   /api/documents           # Create document (requires token)
PUT    /api/documents/:id       # Update document
DELETE /api/documents/:id       # Delete document
POST   /api/documents/:id/subdocuments  # Create sub-document
```

### Users (Admin Only)

```
GET    /api/users               # Get all users
GET    /api/users/:id           # Get user by ID
POST   /api/users               # Create user
PUT    /api/users/:id           # Update user
DELETE /api/users/:id           # Delete user
PATCH  /api/users/:id/activation  # Activate/deactivate user
POST   /api/users/:id/reset-password  # Reset user password
GET    /api/users/summary       # Get dashboard statistics
GET    /api/users/activity-logs # Get activity logs
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  user_level ENUM('admin', 'level1', 'level2', 'level3') DEFAULT 'level3',
  name VARCHAR(255),
  is_approved BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  last_logout TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Documents Table
```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  document_no VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  longitude DECIMAL(10,7),
  latitude DECIMAL(10,7),
  description VARCHAR(350),
  status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
  created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### SubDocuments Table
```sql
CREATE TABLE sub_documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  sub_document_no VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  parent_document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  location VARCHAR(255) NOT NULL,
  longitude DECIMAL(10,7),
  latitude DECIMAL(10,7),
  description VARCHAR(350),
  status ENUM('active', 'archived', 'deleted') DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

---

## 🔐 Security

### Implemented Security Features

1. **Authentication**
   - JWT tokens with expiration
   - Secure password hashing (bcrypt, 10 rounds)
   - Token refresh mechanism

2. **Authorization**
   - Role-based access control
   - Protected routes middleware
   - Permission level enforcement

3. **Input Validation**
   - Email format validation
   - Password strength requirements
   - Username format rules
   - Request payload validation

4. **File Upload Security**
   - File type validation
   - Size limits (10MB default)
   - Sanitized filenames
   - Secure storage paths

5. **API Security**
   - CORS configuration
   - SQL injection prevention (Sequelize ORM)
   - XSS prevention
   - Rate limiting (recommended for production)

---

## 📦 Deployment

### Production Build

#### Backend
```bash
cd backend

# Set NODE_ENV to production
export NODE_ENV=production

# Install production dependencies only
npm ci --production

# Run database migrations
npm run migrate

# Start server
npm start
```

#### Frontend
```bash
cd frontend

# Build for production
npm run build

# Output will be in dist/ folder
# Serve with nginx, Apache, or any static file server
```

### Docker Deployment (Optional)

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: doc_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/doc_management
      JWT_SECRET: your-secret-key
      NODE_ENV: production
    ports:
      - "5001:5001"
    volumes:
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 🔍 Monitoring & Logging

### Recommended Tools
- **Application Monitoring:** PM2, New Relic, DataDog
- **Error Tracking:** Sentry
- **Logging:** Winston, Morgan
- **Performance:** Lighthouse, Web Vitals

### Health Checks

```bash
# Backend health
curl http://localhost:5001/api/users/summary

# Expected: 200 OK with statistics
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** 
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database credentials

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5001
```
**Solution:**
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9

# Or change PORT in .env
```

#### 3. JWT Token Invalid
```
Error: Invalid token
```
**Solution:**
- Check JWT_SECRET matches between requests
- Verify token hasn't expired
- Clear browser storage and re-login

#### 4. File Upload Fails
```
Error: File too large
```
**Solution:**
- Check MAX_FILE_SIZE in .env
- Ensure upload directory has write permissions
- Verify file type is allowed

---

## 📚 Additional Resources

- **API Documentation:** http://localhost:5001/api-docs (Swagger UI)
- **Test Report:** See FINAL-TEST-REPORT.md
- **GitHub Issues:** [Create issue](https://github.com/your-repo/issues)

---

## 👥 User Roles & Permissions

### Admin
- Full access to all features
- Can create/edit/delete users
- Can manage all documents
- Can view activity logs
- Can reset user passwords

### Level 1
- Can create/edit/delete documents
- Can upload files
- Can manage sub-documents
- Cannot manage users

### Level 2
- Can create/edit documents
- Can upload files
- Cannot delete documents
- Cannot manage users

### Level 3 (Read Only)
- Can view documents
- Cannot create/edit/delete
- Cannot upload files
- Cannot manage users

---

## 📝 License

This project is licensed under the MIT License.

---

## 🤝 Support

For issues or questions:
1. Check FINAL-TEST-REPORT.md for known issues
2. Review API documentation at /api-docs
3. Check application logs
4. Contact development team

---

**Version:** 1.0.0  
**Last Updated:** November 21, 2025  
**Status:** ✅ Production Ready
