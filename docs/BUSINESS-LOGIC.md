# Business Logic & Process Flow Documentation - DocuMan

## 📋 Table of Contents

1. [Business Overview](#business-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Document Lifecycle](#document-lifecycle)
4. [User Workflows](#user-workflows)
5. [Business Rules](#business-rules)
6. [Process Flow Diagrams](#process-flow-diagrams)
7. [Permission Logic](#permission-logic)
8. [Activity Tracking](#activity-tracking)

---

## 🏢 Business Overview

### System Purpose

DocuMan adalah sistem manajemen dokumen yang dirancang untuk:
- **Penyimpanan Terpusat**: Semua dokumen disimpan dalam satu sistem
- **Kontrol Akses**: Hak akses berbasis level pengguna
- **Pelacakan Aktivitas**: Semua tindakan dicatat dalam audit log
- **Organisasi Hierarkis**: Dokumen master dengan sub-dokumen
- **Keamanan Data**: Proteksi terhadap screenshot dan akses tidak sah

### Core Business Functions

1. **Document Management**
   - Upload dokumen (PDF)
   - Kategorisasi dengan metadata
   - Tracking lokasi geografis
   - Struktur master-sub document

2. **User Management**
   - 4 level pengguna (Admin, Level 1-3)
   - Manajemen hak akses
   - Aktivasi/deaktivasi user
   - Password reset

3. **Access Control**
   - Role-based permissions
   - Document-level permissions
   - Action-level permissions

4. **Activity Monitoring**
   - Login/logout tracking
   - Document actions logging
   - User activity reports

---

## 👥 User Roles & Permissions

### Permission Matrix

| Action | Admin | Level 1 | Level 2 | Level 3 |
|--------|-------|---------|---------|---------|
| **Document Viewing** |
| View Documents | ✅ | ✅ | ✅ | ✅ |
| View File Content | ✅ | ✅ | ✅ | ✅ |
| Download Files | ✅ | ✅ | ✅ | ✅ |
| **Document Management** |
| Create Documents | ✅ | ✅ | ✅ | ❌ |
| Edit Documents | ✅ | ✅ | ❌ | ❌ |
| Delete Documents | ✅ | ❌ | ❌ | ❌ |
| Create Sub-Documents | ✅ | ✅ | ✅ | ❌ |
| **User Management** |
| View Users | ✅ | ❌ | ❌ | ❌ |
| Create Users | ✅ | ❌ | ❌ | ❌ |
| Edit Users | ✅ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ |
| Reset Password | ✅ | ❌ | ❌ | ❌ |
| **Dashboard** |
| View Statistics | ✅ | ✅ | ✅ | ✅ |
| View Activity Logs | ✅ | ❌ | ❌ | ❌ |

### Role Descriptions

**1. Admin**
- **Hak Akses**: Full control system
- **Tanggung Jawab**: 
  - Manajemen pengguna
  - Konfigurasi sistem
  - Monitoring aktivitas
  - Backup & maintenance
- **Restrictions**: None

**2. Level 1 (Manager)**
- **Hak Akses**: Manajemen dokumen penuh
- **Tanggung Jawab**:
  - Upload dokumen
  - Edit dokumen
  - Organisasi dokumen
- **Restrictions**: 
  - Tidak bisa delete dokumen
  - Tidak bisa manage users

**3. Level 2 (Staff)**
- **Hak Akses**: Create & view documents
- **Tanggung Jawab**:
  - Upload dokumen baru
  - View existing documents
- **Restrictions**:
  - Tidak bisa edit dokumen
  - Tidak bisa delete dokumen
  - Tidak bisa manage users

**4. Level 3 (Viewer)**
- **Hak Akses**: Read-only
- **Tanggung Jawab**:
  - View documents
  - Download files
- **Restrictions**:
  - Tidak bisa create/edit/delete
  - Tidak bisa manage users

---

## 📄 Document Lifecycle

### Document States

```
┌─────────────┐
│   ACTIVE    │ ← Default state saat upload
└─────────────┘
      │
      ├──────→ ┌─────────────┐
      │        │  ARCHIVED   │ ← Dokumen lama (future feature)
      │        └─────────────┘
      │
      └──────→ ┌─────────────┐
               │   DELETED   │ ← Soft delete
               └─────────────┘
```

### Document Creation Process

```
┌──────────────────────────────────────────────────────────────┐
│                   DOCUMENT CREATION FLOW                      │
└──────────────────────────────────────────────────────────────┘

1. User Click "Upload Document"
   │
   ├─→ Choose Document Type
   │   ├─→ Master Document
   │   └─→ Sub Document (requires parent)
   │
2. Fill Metadata
   │
   ├─→ Title (required)
   ├─→ Location (required)
   ├─→ Longitude (optional)
   ├─→ Latitude (optional)
   ├─→ Description (required)
   └─→ Select PDF file (required, max 10MB)
   │
3. Submit Form
   │
   ├─→ Validate Input
   │   ├─→ Check required fields
   │   ├─→ Validate file type (PDF only)
   │   └─→ Check file size (max 10MB)
   │
4. Backend Processing
   │
   ├─→ Generate Document Number
   │   ├─→ Master: DOC-YYYYMMDD-XXXX
   │   └─→ Sub: [ParentNo]-SUB-XXX
   │
   ├─→ Save File to uploads/
   │
   ├─→ Create Database Record
   │   ├─→ Store metadata
   │   ├─→ Store file path
   │   └─→ Link creator (createdBy)
   │
   └─→ Log Activity
       └─→ Action: CREATE
   │
5. Response
   │
   ├─→ Success: Return document object
   └─→ Error: Return error message
   │
6. UI Update
   │
   ├─→ Reload document list
   ├─→ Close upload form
   └─→ Show success message
```

### Document Edit Process

```
┌──────────────────────────────────────────────────────────────┐
│                    DOCUMENT EDIT FLOW                         │
└──────────────────────────────────────────────────────────────┘

1. User Click "Edit" on Document
   │
   ├─→ Check Permission
   │   ├─→ Admin: ✅ Allowed
   │   ├─→ Level 1: ✅ Allowed
   │   ├─→ Level 2: ❌ Forbidden
   │   └─→ Level 3: ❌ Forbidden
   │
2. Open Edit Modal
   │
   └─→ Pre-fill existing data
       ├─→ Title
       ├─→ Location
       ├─→ Longitude
       ├─→ Latitude
       └─→ Description
   │
3. User Modify Fields
   │
4. Submit Changes
   │
   ├─→ Validate Input
   │   └─→ Check required fields
   │
5. Backend Processing
   │
   ├─→ Check Permission (middleware)
   │
   ├─→ Find Document
   │   ├─→ Not Found: 404 Error
   │   └─→ Found: Continue
   │
   ├─→ Update Record
   │   ├─→ Update metadata
   │   └─→ Update timestamp
   │
   └─→ Log Activity
       └─→ Action: UPDATE
   │
6. Response
   │
   ├─→ Success: Return updated document
   └─→ Error: Return error message
   │
7. UI Update
   │
   ├─→ Reload document list
   ├─→ Close edit modal
   └─→ Show success message
```

### Document Deletion Process

```
┌──────────────────────────────────────────────────────────────┐
│                   DOCUMENT DELETE FLOW                        │
└──────────────────────────────────────────────────────────────┘

1. User Click "Delete" on Document
   │
   ├─→ Check Permission
   │   ├─→ Admin: ✅ Allowed
   │   └─→ Others: ❌ Forbidden
   │
2. Show Confirmation Dialog
   │
   └─→ "Are you sure want to delete?"
       ├─→ Cancel: Abort
       └─→ Confirm: Continue
   │
3. Submit Delete Request
   │
4. Backend Processing
   │
   ├─→ Check Permission (middleware)
   │
   ├─→ Find Document
   │   ├─→ Not Found: 404 Error
   │   └─→ Found: Continue
   │
   ├─→ Check Sub-Documents
   │   ├─→ Has Sub-Docs: Delete all (CASCADE)
   │   └─→ No Sub-Docs: Continue
   │
   ├─→ Delete Physical File
   │   └─→ Remove from uploads/
   │
   ├─→ Delete Database Record
   │
   └─→ Log Activity
       └─→ Action: DELETE
   │
5. Response
   │
   ├─→ Success: 200 OK
   └─→ Error: Return error message
   │
6. UI Update
   │
   ├─→ Reload document list
   ├─→ Close confirmation dialog
   └─→ Show success message
```

---

## 🔄 User Workflows

### 1. Login Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                      LOGIN WORKFLOW                           │
└──────────────────────────────────────────────────────────────┘

START
  │
  ├─→ User Opens App
  │
  ├─→ Redirect to /login
  │
  ├─→ Enter Credentials
  │   ├─→ Username
  │   └─→ Password
  │
  ├─→ Submit Form
  │
  ├─→ Backend Validation
  │   ├─→ Find User by username
  │   │   ├─→ Not Found: "Invalid credentials"
  │   │   └─→ Found: Continue
  │   │
  │   ├─→ Check isActive
  │   │   ├─→ false: "Account deactivated"
  │   │   └─→ true: Continue
  │   │
  │   ├─→ Verify Password (bcrypt)
  │   │   ├─→ Wrong: "Invalid credentials"
  │   │   └─→ Correct: Continue
  │   │
  │   ├─→ Generate JWT Token
  │   │   └─→ Payload: { userId, username, userLevel }
  │   │
  │   ├─→ Update lastLogin timestamp
  │   │
  │   └─→ Log Activity
  │       └─→ Action: LOGIN
  │
  ├─→ Frontend Processing
  │   ├─→ Save token to localStorage
  │   ├─→ Save user to localStorage
  │   ├─→ Update AuthContext
  │   └─→ Redirect to /dashboard
  │
END
```

### 2. Document Upload Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                  DOCUMENT UPLOAD WORKFLOW                     │
└──────────────────────────────────────────────────────────────┘

START (User at /documents)
  │
  ├─→ Click "Upload Document" Button
  │
  ├─→ Open Upload Modal
  │
  ├─→ Select Document Type
  │   ├─→ Master Document
  │   │   └─→ Show basic fields
  │   │
  │   └─→ Sub Document
  │       ├─→ Show parent selector
  │       └─→ Load available parent documents
  │
  ├─→ Fill Metadata
  │   ├─→ Title (text input)
  │   ├─→ Location (text input)
  │   ├─→ Longitude (number input, optional)
  │   ├─→ Latitude (number input, optional)
  │   └─→ Description (textarea)
  │
  ├─→ Select PDF File
  │   ├─→ Click file input
  │   ├─→ Choose file from system
  │   └─→ Validate:
  │       ├─→ Type: PDF only
  │       ├─→ Size: Max 10MB
  │       └─→ Display filename
  │
  ├─→ Click "Upload" Button
  │
  ├─→ Frontend Validation
  │   ├─→ Check required fields
  │   ├─→ Check file selected
  │   └─→ If invalid: Show error
  │
  ├─→ Create FormData
  │   ├─→ Append: title
  │   ├─→ Append: location
  │   ├─→ Append: longitude
  │   ├─→ Append: latitude
  │   ├─→ Append: description
  │   ├─→ Append: file
  │   └─→ Append: parentDocumentId (if sub)
  │
  ├─→ Send POST Request
  │   ├─→ URL: /api/documents
  │   ├─→ Headers: Authorization Bearer token
  │   └─→ Body: FormData
  │
  ├─→ Backend Processing
  │   ├─→ Verify JWT token
  │   ├─→ Check permission (canManageDocuments)
  │   ├─→ Validate file (Multer middleware)
  │   ├─→ Save file to uploads/
  │   ├─→ Generate document number
  │   ├─→ Create database record
  │   └─→ Log activity (CREATE)
  │
  ├─→ Receive Response
  │   ├─→ Success: 201 Created
  │   └─→ Error: 400/401/403/500
  │
  ├─→ Update UI
  │   ├─→ Reload document list
  │   ├─→ Close modal
  │   ├─→ Reset form
  │   └─→ Show success message
  │
END
```

### 3. User Management Workflow (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│                  USER MANAGEMENT WORKFLOW                     │
└──────────────────────────────────────────────────────────────┘

START (Admin at /users)
  │
  ├─→ View User List
  │   └─→ Load all users from API
  │
  ├─→ Admin Actions:
      │
      ├─→ CREATE USER
      │   ├─→ Click "Add User"
      │   ├─→ Fill form:
      │   │   ├─→ Username
      │   │   ├─→ Email
      │   │   ├─→ Password
      │   │   ├─→ Name
      │   │   └─→ User Level
      │   ├─→ Submit
      │   ├─→ Backend creates user
      │   └─→ Reload list
      │
      ├─→ EDIT USER
      │   ├─→ Click "Edit" button
      │   ├─→ Modify fields
      │   ├─→ Submit changes
      │   ├─→ Backend updates user
      │   └─→ Reload list
      │
      ├─→ TOGGLE ACTIVATION
      │   ├─→ Click "Deactivate/Activate"
      │   ├─→ Confirm action
      │   ├─→ Backend updates isActive
      │   └─→ Reload list
      │
      ├─→ RESET PASSWORD
      │   ├─→ Click "Reset Password"
      │   ├─→ Enter new password
      │   ├─→ Confirm
      │   ├─→ Backend hashes & saves
      │   └─→ Show success
      │
      └─→ DELETE USER
          ├─→ Click "Delete" button
          ├─→ Confirm deletion
          ├─→ Backend checks:
          │   └─→ Prevent self-delete
          ├─→ Delete user record
          └─→ Reload list
  │
END
```

---

## 📏 Business Rules

### Document Number Generation

**Master Document:**
```
Format: DOC-YYYYMMDD-XXXX

Example: DOC-20250121-0001

Rules:
- YYYY = Year (4 digits)
- MM = Month (2 digits)
- DD = Day (2 digits)
- XXXX = Sequential number (4 digits)
- Resets daily
```

**Sub Document:**
```
Format: [ParentDocNo]-SUB-XXX

Example: DOC-20250121-0001-SUB-001

Rules:
- Inherits parent document number
- Adds -SUB- suffix
- XXX = Sequential number (3 digits)
- Unique per parent document
```

### File Upload Restrictions

| Rule | Value | Reason |
|------|-------|--------|
| File Type | PDF only | Standardization |
| Max Size | 10 MB | Server storage |
| Naming | Auto-generated | Prevent conflicts |
| Location | uploads/ | Centralized storage |

### User Account Rules

| Rule | Value | Reason |
|------|-------|--------|
| Username | Unique | Prevent duplicates |
| Email | Unique | Account recovery |
| Password | Min 6 chars | Security |
| Default Status | Active | Immediate access |
| Self-Delete | Forbidden | Prevent accidents |

### Permission Escalation Rules

```
Level 3 → Cannot be promoted to Level 2 (requires admin)
Level 2 → Cannot be promoted to Level 1 (requires admin)
Level 1 → Cannot be promoted to Admin (requires super admin)
Admin → Cannot demote self
```

### Session Management Rules

| Rule | Implementation |
|------|---------------|
| Token Expiry | 24 hours |
| Concurrent Sessions | Unlimited |
| Logout Behavior | Invalidate token |
| Auto-logout | Not implemented |

---

## 🔀 Process Flow Diagrams

### System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SYSTEM ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐
│  Browser │
│  Client  │
└────┬─────┘
     │
     │ HTTP Request
     ↓
┌─────────────────┐
│  React Frontend │
│  (Port 5173)    │
│                 │
│  - Login.tsx    │
│  - Dashboard    │
│  - Documents    │
│  - Users        │
└────┬────────────┘
     │
     │ Axios API Call
     ↓
┌─────────────────┐
│  Express.js     │
│  Backend        │
│  (Port 5001)    │
│                 │
│  Middlewares:   │
│  ├─ CORS        │
│  ├─ Body Parser │
│  ├─ Multer      │
│  └─ JWT Verify  │
└────┬────────────┘
     │
     │ Sequelize ORM
     ↓
┌─────────────────┐
│  PostgreSQL     │
│  Database       │
│  (Port 5432)    │
│                 │
│  Tables:        │
│  ├─ Users       │
│  ├─ Documents   │
│  ├─ SubDocuments│
│  └─ ActivityLogs│
└─────────────────┘
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
└─────────────────────────────────────────────────────────────────┘

┌────────┐                                        ┌────────┐
│ Client │                                        │ Server │
└───┬────┘                                        └───┬────┘
    │                                                 │
    │  POST /api/auth/login                           │
    │  { username, password }                         │
    ├────────────────────────────────────────────────→│
    │                                                 │
    │                              Check username     │
    │                              ┌──────────────┐   │
    │                              │ Find User    │   │
    │                              │ in Database  │   │
    │                              └──────────────┘   │
    │                                                 │
    │                              Verify password    │
    │                              ┌──────────────┐   │
    │                              │ bcrypt       │   │
    │                              │ .compare()   │   │
    │                              └──────────────┘   │
    │                                                 │
    │                              Generate token     │
    │                              ┌──────────────┐   │
    │                              │ jwt.sign()   │   │
    │                              │ Payload:     │   │
    │                              │ - userId     │   │
    │                              │ - username   │   │
    │                              │ - userLevel  │   │
    │                              └──────────────┘   │
    │                                                 │
    │                              Update lastLogin   │
    │                              ┌──────────────┐   │
    │                              │ UPDATE Users │   │
    │                              │ SET lastLogin│   │
    │                              └──────────────┘   │
    │                                                 │
    │  200 OK                                         │
    │  { user, token }                                │
    │←────────────────────────────────────────────────┤
    │                                                 │
    │  Store in localStorage                          │
    │  ┌──────────────┐                               │
    │  │ token        │                               │
    │  │ user         │                               │
    │  └──────────────┘                               │
    │                                                 │
    │  Redirect to /dashboard                         │
    │                                                 │
```

### Document CRUD Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      DOCUMENT CRUD FLOW                          │
└─────────────────────────────────────────────────────────────────┘

CREATE:
  User → Frontend → POST /api/documents → Middleware → Controller
                                            ↓
                                        Generate DocNo
                                            ↓
                                        Save File
                                            ↓
                                        Insert DB
                                            ↓
                                        Log Activity
                                            ↓
                                        Return Document

READ:
  User → Frontend → GET /api/documents → Middleware → Controller
                                            ↓
                                        Query DB
                                            ↓
                                        Include SubDocs
                                            ↓
                                        Include Creator
                                            ↓
                                        Return List

UPDATE:
  User → Frontend → PUT /api/documents/:id → Middleware → Controller
                                                ↓
                                            Check Permission
                                                ↓
                                            Find Document
                                                ↓
                                            Update Record
                                                ↓
                                            Log Activity
                                                ↓
                                            Return Updated

DELETE:
  User → Frontend → DELETE /api/documents/:id → Middleware → Controller
                                                    ↓
                                                Check Permission
                                                    ↓
                                                Find Document
                                                    ↓
                                                Delete SubDocs (CASCADE)
                                                    ↓
                                                Delete File
                                                    ↓
                                                Delete Record
                                                    ↓
                                                Log Activity
                                                    ↓
                                                Return 200 OK
```

### Permission Check Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSION CHECK FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Request Received
     │
     ├─→ Extract JWT Token
     │   └─→ Authorization: Bearer <token>
     │
     ├─→ Verify Token (middleware: verifyToken)
     │   ├─→ jwt.verify(token, SECRET)
     │   ├─→ Valid: req.user = decoded
     │   └─→ Invalid: 401 Unauthorized
     │
     ├─→ Check Role (middleware: isAdmin / canManageDocuments)
     │   │
     │   ├─→ For Admin-only actions:
     │   │   ├─→ userLevel === 'admin' → ✅ Continue
     │   │   └─→ userLevel !== 'admin' → ❌ 403 Forbidden
     │   │
     │   ├─→ For Document Management:
     │   │   ├─→ admin → ✅ All actions
     │   │   ├─→ level1 → ✅ Create, Edit
     │   │   ├─→ level2 → ✅ Create only
     │   │   └─→ level3 → ❌ View only
     │   │
     │   └─→ For Document Deletion:
     │       ├─→ admin → ✅ Allowed
     │       └─→ Others → ❌ Forbidden
     │
     └─→ Execute Controller
         └─→ Process business logic
```

---

## 🔐 Permission Logic

### Middleware Chain

```javascript
// Route definition with middleware chain
router.post('/documents',
  verifyToken,           // Step 1: Verify JWT
  canManageDocuments,    // Step 2: Check document permission
  upload.single('file'), // Step 3: Handle file upload
  createDocument         // Step 4: Execute controller
);

router.delete('/documents/:id',
  verifyToken,           // Step 1: Verify JWT
  canDeleteDocuments,    // Step 2: Check delete permission
  deleteDocument         // Step 3: Execute controller
);

router.get('/users',
  verifyToken,           // Step 1: Verify JWT
  isAdmin,               // Step 2: Check admin role
  getUsers               // Step 3: Execute controller
);
```

### Permission Decision Tree

```
Document Action Request
  │
  ├─→ Is user authenticated?
  │   ├─→ No: Return 401 Unauthorized
  │   └─→ Yes: Continue
  │
  ├─→ What action?
      │
      ├─→ VIEW
      │   └─→ All levels allowed → ✅
      │
      ├─→ CREATE
      │   ├─→ admin → ✅
      │   ├─→ level1 → ✅
      │   ├─→ level2 → ✅
      │   └─→ level3 → ❌ 403 Forbidden
      │
      ├─→ EDIT
      │   ├─→ admin → ✅
      │   ├─→ level1 → ✅
      │   ├─→ level2 → ❌ 403 Forbidden
      │   └─→ level3 → ❌ 403 Forbidden
      │
      └─→ DELETE
          ├─→ admin → ✅
          └─→ Others → ❌ 403 Forbidden
```

---

## 📊 Activity Tracking

### Tracked Actions

| Action | Trigger | Logged Data |
|--------|---------|-------------|
| LOGIN | User login | userId, timestamp, IP |
| LOGOUT | User logout | userId, timestamp |
| CREATE | Document created | userId, documentId, metadata |
| UPDATE | Document edited | userId, documentId, changes |
| DELETE | Document deleted | userId, documentId |
| VIEW | Document viewed | userId, documentId, timestamp |
| DOWNLOAD | File downloaded | userId, documentId, timestamp |

### Activity Log Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ACTIVITY LOG FLOW                           │
└─────────────────────────────────────────────────────────────────┘

User Action
     │
     ├─→ Execute Business Logic
     │   └─→ (Create/Update/Delete/View)
     │
     ├─→ Success?
     │   ├─→ No: Return error (no log)
     │   └─→ Yes: Continue
     │
     ├─→ Create Activity Log
     │   ├─→ userId: req.user.userId
     │   ├─→ action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
     │   ├─→ details: JSON object with specifics
     │   ├─→ ipAddress: req.ip
     │   └─→ timestamp: new Date()
     │
     ├─→ Save to ActivityLogs table
     │
     └─→ Return success response
```

### Activity Log Query

```sql
-- Get user activity
SELECT 
  al.action,
  al.details,
  al.createdAt,
  u.username
FROM ActivityLogs al
JOIN Users u ON al.userId = u.id
WHERE al.userId = ?
ORDER BY al.createdAt DESC;

-- Get document activity
SELECT 
  al.action,
  u.username,
  al.createdAt
FROM ActivityLogs al
JOIN Users u ON al.userId = u.id
WHERE al.details->>'documentId' = ?
ORDER BY al.createdAt DESC;

-- Get recent activity (Admin dashboard)
SELECT 
  al.action,
  u.username,
  al.details,
  al.createdAt
FROM ActivityLogs al
JOIN Users u ON al.userId = u.id
ORDER BY al.createdAt DESC
LIMIT 50;
```

---

## 📈 Business Metrics

### Key Performance Indicators (KPIs)

1. **User Engagement**
   - Daily Active Users (DAU)
   - Monthly Active Users (MAU)
   - Average session duration

2. **Document Management**
   - Total documents uploaded
   - Documents per user
   - Average documents per day

3. **System Health**
   - Uptime percentage
   - Average response time
   - Error rate

4. **Security Metrics**
   - Failed login attempts
   - Active sessions
   - Password reset requests

### Dashboard Calculations

```javascript
// Active Sessions
activeSessions = users.filter(u => {
  if (!u.lastLogin) return false;
  if (!u.lastLogout) return true;
  return new Date(u.lastLogin) > new Date(u.lastLogout);
}).length;

// Documents by Status
activeDocuments = documents.filter(d => d.status === 'active').length;
archivedDocuments = documents.filter(d => d.status === 'archived').length;

// Users by Level
adminCount = users.filter(u => u.userLevel === 'admin').length;
level1Count = users.filter(u => u.userLevel === 'level1').length;
level2Count = users.filter(u => u.userLevel === 'level2').length;
level3Count = users.filter(u => u.userLevel === 'level3').length;
```

---

## 🎯 Business Process Summary

### End-to-End Document Flow

```
1. UPLOAD
   Admin/Level1/Level2 → Upload PDF → System generates DocNo
   → File saved → Metadata stored → Activity logged

2. ORGANIZE
   Admin/Level1/Level2 → Create Sub-Documents → Link to parent
   → Hierarchical structure maintained

3. ACCESS
   All Users → View documents → Search/filter → Open PDF viewer
   → Anti-screenshot protection active

4. MAINTAIN
   Admin/Level1 → Edit metadata → Update location → Update description
   → Changes logged

5. ARCHIVE
   Admin → Delete document → Cascade delete sub-docs
   → Physical file removed → Activity logged
```

### User Onboarding Flow

```
1. CREATION
   Admin → Create user account → Set username, email, password, level
   → Account active by default

2. FIRST LOGIN
   User → Login with credentials → JWT token generated
   → Redirect to dashboard → Session tracked

3. ORIENTATION
   User → View dashboard → Explore documents → Learn permissions
   → Based on user level

4. DAILY USE
   User → Login → Perform allowed actions → Logout
   → All activities logged
```

---

**Version:** 1.0.0  
**Last Updated:** November 21, 2025  
**Business Analyst:** DocuMan Development Team
