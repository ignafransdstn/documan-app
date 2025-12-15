# DocuMan - System Flowcharts
## Visual Process Flows & Diagrams

**Last Updated:** December 10, 2025  
**Version:** 1.0.0

---

## Table of Contents
1. [Main System Flowchart](#main-system-flowchart)
2. [Authentication Flow](#authentication-flow)
3. [Document Upload Flow](#document-upload-flow)
4. [Document Management Flow](#document-management-flow)
5. [Search & Filter Flow](#search--filter-flow)
6. [User Management Flow](#user-management-flow)
7. [System Architecture Diagram](#system-architecture-diagram)
8. [Data Flow Diagrams](#data-flow-diagrams)

---

## Main System Flowchart

```
┌─────────────────────────────────────────────────┐
│          DOCUMAN SYSTEM START                   │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│      User visits application                    │
│    (http://localhost:5173)                      │
└─────────────┬───────────────────────────────────┘
              │
              ▼
    ┌─────────────────────────┐
    │   Is user logged in?    │
    │   (Token in localStorage)
    └────┬────────────┬───────┘
         │            │
      YES│            │NO
         │            │
         ▼            ▼
    ┌──────────┐  ┌─────────────────────────┐
    │Dashboard │  │   LOGIN PAGE            │
    │  Page    │  ├─────────────────────────┤
    │          │  │ Username:               │
    │          │  │ Password:               │
    │          │  │ [Sign Up option]        │
    │          │  │                         │
    │          │  │ [Login Button]          │
    │          │  └────────┬────────────────┘
    └────┬─────┘           │
         │          ┌──────▼─────────────┐
         │          │ Submit credentials │
         │          └──────┬─────────────┘
         │                 │
         │          ┌──────▼─────────────────┐
         │          │ Validate & Get Token   │
         │          │ Store in localStorage  │
         │          └──────┬─────────────────┘
         │                 │
         └────────┬────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │   MAIN APPLICATION          │
    │   Navigation Menu           │
    └────┬────────┬────────┬──────┘
         │        │        │
         │        │        └──→ /users (Admin Only)
         │        │
         │        └──────────→ /documents
         │                     ├─ Upload
         │                     ├─ Search
         │                     ├─ Filter
         │                     ├─ Edit
         │                     ├─ Delete
         │                     └─ Download
         │
         └──────────────────→ /dashboard
                             ├─ Stats
                             ├─ Recent Activity
                             └─ Quick Actions

    ┌─────────────────────────────┐
    │   Top Right Menu:           │
    │   [Language] [Profile] [Logout] │
    └─────────────────────────────┘
```

---

## Authentication Flow

```
┌──────────────────────────┐
│  User Opens Application  │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Check localStorage for token │
└───┬────────────────────┬─────┘
    │                    │
YES │                    │ NO
    │                    │
    ▼                    ▼
┌─────────────────┐  ┌──────────────────┐
│  Token exists?  │  │  Redirect to     │
└────┬────────────┘  │  Login Page      │
     │               └──────────────────┘
     ├─→ YES: Validate token
     │       └─→ Token valid?
     │           ├─→ YES: Load user data
     │           │         └─→ Go to dashboard
     │           │
     │           └─→ NO: Delete token
     │               └─→ Redirect to login
     │
     └─→ NO: Show login form
```

### Login Form Submission

```
┌──────────────────────────────┐
│ User enters username/password │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Frontend Validation          │
│ ✓ Fields not empty           │
│ ✓ Format valid               │
└────────────┬─────────────────┘
             │
      ┌──────▼──────┐
      │  Valid?     │
      └──┬───┬──────┘
        YES  NO
         │   │
         │   └─→ Show inline error
         │       User corrects
         │       Retry
         │
         ▼
┌──────────────────────────────┐
│ POST /api/auth/login         │
│ { username, password }       │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Backend Validation           │
│ ✓ User exists                │
│ ✓ Password matches           │
│ ✓ User is active             │
│ ✓ User approved              │
└────────────┬─────────────────┘
             │
      ┌──────▼────────────┐
      │ All checks pass?  │
      └──┬───────┬────────┘
        YES      NO
         │       │
         │       └─→ Return error
         │           Show message
         │
         ▼
┌──────────────────────────────┐
│ Generate JWT Token           │
│ Return user info + token     │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Frontend receives response    │
│ Save token to localStorage   │
│ Save user info to context    │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Redirect to Dashboard        │
│ Show "Welcome, [User name]"  │
└──────────────────────────────┘
```

### Logout Flow

```
┌──────────────────────────┐
│ User clicks Logout       │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Clear localStorage           │
│ - Remove token               │
│ - Clear user context         │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ POST /api/auth/logout        │
│ (Optional server-side log)   │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Redirect to Login page       │
│ "Logged out successfully"    │
└──────────────────────────────┘
```

---

## Document Upload Flow

```
┌──────────────────────────────┐
│ User on Documents page       │
│ Click "Upload Document"      │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Upload form appears          │
│ - Document Type selector     │
│ - Master/Sub selection       │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ User selects:               │
│ - Type: Master/Sub           │
│ - Category: Dropdown         │
│ - Location: Autocomplete     │
│ - Other metadata fields      │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ User selects PDF file        │
│ File size calculated         │
└───┬────────────────┬─────────┘
    │                │
    │ <50MB          │ ≥50MB
    │                │
    ▼                ▼
  OK            ┌──────────────┐
    │           │ Show error:  │
    │           │ File too big │
    │           │ Pick smaller │
    │           │ file         │
    │           └──────────────┘
    │
    ▼
┌──────────────────────────────┐
│ Frontend Validation          │
│ ✓ Required fields filled     │
│ ✓ File is PDF                │
│ ✓ File < 50MB                │
└────────────┬─────────────────┘
             │
      ┌──────▼────────────┐
      │ All valid?        │
      └──┬───┬────────────┘
        YES  NO
         │   │
         │   └─→ Show error messages
         │       User corrects
         │
         ▼
┌──────────────────────────────┐
│ Show progress indicator      │
│ Form disabled during upload  │
│                              │
│ POST /api/documents          │
│ FormData with file + meta    │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Backend Processing:          │
│ ✓ Validate JWT               │
│ ✓ Check permission           │
│ ✓ Validate file              │
│ ✓ Validate metadata          │
└────────────┬─────────────────┘
             │
      ┌──────▼────────────┐
      │ All checks OK?    │
      └──┬───┬────────────┘
        YES  NO
         │   │
         │   └─→ Return error
         │       Show to user
         │
         ▼
┌──────────────────────────────┐
│ Save file to disk            │
│ /uploads/documents/          │
│ [filename]-[timestamp].pdf   │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Create database record       │
│ Documents table insert       │
│ Store file URL               │
│ Store all metadata           │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Log activity                 │
│ ActivityLogs.create          │
│ action: "upload"             │
│ status: "success"            │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Return success response      │
│ Include new document ID      │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Frontend receives response   │
│ Show success toast           │
│ Clear upload form            │
│ Add to document list         │
│ Refresh pagination           │
└──────────────────────────────┘
```

---

## Document Management Flow

```
┌────────────────────────────────────┐
│ Document List Display              │
│ User hovers/views document card    │
└─────────┬────────────────────────┬─┘
          │                        │
          │ Click Edit             │ Click Delete
          │                        │
          ▼                        ▼
    ┌──────────────┐        ┌──────────────────────┐
    │ Edit Modal   │        │ Confirmation Dialog  │
    │ opens with   │        │ "Delete document?"   │
    │ current data │        │ "X sub-documents"    │
    └──────┬───────┘        └────┬──────┬───────────┘
           │                     │      │
           ▼                 [Cancel] [Delete]
    ┌──────────────────┐         │      │
    │ User modifies    │         │      │
    │ fields (or not)  │         │      │
    └──────┬───────────┘         │      │
           │                     │      │
           ▼                     │      │
    ┌──────────────────┐         │      │
    │ Track changes    │         │      │
    │ (diff fields)    │         │      │
    └──────┬───────────┘         │      │
           │                     │      │
           ▼                     │      │
    ┌──────────────────┐         │      │
    │ Click Update     │         │      │
    │ PUT /api/docs/:id         │      │
    │ Send only changes          │      │
    └──────┬───────────┘         │      │
           │                     │      │
           ▼                     │      ▼
    ┌──────────────────┐   ┌───────────────┐
    │ Backend updates  │   │ Backend:      │
    │ changed fields   │   │ ✓ Validate    │
    │ only             │   │ ✓ Check perm  │
    │ Update timestamp │   │ ✓ Delete all  │
    └──────┬───────────┘   │ ✓ Log activity
           │               └────┬──────────┘
           ▼                    │
    ┌──────────────────┐   ┌─────────────────┐
    │ Activity logged  │   │ Files deleted    │
    │ Changed fields   │   │ DB records del   │
    │ recorded         │   │ Subs deleted too │
    └──────┬───────────┘   └────┬────────────┘
           │                    │
           ▼                    │
    ┌──────────────────┐   ┌─────────────────┐
    │ Success toast    │   │ Success toast    │
    │ Shows changed    │   │ "Document       │
    │ fields as badges │   │  deleted"        │
    │ Modal closes     │   │ Remove from list │
    │ List refreshes   │   │ Refresh display  │
    │ [Title] [Loc]    │   └─────────────────┘
    └──────────────────┘


Alternative path - View Document:
┌──────────────────┐
│ Click on document│
│ title or card    │
└──────┬───────────┘
       │
       ▼
┌──────────────────────────┐
│ Detail Modal opens       │
│ - Read-only metadata     │
│ - Map display            │
│ - PDF viewer             │
│ - Download button        │
└──────┬──────────┬────────┘
       │          │
    Download    Close
       │          │
       ▼          │
   ┌────────────┐ │
   │ API: GET   │ │
   │ /download/:id
   │ Log access │ │
   │ Send file  │ │
   └────────────┘ │
                  │
                  ▼
            ┌──────────┐
            │  Modal   │
            │  closes  │
            │  List    │
            │ visible  │
            └──────────┘
```

---

## Search & Filter Flow

```
┌────────────────────────────┐
│ Documents page loaded      │
│ Full list displayed        │
└─────────┬──────────────────┘
          │
          ▼
┌────────────────────────────────┐
│ User types in search box       │
│ "Jimbaran" (real-time)         │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ Debounce timer (300ms)         │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ GET /api/documents             │
│ ?search=jimbaran               │
│ &page=1&limit=10               │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ Backend:                       │
│ WHERE title LIKE %jimbaran%    │
│ (case-insensitive)             │
│ COUNT matching records         │
│ OFFSET for pagination          │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ Return:                        │
│ - Matching documents array     │
│ - Total count                  │
│ - Pages info                   │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ Frontend updates display       │
│ - Clear previous results       │
│ - Show new matching docs       │
│ - Show result count            │
│ - Reset to page 1              │
└────────────────────────────────┘


Filter Application:
┌────────────────────────────┐
│ User changes filter         │
│ (Category dropdown)         │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ GET /api/documents             │
│ ?category=Corporate            │
│ &masterOnly=false              │
│ &page=1&limit=10               │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ Backend applies WHERE clauses  │
│ CATEGORY = 'Corporate Doc'     │
│ + other filters                │
│ Return filtered results        │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ Frontend displays results      │
│ Only docs matching filters     │
│ Pagination reset               │
└────────────────────────────────┘


Combining Search + Filters:
┌────────────────────────────┐
│ Search: "Jimbaran"         │
│ Filter: "Permit Document"  │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ GET /api/documents             │
│ ?search=Jimbaran               │
│ &category=Permit               │
│ &page=1&limit=10               │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ Backend applies both:          │
│ WHERE title LIKE %Jimbaran%    │
│ AND category = 'Permit Doc'    │
└──────────┬─────────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ Frontend shows results         │
│ Matching both criteria         │
└────────────────────────────────┘
```

---

## User Management Flow (Admin Only)

```
┌────────────────────────────────┐
│ Admin visits /users page       │
└─────────┬──────────────────────┘
          │
          ▼
┌────────────────────────────────┐
│ GET /api/users?page=1&limit=10 │
│ (Admin auth required)          │
└──────────┬─────────────────────┘
          │
          ▼
┌────────────────────────────────┐
│ Backend:                       │
│ Fetch users from database      │
│ Paginate results               │
│ Return user array + count      │
└──────────┬─────────────────────┘
          │
          ▼
┌────────────────────────────────┐
│ Frontend displays:             │
│ - User table                   │
│ - Name, email, level, status   │
│ - Edit/Delete buttons per row  │
│ - Create new user button       │
└──────────┬────────────────┬────┘
           │                │
        Edit            Create
           │                │
           ▼                ▼
    ┌─────────────┐  ┌──────────────┐
    │ Edit Modal  │  │ Create Modal  │
    │ - Name      │  │ - Username    │
    │ - Email     │  │ - Email       │
    │ - Level     │  │ - Name        │
    │ - Status    │  │ - Password    │
    └──────┬──────┘  │ - Level      │
           │         └──────┬───────┘
           │                │
           ▼                ▼
    ┌─────────────────────────────┐
    │ User modifies fields        │
    │ Click Update/Create         │
    │ PUT /api/users/:id          │
    │ POST /api/users             │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Backend validates           │
    │ ✓ Admin permission          │
    │ ✓ Required fields           │
    │ ✓ Unique username/email     │
    └──────┬──────────────────────┘
           │
      ┌────▼────┐
      │ Valid?  │
      └─┬──┬────┘
     YES  NO
       │   │
       │   └─→ Return error
       │       Show to user
       │
       ▼
    ┌─────────────────────────────┐
    │ Update/Create database      │
    │ Store new/updated user      │
    │ Log activity                │
    └──────┬──────────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │ Success notification        │
    │ Close modal                 │
    │ Refresh user list           │
    └─────────────────────────────┘
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB BROWSER                              │
│              (User Interface Layer)                          │
├─────────────────────────────────────────────────────────────┤
│
│  React Application (Port 5173)
│  ├─ Components (React)
│  ├─ Context (Auth, Language)
│  ├─ Hooks (useAuth, useLanguage)
│  ├─ Pages (Documents, Users, Dashboard)
│  ├─ i18n (English, Indonesian)
│  └─ Axios (HTTP Client)
│
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS/HTTP
                     │
┌────────────────────▼────────────────────────────────────────┐
│        EXPRESS.JS BACKEND (Port 5001)                       │
│       (Business Logic & API Layer)                          │
├─────────────────────────────────────────────────────────────┤
│
│  Routes (/api/...)
│  ├─ /auth (Login, Signup)
│  ├─ /documents (CRUD)
│  ├─ /users (Admin operations)
│  └─ /activity-logs (Audit trail)
│
│  Controllers
│  ├─ authController
│  ├─ documentController
│  ├─ userController
│  └─ activityController
│
│  Middleware
│  ├─ Auth validation (JWT)
│  ├─ Permission checks
│  ├─ Input validation
│  └─ Error handling
│
│  Utilities
│  ├─ File upload handler
│  ├─ Password hashing
│  └─ Token generation
│
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ SQL Queries
                     │
┌────────────────────▼────────────────────────────────────────┐
│            SEQUELIZE ORM                                    │
│       (Data Access Layer)                                   │
├─────────────────────────────────────────────────────────────┤
│
│  Models
│  ├─ User (Authentication & Roles)
│  ├─ Document (Master documents)
│  ├─ SubDocument (Linked documents)
│  ├─ ActivityLog (Audit trail)
│  └─ Form (Stored forms - future)
│
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ PostgreSQL Protocol
                     │
┌────────────────────▼────────────────────────────────────────┐
│          POSTGRESQL DATABASE                                │
│       (Data Persistence Layer)                              │
├─────────────────────────────────────────────────────────────┤
│
│  Tables
│  ├─ Users (Credentials, Roles)
│  ├─ Documents (Master docs metadata)
│  ├─ SubDocuments (Linked docs metadata)
│  ├─ ActivityLogs (Audit records)
│  └─ Forms (Stored forms)
│
│  File Storage
│  └─ /backend/uploads/documents/ (PDF files)
│
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Complete Document Upload Data Flow

```
USER INPUT
    │
    ├─ Document Type (dropdown)
    ├─ Category (dropdown)
    ├─ Title (text input)
    ├─ Location (autocomplete)
    ├─ Description (textarea)
    ├─ Metadata fields (various)
    └─ File (PDF upload)
    │
    ▼
FRONTEND VALIDATION
    │
    ├─ Required fields check
    ├─ Format validation
    ├─ File type validation (.pdf)
    ├─ File size validation (<50MB)
    └─ Location availability check
    │
    ▼
FORM DATA PREPARATION
    │
    ├─ Organize metadata in JSON
    ├─ Attach file as FormData
    ├─ Encode special characters
    └─ Prepare Authorization header
    │
    ▼
API REQUEST
    │
    POST /api/documents
    Headers: {
      "Authorization": "Bearer [token]",
      "Content-Type": "multipart/form-data"
    }
    Body: {
      title: "",
      category: "",
      location: "",
      file: [File object],
      ...metadata
    }
    │
    ▼
BACKEND PROCESSING
    │
    ├─ JWT Token Validation
    │  └─ Verify token signature
    │  └─ Check expiration
    │  └─ Extract user ID
    │
    ├─ User Permission Check
    │  └─ Confirm user authenticated
    │  └─ Check user level ≥ Level1
    │  └─ Verify user is active
    │
    ├─ Input Validation
    │  ├─ All metadata fields
    │  ├─ String length limits
    │  ├─ ENUM value validation
    │  └─ Location existence check
    │
    ├─ File Validation
    │  ├─ MIME type check (PDF)
    │  ├─ File size check (<50MB)
    │  ├─ Virus scan (optional)
    │  └─ Corruption check
    │
    └─ All validations passed?
       ├─ NO: Return 400 error
       └─ YES: Continue
    │
    ▼
FILE STORAGE
    │
    ├─ Generate unique filename
    │  └─ [original]-[timestamp].pdf
    │
    ├─ Save to disk
    │  └─ /backend/uploads/documents/
    │
    ├─ Generate file URL
    │  └─ /uploads/documents/[filename]
    │
    └─ File now persistent on server
    │
    ▼
DATABASE STORAGE
    │
    ├─ Create Documents record
    │  ├─ Insert title
    │  ├─ Insert location
    │  ├─ Insert category
    │  ├─ Insert file URL
    │  ├─ Insert all metadata
    │  ├─ Insert user ID (createdBy)
    │  └─ Set createdAt/updatedAt
    │
    ├─ IF Sub-Document THEN
    │  ├─ Auto-generate SUB-001
    │  ├─ Insert documentId (FK)
    │  └─ Create SubDocuments record
    │
    └─ Transaction committed
    │
    ▼
ACTIVITY LOGGING
    │
    ├─ Create ActivityLog record
    │  ├─ userId: [current user ID]
    │  ├─ action: "upload"
    │  ├─ resourceType: "Document"
    │  ├─ resourceId: [new document ID]
    │  ├─ status: "success"
    │  ├─ ipAddress: [user IP]
    │  ├─ userAgent: [browser info]
    │  └─ timestamp: NOW()
    │
    └─ Audit trail created
    │
    ▼
API RESPONSE
    │
    ├─ HTTP Status: 201 Created
    │
    ├─ Response Body:
    │  {
    │    "id": [new ID],
    │    "title": "",
    │    "location": "",
    │    "category": "",
    │    "fileUrl": "/uploads/documents/[filename]",
    │    "createdAt": "[timestamp]",
    │    ...all metadata
    │  }
    │
    └─ Send to frontend
    │
    ▼
FRONTEND HANDLING
    │
    ├─ Receive response
    ├─ Extract document data
    ├─ Add to documents array (state)
    ├─ Clear form fields
    ├─ Hide upload form
    ├─ Refresh document list
    │
    └─ User visible output
    │
    ▼
USER NOTIFICATION
    │
    ├─ Toast notification appears
    │  ├─ Position: top-right
    │  ├─ Color: Green (success)
    │  ├─ Message: "Document uploaded"
    │  ├─ Duration: 5 seconds
    │  └─ Auto-hide
    │
    ├─ Document appears in list
    │  ├─ Card with metadata
    │  ├─ Action buttons
    │  └─ Ready for operations
    │
    └─ Form resets for next upload
```

### Document Search & Filter Data Flow

```
USER ACTION: Types search query
    │
    └─ "Jimbaran"
       │
       ▼
FRONTEND INPUT DETECTION
    │
    ├─ onChange event fires
    ├─ Store in React state
    ├─ Start debounce timer (300ms)
    │
    └─ Wait for user to stop typing
       │
       ▼
DEBOUNCE TIMEOUT
    │
    └─ 300ms elapsed, no new input
       │
       ▼
QUERY PREPARATION
    │
    ├─ Build query object:
    │  {
    │    search: "jimbaran",
    │    category: "Corporate",  (if filtered)
    │    masterOnly: false,       (if filtered)
    │    page: 1,
    │    limit: 10
    │  }
    │
    └─ Prepare API call parameters
       │
       ▼
API REQUEST
    │
    GET /api/documents?search=jimbaran&category=Corporate&page=1&limit=10
    │
    Headers: {
      "Authorization": "Bearer [token]"
    }
    │
    └─ Query string contains search/filter criteria
       │
       ▼
BACKEND QUERY BUILDING
    │
    ├─ Start with base query
    │  └─ SELECT * FROM Documents
    │
    ├─ Add search condition
    │  └─ WHERE LOWER(title) LIKE LOWER('%jimbaran%')
    │
    ├─ Add filter conditions
    │  ├─ AND category = 'Corporate'
    │  └─ AND (other filters)
    │
    ├─ Count total matching records
    │  └─ COUNT(*) WHERE conditions
    │
    └─ Add pagination
       └─ OFFSET (page-1)*limit LIMIT limit
       │
       ▼
DATABASE EXECUTION
    │
    ├─ Execute SELECT query
    │  └─ Returns matching documents
    │
    ├─ Execute COUNT query
    │  └─ Returns total count: 23
    │
    └─ Prepare result set
       │
       ▼
RESPONSE FORMATTING
    │
    ├─ Build response object:
    │  {
    │    documents: [{...}, {...}, ...],
    │    total: 23,
    │    page: 1,
    │    pages: 3,
    │    limit: 10
    │  }
    │
    └─ Return to frontend
       │
       ▼
FRONTEND RECEIVES RESPONSE
    │
    ├─ Extract documents array
    ├─ Extract pagination info
    ├─ Store in React state
    │
    └─ Trigger re-render
       │
       ▼
DISPLAY UPDATE
    │
    ├─ Clear previous results
    ├─ Render new document cards
    │  ├─ Title
    │  ├─ Location
    │  ├─ Category badge
    │  └─ Action buttons
    │
    ├─ Show result count
    │  └─ "23 documents found"
    │
    ├─ Show pagination
    │  └─ "Page 1 of 3"
    │
    └─ User sees updated list
```

---

**Document Version:** 1.0.0  
**Last Updated:** December 10, 2025  
**Total Flowcharts:** 12 diagrams covering all major processes
