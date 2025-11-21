# Backend Documentation - DocuMan

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [API Endpoints](#api-endpoints)
5. [Database Models](#database-models)
6. [Middlewares](#middlewares)
7. [Authentication & Authorization](#authentication--authorization)
8. [File Upload System](#file-upload-system)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

---

## 🏗️ Architecture Overview

Backend menggunakan **MVC (Model-View-Controller)** pattern dengan struktur sebagai berikut:

```
Request → Routes → Middlewares → Controllers → Models → Database
                                      ↓
                                  Response
```

### Technology Stack

- **Node.js** 18+ - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM untuk PostgreSQL
- **JWT** - Token-based authentication
- **Multer** - File upload handling
- **Bcrypt** - Password hashing
- **Swagger** - API documentation
- **Jest** - Testing framework

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                      # Express app initialization
│   ├── config/
│   │   ├── database.js             # Sequelize config
│   │   └── swagger.js              # Swagger/OpenAPI setup
│   ├── controllers/
│   │   ├── authController.js       # Authentication logic
│   │   ├── documentController.js   # Document CRUD operations
│   │   └── userController.js       # User management
│   ├── middlewares/
│   │   ├── auth.js                 # JWT verification & RBAC
│   │   ├── screenCapture.js        # Anti-screenshot headers
│   │   └── validators.js           # Input validation rules
│   ├── models/
│   │   ├── index.js                # Sequelize initialization
│   │   ├── user.js                 # User model
│   │   ├── document.js             # Document model
│   │   ├── subDocument.js          # SubDocument model
│   │   └── activityLog.js          # ActivityLog model
│   ├── routes/
│   │   ├── auth.js                 # Auth endpoints
│   │   ├── documents.js            # Document endpoints
│   │   └── users.js                # User endpoints
│   └── scripts/
│       └── createAdmin.js          # Admin user creation script
├── tests/                          # Test suites
├── uploads/                        # File storage directory
├── .env                            # Environment variables
├── jest.config.js                  # Jest configuration
└── package.json
```

---

## 🔧 Core Components

### 1. app.js - Application Entry Point

```javascript
// Key responsibilities:
- Initialize Express app
- Setup middlewares (CORS, JSON parser, etc)
- Configure Sequelize database connection
- Register API routes
- Setup error handling
- Start HTTP server
```

**Important Features:**
- **CORS Configuration** - Allow cross-origin requests from frontend
- **Body Parser** - Parse JSON and URL-encoded data
- **Static Files** - Serve uploaded files
- **Swagger UI** - API documentation at `/api-docs`
- **Health Check** - Database connection verification

### 2. Database Configuration

**File:** `src/config/database.js`

```javascript
module.exports = {
  development: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false
  },
  test: {
    dialect: 'postgres',
    database: 'doc_management_test',
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
}
```

---

## 🛣️ API Endpoints

### Authentication Endpoints

#### POST /api/auth/signup
**Public endpoint** untuk user registration

```javascript
Request Body:
{
  "username": "string (required, no spaces)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars, 1 uppercase, 1 number)"
}

Response: 201 Created
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "userLevel": "level3",
  "token": "eyJhbGci..."
}
```

**Validation Rules:**
- Username: No spaces, alphanumeric + underscore
- Email: Valid email format
- Password: Min 8 characters, 1 uppercase, 1 number

#### POST /api/auth/login
User authentication

```javascript
Request Body:
{
  "username": "string",
  "password": "string"
}

Response: 200 OK
{
  "id": 1,
  "username": "admin",
  "userLevel": "admin",
  "token": "eyJhbGci..."
}
```

**Process Flow:**
1. Find user by username
2. Verify password with bcrypt
3. Check if user is active (`isActive: true`)
4. Generate JWT token
5. Update `lastLogin` timestamp
6. Log LOGIN activity
7. Return user data + token

#### POST /api/auth/register
**Admin only** - Create user dengan custom role

```javascript
Headers:
Authorization: Bearer <admin-token>

Request Body:
{
  "username": "string",
  "email": "string",
  "password": "string",
  "userLevel": "admin|level1|level2|level3"
}

Response: 201 Created
```

**Authorization:**
- Requires valid JWT token
- Requires admin role (`userLevel: 'admin'`)

#### POST /api/auth/logout
Logout user dan update timestamp

```javascript
Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Logout successful"
}
```

**Process:**
1. Verify JWT token
2. Update `lastLogout` timestamp
3. Log LOGOUT activity

#### GET /api/auth/profile
Get current user profile

```javascript
Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "userLevel": "admin",
  "name": "Administrator",
  "isActive": true,
  "lastLogin": "2025-11-21T10:00:00.000Z"
}
```

---

### Document Endpoints

#### GET /api/documents
List all documents dengan sub-documents

```javascript
Headers:
Authorization: Bearer <token>

Query Parameters:
- search: string (optional) - Search by title/description
- status: active|archived|deleted (optional)

Response: 200 OK
[
  {
    "id": 1,
    "documentNo": "MD-000001",
    "title": "Document Title",
    "location": "Jakarta, Indonesia",
    "longitude": 106.8456,
    "latitude": -6.2088,
    "description": "Document description",
    "status": "active",
    "filePath": "/uploads/file.pdf",
    "creator": {
      "username": "admin"
    },
    "subDocuments": [
      {
        "id": 1,
        "title": "Sub Document",
        "subDocumentNo": "SUB-001",
        ...
      }
    ],
    "createdAt": "2025-11-21T10:00:00.000Z"
  }
]
```

**Features:**
- Include sub-documents automatically
- Include creator username
- Order by createdAt DESC
- Exclude soft-deleted documents

#### POST /api/documents
Create new master document

```javascript
Headers:
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request Body (FormData):
- file: File (required, PDF only, max 10MB)
- title: string (required)
- location: string (required)
- longitude: number (optional)
- latitude: number (optional)
- description: string (optional)

Response: 201 Created
{
  "id": 1,
  "documentNo": "MD-000001",
  "title": "New Document",
  ...
}
```

**Process Flow:**
1. Verify user authentication
2. Check user has permission (not level3)
3. Validate file (type, size)
4. Generate unique document number
5. Save file to uploads/ directory
6. Create database record
7. Log CREATE activity
8. Return created document

**Business Logic - Document Number:**
```javascript
// Format: MD-XXXXXX (6 digits, zero-padded)
// Example: MD-000001, MD-000023, MD-001234

const lastDoc = await Document.findOne({
  order: [['createdAt', 'DESC']]
});

let nextNumber = 1;
if (lastDoc && lastDoc.documentNo) {
  const lastNum = parseInt(lastDoc.documentNo.split('-')[1]);
  nextNumber = lastNum + 1;
}

const documentNo = `MD-${String(nextNumber).padStart(6, '0')}`;
```

#### PUT /api/documents/:id
Update document details

```javascript
Headers:
Authorization: Bearer <token>

Request Body:
{
  "title": "string (optional)",
  "location": "string (optional)",
  "longitude": number (optional),
  "latitude": number (optional),
  "description": "string (optional)"
}

Response: 200 OK
```

**Permissions:**
- Admin: Can update any document
- Level1: Can update any document
- Level2: Can update any document
- Level3: Cannot update (403 Forbidden)

#### DELETE /api/documents/:id
Delete document dan cascade sub-documents

```javascript
Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Document deleted successfully"
}
```

**Process:**
1. Find document
2. Check user permission (admin or level1 only)
3. Delete file from filesystem
4. Soft delete document (set deletedAt)
5. Cascade delete sub-documents
6. Log DELETE activity

**Permissions:**
- Admin: ✅ Can delete
- Level1: ✅ Can delete
- Level2: ❌ Cannot delete
- Level3: ❌ Cannot delete

#### POST /api/documents/:id/subdocuments
Add sub-document to master document

```javascript
Headers:
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request Body:
- file: File (required)
- title: string (required)
- subDocumentNo: string (required)
- location: string (required)
- longitude: number (optional)
- latitude: number (optional)
- description: string (optional)

Response: 201 Created
```

**Validation:**
- Parent document must exist
- User must have permission
- File required
- Auto-inherit location if not provided

---

### User Management Endpoints (Admin Only)

#### GET /api/users
List all users

```javascript
Headers:
Authorization: Bearer <admin-token>

Response: 200 OK
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "userLevel": "admin",
    "isActive": true,
    "lastLogin": "2025-11-21T10:00:00.000Z"
  }
]
```

**Excluded Fields:** password, createdAt, updatedAt

#### POST /api/users
Create new user (Admin only)

```javascript
Headers:
Authorization: Bearer <admin-token>

Request Body:
{
  "username": "string",
  "email": "string",
  "password": "string",
  "userLevel": "admin|level1|level2|level3",
  "name": "string (optional)"
}

Response: 201 Created
```

#### PUT /api/users/:id
Update user details

```javascript
Headers:
Authorization: Bearer <admin-token>

Request Body:
{
  "email": "string (optional)",
  "name": "string (optional)",
  "userLevel": "string (optional)"
}

Response: 200 OK
```

**Note:** Password update harus via endpoint terpisah

#### DELETE /api/users/:id
Delete user account

```javascript
Headers:
Authorization: Bearer <admin-token>

Response: 200 OK
{
  "message": "User deleted successfully"
}
```

**Restrictions:**
- Cannot delete self
- Cannot delete if user owns documents

#### PATCH /api/users/:id/activation
Toggle user active status

```javascript
Headers:
Authorization: Bearer <admin-token>

Request Body:
{
  "active": boolean
}

Response: 200 OK
{
  "id": 1,
  "isActive": false,
  "message": "User deactivated successfully"
}
```

**Effect:**
- Deactivated users cannot login
- Existing sessions remain valid until token expires

#### POST /api/users/:id/reset-password
Reset user password (Admin only)

```javascript
Headers:
Authorization: Bearer <admin-token>

Request Body:
{
  "newPassword": "string (min 8 chars)"
}

Response: 200 OK
{
  "message": "Password reset successfully"
}
```

#### GET /api/users/summary
Dashboard statistics

```javascript
Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "totalUsers": 10,
  "admins": 2,
  "level1": 3,
  "level2": 3,
  "level3": 2,
  "pendingAdmins": 0,
  "totalDocuments": 50,
  "totalMasterDocuments": 35,
  "totalSubDocuments": 15,
  "activeSessions": 5,
  "recentDocuments": [...]
}
```

**Active Sessions Calculation:**
```javascript
// Count users dengan lastLogin > lastLogout
const activeSessions = await User.count({
  where: {
    [Op.or]: [
      { lastLogout: null },
      sequelize.where(
        sequelize.col('lastLogin'),
        Op.gt,
        sequelize.col('lastLogout')
      )
    ]
  }
});
```

#### GET /api/users/activity-logs
Activity audit trail

```javascript
Headers:
Authorization: Bearer <admin-token>

Query Parameters:
- limit: number (default: 50)
- userId: number (optional)
- action: LOGIN|LOGOUT|CREATE|UPDATE|DELETE (optional)

Response: 200 OK
[
  {
    "id": 1,
    "userId": 1,
    "action": "LOGIN",
    "description": "User logged in",
    "entityType": "user",
    "entityId": 1,
    "ipAddress": "127.0.0.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2025-11-21T10:00:00.000Z",
    "user": {
      "username": "admin"
    }
  }
]
```

**Logged Actions:**
- LOGIN - User authentication
- LOGOUT - User logout
- CREATE - Document/User creation
- UPDATE - Document/User modification
- DELETE - Document/User deletion
- VIEW - Document viewing
- DOWNLOAD - File download

---

## 🗄️ Database Models

### User Model

**File:** `src/models/user.js`

```javascript
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  userLevel: {
    type: DataTypes.ENUM('admin', 'level1', 'level2', 'level3'),
    allowNull: false,
    defaultValue: 'level3'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLogout: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'Users'
});
```

**Hooks:**
```javascript
// Before create: Hash password
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Before update: Hash password if changed
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});
```

**Instance Methods:**
```javascript
// Verify password
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Generate JWT token
User.prototype.generateToken = function() {
  return jwt.sign(
    { 
      id: this.id, 
      username: this.username, 
      userLevel: this.userLevel 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};
```

### Document Model

**File:** `src/models/document.js`

```javascript
const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  documentNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(350),
    defaultValue: ''
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'deleted'),
    defaultValue: 'active'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  paranoid: true, // Soft delete
  tableName: 'Documents'
});
```

**Associations:**
```javascript
Document.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Document.hasMany(SubDocument, { 
  foreignKey: 'parentDocumentId', 
  as: 'subDocuments',
  onDelete: 'CASCADE'
});
```

**Metadata Structure:**
```javascript
{
  "size": 1024567,           // File size in bytes
  "mimeType": "application/pdf",
  "originalName": "document.pdf",
  "uploadedAt": "2025-11-21T10:00:00.000Z"
}
```

### SubDocument Model

**File:** `src/models/subDocument.js`

```javascript
const SubDocument = sequelize.define('SubDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subDocumentNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parentDocumentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Documents',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(350),
    defaultValue: ''
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'deleted'),
    defaultValue: 'active'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'SubDocuments'
});
```

**Associations:**
```javascript
SubDocument.belongsTo(Document, { 
  foreignKey: 'parentDocumentId', 
  as: 'parentDocument' 
});
```

### ActivityLog Model

**File:** `src/models/activityLog.js`

```javascript
const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM(
      'LOGIN', 'LOGOUT', 'CREATE', 
      'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD'
    ),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'document, subdocument, user, etc'
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  updatedAt: false,
  tableName: 'ActivityLogs'
});
```

**Usage:**
```javascript
await ActivityLog.create({
  userId: req.user.id,
  action: 'CREATE',
  entityType: 'document',
  entityId: document.id,
  description: `Created document: ${document.title}`,
  ipAddress: req.ip,
  userAgent: req.get('user-agent')
});
```

---

## 🛡️ Middlewares

### 1. Authentication Middleware

**File:** `src/middlewares/auth.js`

#### verifyToken
Verify JWT token dan attach user to request

```javascript
const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'Invalid or inactive user' 
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Invalid token' 
    });
  }
};
```

#### isAdmin
Check if user is admin

```javascript
const isAdmin = (req, res, next) => {
  if (req.user.userLevel !== 'admin') {
    return res.status(403).json({ 
      message: 'Admin access required' 
    });
  }
  next();
};
```

#### canManageDocuments
Check document management permissions

```javascript
const canManageDocuments = (req, res, next) => {
  const userLevel = req.user.userLevel;
  
  // Level3 cannot manage documents
  if (userLevel === 'level3') {
    return res.status(403).json({ 
      message: 'Insufficient permissions' 
    });
  }
  
  next();
};
```

#### canDeleteDocuments
Check delete permissions

```javascript
const canDeleteDocuments = (req, res, next) => {
  const userLevel = req.user.userLevel;
  
  // Only admin and level1 can delete
  if (userLevel !== 'admin' && userLevel !== 'level1') {
    return res.status(403).json({ 
      message: 'Delete permission required' 
    });
  }
  
  next();
};
```

### 2. Screen Capture Protection

**File:** `src/middlewares/screenCapture.js`

```javascript
const preventScreenCapture = (req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
};
```

### 3. Input Validation

**File:** `src/middlewares/validators.js`

#### signupValidation
Validate signup request

```javascript
const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be alphanumeric'),
    
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
    
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must have 8+ chars, 1 uppercase, 1 number')
];
```

#### validateResult
Check validation errors

```javascript
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  
  next();
};
```

---

## 🔐 Authentication & Authorization

### JWT Token Structure

```javascript
{
  "id": 1,
  "username": "admin",
  "userLevel": "admin",
  "iat": 1700000000,
  "exp": 1700086400
}
```

**Token Lifetime:** 24 hours

### Password Hashing

```javascript
// Hashing (on create/update)
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// Verification (on login)
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Session Management

**Active Session Detection:**
```javascript
// User is considered "active" if:
// 1. lastLogout is null (never logged out), OR
// 2. lastLogin > lastLogout (logged in after last logout)

const isSessionActive = !user.lastLogout || 
                        user.lastLogin > user.lastLogout;
```

**Login Flow:**
```
1. Verify credentials (username + password)
2. Check user.isActive === true
3. Generate JWT token
4. Update user.lastLogin = NOW()
5. Create ActivityLog (action: LOGIN)
6. Return user data + token
```

**Logout Flow:**
```
1. Verify JWT token
2. Update user.lastLogout = NOW()
3. Create ActivityLog (action: LOGOUT)
4. Return success message
```

---

## 📤 File Upload System

### Multer Configuration

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});
```

### Upload Process

```javascript
// 1. Receive file upload
POST /api/documents
Content-Type: multipart/form-data

// 2. Validate file
- Type: application/pdf
- Size: <= 10MB

// 3. Generate unique filename
filename = timestamp-randomnumber.pdf
Example: 1700000000000-123456789.pdf

// 4. Save to uploads/ directory
filePath = /uploads/1700000000000-123456789.pdf

// 5. Store metadata in database
metadata: {
  size: file.size,
  mimeType: file.mimetype,
  originalName: file.originalname
}
```

### File Deletion

```javascript
// On document delete:
1. Get filePath from database
2. Delete file from filesystem
   fs.unlinkSync(filePath)
3. Soft delete document record
   document.destroy() // Sets deletedAt
4. Cascade delete sub-documents
```

---

## ⚠️ Error Handling

### Global Error Handler

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large (max 10MB)'
      });
    }
  }
  
  // Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors.map(e => e.message)
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Duplicate entry'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired'
    });
  }
  
  // Default error
  res.status(500).json({
    message: 'Internal server error'
  });
});
```

### Common Error Responses

```javascript
// 400 Bad Request
{
  "message": "Validation failed",
  "errors": [...]
}

// 401 Unauthorized
{
  "message": "No token provided"
}

// 403 Forbidden
{
  "message": "Insufficient permissions"
}

// 404 Not Found
{
  "message": "Document not found"
}

// 500 Internal Server Error
{
  "message": "Internal server error"
}
```

---

## 🧪 Testing

### Test Structure

```
tests/
├── setup.js                  # Test environment setup
├── helpers.js                # Test utilities
├── auth.test.js              # Authentication tests
├── user.test.js              # User management tests
├── document.test.js          # Document CRUD tests
├── authorization.test.js     # Permission tests
├── validation.test.js        # Input validation tests
└── e2e.test.js              # End-to-end tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test auth.test.js

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### Test Database

```javascript
// Separate test database
Database: doc_management_test

// Before each test suite:
- Drop all tables
- Recreate schema
- Sync models

// After each test:
- Clean database (optional)

// After all tests:
- Close database connection
```

### Sample Test

```javascript
describe('POST /api/auth/login', () => {
  it('should login successfully', async () => {
    // Create test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      userLevel: 'level1'
    });
    
    // Login request
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'Password123'
      });
    
    // Assertions
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.username).toBe('testuser');
  });
});
```

---

## 📊 Performance Considerations

### Database Optimization

```javascript
// 1. Indexes
- username (unique index)
- email (unique index)
- documentNo (unique index)
- createdBy (foreign key index)
- parentDocumentId (foreign key index)

// 2. Eager Loading
Document.findAll({
  include: [
    { model: User, as: 'creator' },
    { model: SubDocument, as: 'subDocuments' }
  ]
});

// 3. Pagination
const { limit, offset } = req.query;
Document.findAndCountAll({ 
  limit, 
  offset 
});

// 4. Selective Fields
User.findAll({
  attributes: { exclude: ['password'] }
});
```

### Caching Strategy (Recommended)

```javascript
// Redis cache for:
- User sessions
- Frequently accessed documents
- Dashboard statistics

// Cache TTL:
- User data: 1 hour
- Documents: 5 minutes
- Stats: 10 minutes
```

---

## 🔒 Security Best Practices

### 1. Environment Variables
```bash
# Never commit .env file
# Use strong random JWT_SECRET
# Rotate secrets regularly
```

### 2. SQL Injection Prevention
```javascript
// ✅ Good: Use Sequelize ORM
User.findOne({ where: { username } });

// ❌ Bad: Raw SQL with user input
sequelize.query(`SELECT * FROM users WHERE username = '${username}'`);
```

### 3. XSS Prevention
```javascript
// Sanitize user input
// Use Content-Security-Policy headers
// Escape output in templates
```

### 4. CSRF Protection
```javascript
// Use CSRF tokens for state-changing operations
// Verify origin headers
```

### 5. Rate Limiting (Recommended)
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 📝 API Documentation

**Swagger UI:** http://localhost:5001/api-docs

**OpenAPI Specification:** Available at `/api-docs/swagger.json`

### Accessing Swagger

```bash
# Start backend server
npm start

# Open browser
http://localhost:5001/api-docs
```

**Features:**
- Interactive API testing
- Request/response examples
- Schema validation
- Authentication testing

---

## 🚀 Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET
- [ ] Configure DATABASE_URL
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Configure file upload limits
- [ ] Enable logging
- [ ] Set up monitoring
- [ ] Configure backup strategy
- [ ] Test all endpoints
- [ ] Review security headers
- [ ] Enable rate limiting

---

**Version:** 1.0.0  
**Last Updated:** November 21, 2025  
**Maintained by:** Backend Development Team
