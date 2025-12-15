# DocuMan - Features Documentation
## Complete Feature Reference & Implementation Details

**Last Updated:** December 10, 2025  
**Version:** 1.0.0

---

## Table of Contents
1. [Feature Overview](#feature-overview)
2. [Core Features](#core-features)
3. [Advanced Features](#advanced-features)
4. [UI Components & UX](#ui-components--ux)
5. [Data Management](#data-management)
6. [Feature Matrix](#feature-matrix)

---

## Feature Overview

DocuMan adalah sistem manajemen dokumen komprehensif dengan fokus pada:
- **Data Integrity:** Metadata lengkap untuk setiap dokumen
- **User Experience:** Interface yang intuitif dengan notifikasi real-time
- **Security:** Watermarking, access control, audit trails
- **Scalability:** Pagination, efficient search, optimized queries
- **Accessibility:** Multi-language support (EN/ID)

---

## Core Features

### 1. User Authentication & Authorization

#### Login System
- **Input:** Username & password
- **Authentication:** JWT token-based
- **Storage:** Token di localStorage (client-side)
- **Duration:** Auto-expire setelah 1 jam inactivity
- **Redirect:** Failed login → error message, Successful → dashboard

#### User Registration (Sign Up)
- **Fields:** Username, email, password, full name
- **Validation:** 
  - Username unique (check backend)
  - Email format validation
  - Password strength: minimum 6 characters
- **Default Level:** Level 1
- **Status:** Requires admin approval (isApproved flag)

#### Role-Based Access Control (RBAC)
```
Admin (Level 0)
├── Full system access
├── User management
├── Document management
├── Form management
└── Audit logs access
└── Form Approval tracking

Level 4 (Next Development)
├── Document viewing (only linked documents)
├── Sub-document viewing (only linked documents)
├── Form submissions
└── Form Approval tracking

Level 3
├── Document upload & editing
├── Sub-document management
├── Document viewing
└── Cannot delete documents

Level 2
├── Document upload & editing
├── Document viewing
└── Cannot delete documents

Level 1
├── Document viewing only
└── Cannot edit/delete
```

#### Protected Routes
```
/login           - Public
/signup          - Public
/dashboard       - ProtectedRoute (all authenticated)
/documents       - ProtectedRoute (all authenticated)
/users           - AdminRoute (admin only)
/forms           - AdminRoute (admin only)
/submissions     - Level4Route (level 4 + admin)
```

---

### 2. Document Upload & Management

#### Upload Process
1. **Document Type Selection**
   - Master Document (standalone)
   - Sub-Document (linked to master)

2. **Required Metadata**
   - **Title:** Document name
   - **File:** PDF only, max size 50MB
   - **Category:** 
     - Corporate Document
     - Permit Document
   - **Location:** Autocomplete dari 30+ locations predefined
   - **Description:** Max 350 characters

3. **Optional Metadata**
   - **Coordinates:** Manual latitude/longitude input
   - **Certificate Type:** SHM, SHGB, SHGU, SHP, HPL, AJB, Girik, Others
   - **Property Info:** Land size, area name, project name
   - **Zone Info:** Zone URL, zone RTDR code
   - **Dates:** Publish date, expiration date, obtained date
   - **Origin:** Origin document, previous owner
   - **Company:** JH, JHT, BEP, PIJ selection

#### Document Storage
- **Location:** `/backend/uploads/documents/` (server-side)
- **Naming:** Original filename + timestamp
- **Database:** File URL stored in Documents table
- **Persistence:** Files remain after logout/session end

#### Supported Formats
- PDF (.pdf)
- File validation on both client & server

#### File Size Limits
- Maximum: 50MB per document
- Client-side warning before upload
- Server-side validation

---

### 3. Document Categorization

#### Categories
```
Corporate Document
└── Untuk dokumen perusahaan & administrasi

Permit Document
└── Untuk dokumen perijinan & sertifikasi
```

#### Implementation
- **Storage:** ENUM column dalam Documents & SubDocuments table
- **UI:** Dropdown selection dengan 2 options
- **Display:** 
  - Badge di document card
  - Full label di detail modal
  - Editable via edit modal
- **Filter:** Dapat dicari/difilter per kategori

#### Use Cases
- **Corporate:** SOP, policies, contracts
- **Permit:** Land certificates, business permits, licenses

---

### 4. Location Management

#### Location Autocomplete Feature
```
Frontend Implementation:
├── useLocationAutocomplete Hook
│   ├── Input value tracking
│   ├── Suggestion filtering
│   ├── Keyboard navigation
│   │   ├── Arrow Up/Down (navigate suggestions)
│   │   ├── Enter (select)
│   │   └── Escape (close dropdown)
│   └── Click-outside detection
│
├── LocationInput Component
│   ├── Text input field
│   ├── Dropdown suggestions
│   ├── Hover effects
│   └── Selection handler
│
└── Locations Utility
    ├── 30+ Predefined locations
    └── Custom location support
```

#### Predefined Locations
- Jakarta (Jakarta Pusat, Selatan, Utara, Timur, Barat)
- Tangerang
- Depok
- Bogor
- Bekasi
- Bandung
- Surabaya
- Medan
- Semarang
- Makassar
- Palembang
- Denpasar
- & more...

#### Features
- **Real-time filtering** sebagai user mengetik
- **Custom entry** untuk lokasi tidak di list
- **Keyboard navigation** untuk accessibility
- **Click-outside** automatic close
- **No duplicate filtering** untuk suggestions
- **Display:** Shows sebagai text string di documents

---

### 5. Sub-Document Management

#### Master-Detail Relationship
```
Document (Master)
├── Sub-Document 1 (SUB-001)
├── Sub-Document 2 (SUB-002)
├── Sub-Document 3 (SUB-003)
└── ...
```

#### Sub-Document Number System
- **Format:** `SUB-001`, `SUB-002`, etc.
- **Auto-increment:** Sequential numbering
- **Editable:** Can change number via modal
- **Unique:** Per master document

#### Sub-Document Features
- **File:** Separate PDF file per sub-document
- **Metadata:** Own complete metadata set
  - Some inherited from master (optional)
  - Some specific to sub-document
  - All editable independently
- **Expansion:** Click document → expand to show subs
- **List View:** Sub-documents dalam collapsible list
- **Info Button:** Click ⓘ → detail modal

#### Sub-Document Card Display
```
┌─────────────────────────────┐
│ SUB-001 (clickable number)  │
├─────────────────────────────┤
│ Title: [Sub Title]          │
│ Location: [Location]        │
│ Latitude: [XX.XXX]          │
│ Longitude: [XX.XXX]         │
│ Description: [Text...]      │
├─────────────────────────────┤
│ [ⓘ] [Edit] [Download] [X]   │
└─────────────────────────────┘
```

#### Sub-Document Operations
- **View Details:** Click ⓘ → read-only modal
- **Edit Number:** Click number → edit modal
- **Edit Info:** Click Edit → edit all metadata
- **Download:** Click Download → PDF download
- **Delete:** Click X → confirmation → delete
- **View PDF:** Click expand → full PDF viewer

---

### 6. Document Search & Filtering

#### Search Functionality
- **Real-time search:** Type title → instant results
- **Case-insensitive:** Matching regardless of case
- **Scope:** Document title only
- **Performance:** Client-side filtering dengan pagination

#### Filter Options
1. **Document Type Filter**
   - Master documents only
   - Master documents with sub-documents
   - All documents

2. **Category Filter** (dari category feature)
   - Corporate Document
   - Permit Document
   - All

3. **Status Filter** (Next Development)
   - Active
   - Archived
   - All

#### Pagination
- **Items per page:** 10 documents
- **Display:** "Page X of Y"
- **Controls:** Previous/Next buttons
- **Reset:** Search resets to page 1

---

### 7. Document Editing & Updates

#### Editable Fields
```
Basic Info:
├── Title
├── Category
├── Location (with autocomplete)
└── Description

Metadata:
├── Certificate Type
├── Land Size
├── Area Name
├── Project Name
├── Zone URL
├── Zone RTDR
├── Publish Date
├── Expiration Date
├── Document Obtained
├── Origin Document
├── Previous Owner
└── Company

Coordinates:
├── Latitude (decimal format)
└── Longitude (decimal format)
```

#### Edit Flow
1. Click "Edit" button pada document card
2. Edit modal opens dengan form fields
3. Modify desired fields
4. Click "Update" → API call → success notification
5. Click "Cancel" → close modal tanpa saving

#### Update Notification
- **Type:** Toast notification (top-right)
- **Color:** Green (success) / Red (error)
- **Content:** List of changed fields sebagai badges
- **Duration:** 5 seconds auto-hide
- **Animation:** Smooth slide-in effect
- **Example:**
  ```
  ✓ Document Updated
  [Title Changed] [Location Changed] [Category Changed]
  ```

#### Change Tracking
Fields tracked untuk notification:
- Title
- Location
- Description
- Category
- Longitude
- Latitude
- Certificate Type
- Land Size
- Area Name
- Project Name
- Zone URL
- Zone RTDR
- Publish Date
- Expiration Date
- Document Obtained
- Origin Document
- Previous Owner
- Company

---

### 8. Document Viewing & Downloads

#### PDF Viewer
- **Format:** Embedded PDF viewer
- **Display:** Full-width, scalable
- **Features:**
  - Page navigation
  - Zoom in/out
  - Fullscreen option
  - Print option (with watermark)

#### Watermark Protection
- **Text:** "CONFIDENTIAL" repeated across PDF
- **Opacity:** Semi-transparent (50%)
- **Rotation:** 45 degrees diagonal
- **Purpose:** Prevent unauthorized copying
- **Coverage:** Entire document

#### Download Feature
- **Button:** Download icon di document card
- **Format:** Original PDF file
- **Logging:** Tracked dalam activity log
- **Access:** Requires authentication

#### Anti-Copy Protection
- **Prevention:** JavaScript window.blocking
- **Disable:** Right-click copy, Ctrl+C, Ctrl+A
- **Purpose:** Prevent clipboard access
- **Bypass:** Print-to-PDF possible (watermark visible)

---

### 9. Activity Logging (Audit Trail)

#### Tracked Events
```
Document Operations:
├── Document created
├── Document edited
├── Document deleted
└── Document downloaded

Sub-Document Operations:
├── Sub-document created
├── Sub-document number changed
├── Sub-document info updated
└── Sub-document deleted

User Operations:
├── User login
├── User logout
├── User created (admin)
└── User level changed
```

#### Log Information
```
For each activity:
├── User ID (who)
├── Action type (what)
├── Resource type (Document/User/SubDoc)
├── Resource ID (which document)
├── Timestamp (when)
├── IP Address (from where)
├── User Agent (browser info)
├── Status (success/failure)
└── Details (JSON with field changes)
```

#### Viewing Activity Logs
- **Location:** Admin panel
- **Filter by:**
  - User
  - Action type
  - Date range
- **Display:** Table dengan sortable columns
- **Export:** CSV export option (future)

---

### 10. User Management (Admin Only)

#### User Operations

**View Users**
- List semua users dalam table
- Display: ID, username, email, name, level, status
- Pagination: 10 users per page
- Search: Filter by username/email
- Sort: By name/email/level

**Create User**
- Form dengan fields:
  - Username (unique)
  - Email (unique)
  - Password (generated atau input)
  - Full Name
  - User Level (dropdown: admin/level1-4)
- Validation: Server-side checks
- Default status: Pending approval

**Edit User**
- Modal untuk update:
  - Email
  - Full Name
  - User Level
  - Approval status
- Changes logged dalam activity

**Reset Password**
- Generate temporary password
- Send via email (future feature)
- User forced to change on first login (future)

**Activate/Deactivate**
- Toggle user active status
- Inactive users cannot login
- Tracked dalam audit log

---

### 11. Localization (i18n)

#### Language Support
- **English (EN):** Default
- **Indonesian (ID):** Full translation

#### Translation Scope (250+ keys)
```
Navigation:
├── Dashboard
├── Documents
├── Users
├── Settings
└── Logout

Forms & Labels:
├── Input placeholders
├── Button labels
├── Modal titles
├── Error messages
└── Success messages

Document Fields:
├── Field labels
├── Dropdown options
├── Category names
└── Certificate types

Messages:
├── Success notifications
├── Error messages
├── Confirmations
├── Loading states
└── Empty states
```

#### Language Switching
- **Location:** Language selector dropdown (top-right)
- **Persistence:** Selected language saved to localStorage
- **Effect:** Instant UI update
- **Default:** Based on browser language atau EN

#### Translation Keys
- All UI text in i18n JSON files
- Fallback to English if translation missing
- Used via `useLanguage()` hook
- Context-aware translations

---

### 12. Notifications & Feedback

#### Toast Notifications
```
Position: Top-right corner (fixed)
Duration: 5 seconds auto-hide
Animation: Slide-in from right

Success (Green):
├── Document uploaded
├── Document updated
├── Document deleted
├── User created
└── Password reset

Error (Red):
├── Upload failed
├── Network error
├── Validation error
└── Permission denied

Info (Blue):
├── Processing...
├── Please wait...
└── Action pending
```

#### Update Notification Details
```
Format: 
✓ Document Updated
[Changed Field 1] [Changed Field 2] [...]

Badges show:
├── Field name
├── Color: Blue background
└── White text

Example:
✓ Location Updated
[Location Changed] [Coordinates Changed]
```

#### Error Handling
- Invalid input → inline form errors
- Network errors → error toast
- Permission denied → redirect + message
- Not found → 404 page
- Server errors → error toast with retry

---

## Advanced Features

### 1. GPS Coordinates & Mapping

#### Coordinate System
- **Format:** Decimal degrees (e.g., -6.2088, 106.8456)
- **Storage:** Float values in database
- **Input:** Manual text fields (latitude/longitude)
- **Validation:** Range checking (-90 to 90 latitude, -180 to 180 longitude)

#### Map Visualization
- **Library:** Leaflet.js
- **Map Provider:** OpenStreetMap
- **Display:** Interactive map pada document detail
- **Markers:** Document location pinpointed
- **Zoom:** Adjustable zoom levels
- **Use Case:** Visual verification of location data

#### Coordinate Entry
```
Form Fields:
├── Latitude: -6.2088
├── Longitude: 106.8456
└── [Use my location] button (future)

Display:
├── Map shows marker
├── Street address lookup (future)
└── Address autocomplete (future)
```

---

### 2. Company Classification

#### Companies
```
JH - Jimbaran Hijau
JHT - Jimbaran Hijau Tower
BEP - Business Enterprise Park
PIJ - Proyek Industri Jimbaran
```

#### Implementation
- **Dropdown selection** dalam upload & edit forms
- **Storage:** String value dalam documents
- **Display:** Shown pada document cards
- **Filter:** Can filter by company (future enhancement)

---

### 3. Certificate Types

#### Available Types
```
SHM - Sertifikat Hak Milik
SHGB - Sertifikat Hak Guna Bangunan
SHGU - Sertifikat Hak Guna Usaha
SHP - Sertifikat Hak Pakai
HPL - Hak Pengelolaan Lahan
AJB - Akta Jual Beli
Girik - Girik Pajak
Others - Lainnya
```

#### Implementation
- **Dropdown menu** dengan 8 options
- **Optional field:** Can be left blank
- **Storage:** String value
- **Display:** Shown dalam document metadata

---

### 4. Date Management

#### Date Fields
```
Publish Date
├── When document was published
├── Format: YYYY-MM-DD
└── Optional

Expiration Date
├── Document validity period
├── Format: YYYY-MM-DD
└── Optional

Document Obtained Date
├── When document was acquired
├── Format: YYYY-MM-DD
└── Optional
```

#### Date Handling
- **Input:** HTML date picker
- **Validation:** Basic format validation
- **Storage:** ISO format dalam database
- **Display:** Readable format dalam UI
- **Filtering:** Can filter by date range (future)

---

### 5. Property Information

#### Fields
```
Land Size
├── Size in hectares/m²
├── Format: Any measurement
└── Example: "2.5 hectares"

Area Name
├── Zone or region name
├── Example: "North Jakarta Business District"
└── Max length: 255 characters

Project Name
├── Development project
├── Example: "Jimbaran Hijau Complex"
└── Max length: 255 characters

Zone Information:
├── Zone URL: URL reference
├── Zone RTDR: Zone regulation code
└── Both optional
```

#### Use Cases
- Property identification
- Project reference
- Zone compliance tracking
- Regulatory documentation

---

## UI Components & UX

### 1. Navigation Bar
```
┌────────────────────────────────────────────┐
│ [Logo] [Dashboard] [Documents] [Users]     │
│                          [Language 🌐] [User 👤] [Logout] │
└────────────────────────────────────────────┘
```

### 2. Document Card Layout
```
┌──────────────────────────────────────┐
│ TITLE                                │
│ Category: Corporate Document         │
│                                      │
│ Location: Jakarta Pusat              │
│ Company: JH                          │
│ Coordinates: -6.20, 106.84           │
│                                      │
│ [expand ▼] [Edit] [View] [✓] [Delete] │
└──────────────────────────────────────┘
```

### 3. Sub-Document List (Expanded)
```
[expand ▲] 3 Sub-Documents
├─ SUB-001 [ⓘ] [Edit] [↓] [Delete]
│  Title: Certificate of Ownership
│  Location: South Jakarta
│  Description: Main property document
│
├─ SUB-002 [ⓘ] [Edit] [↓] [Delete]
│  Title: Tax Registration
│  Location: Jakarta
│  Description: Annual tax document
│
└─ SUB-003 [ⓘ] [Edit] [↓] [Delete]
   Title: Building Permit
   Location: Central Jakarta
   Description: Construction approval
```

### 4. Upload Form
```
┌─────────────────────────────────────┐
│ UPLOAD DOCUMENT                     │
├─────────────────────────────────────┤
│ Document Type: [Master ▼]           │
│ Category: [Corporate Document ▼]    │
│ Title: [___________________]        │
│ Location: [Search location...▼]     │
│ Description: [_________________]    │
│                                     │
│ Certificate Type: [Select... ▼]     │
│ Land Size: [___________]            │
│ Area Name: [___________________]    │
│ Project Name: [______________]      │
│ Company: [JH ▼]                     │
│                                     │
│ Publish Date: [____________]        │
│ Expiration Date: [____________]     │
│                                     │
│ Latitude: [___________]             │
│ Longitude: [__________]             │
│                                     │
│ Upload File: [Browse...]            │
│                                     │
│ [Upload] [Clear]                   │
└─────────────────────────────────────┘
```

### 5. Edit Modal
```
┌─────────────────────────────────────┐
│ EDIT DOCUMENT                       │
├─────────────────────────────────────┤
│ Title: [___________________]        │
│ Category: [Corporate ▼]             │
│ Location: [Search...▼]              │
│ Description: [_________________]    │
│                                     │
│ [Certificate Type] [Land Size]      │
│ [Area Name] [Project Name]          │
│ [Company] [Dates]                   │
│                                     │
│ [Update] [Cancel]                   │
└─────────────────────────────────────┘
```

### 6. Detail Modal
```
┌─────────────────────────────────────┐
│ DOCUMENT DETAILS                    │
├─────────────────────────────────────┤
│ Title: [Display Only]               │
│ Category: [Corporate Document]      │
│ Location: [Jakarta Pusat]           │
│ Description: [Full text]            │
│                                     │
│ Certificate: SHM                    │
│ Land Size: 2.5 hectares             │
│ Company: JH                         │
│                                     │
│ Map: [Interactive Leaflet map]      │
│                                     │
│ [Download] [Close]                  │
└─────────────────────────────────────┘
```

---

## Data Management

### Upload File Flow
```
1. User selects file
   ↓
2. Frontend validation
   - File size check (<50MB)
   - File type check (.pdf only)
   ↓
3. Form data prepared
   - File blob
   - Metadata fields
   - User token
   ↓
4. API call (POST /api/documents)
   ↓
5. Backend validation
   - File size validation
   - Metadata validation
   - User authentication
   ↓
6. File saved to disk
   - Path: /backend/uploads/documents/
   - Name: [originalName]-[timestamp].pdf
   ↓
7. Database record created
   - Document entry dengan file URL
   - Metadata stored
   ↓
8. Activity logged
   - Action: "upload"
   - Status: "success"
   ↓
9. Frontend notification
   - Toast success message
   - Document appears di list
```

### Edit Data Flow
```
1. User clicks Edit → modal opens
   ↓
2. Form fields populated dengan current data
   ↓
3. User modifies fields
   ↓
4. Click Update
   ↓
5. Frontend validation
   - Check required fields
   - Format validation
   ↓
6. API call (PUT /api/documents/:id)
   - Only changed fields sent
   ↓
7. Backend validation
   - User permission check
   - Data validation
   ↓
8. Database updated
   - Only changed fields updated
   - updatedAt timestamp set
   ↓
9. Activity logged
   - Changed field names recorded
   ↓
10. Frontend notification
    - Toast shows changed fields
    - Modal closes
```

### Delete Data Flow
```
1. User clicks Delete button
   ↓
2. Confirmation dialog
   - "Delete this document?"
   - Check for sub-documents
   ↓
3. User confirms
   ↓
4. API call (DELETE /api/documents/:id)
   ↓
5. Backend cascade delete
   - Delete main document
   - Delete all sub-documents
   - Delete all files
   ↓
6. Activity logged
   - Status: "success"
   ↓
7. Frontend update
   - Remove dari list
   - Toast notification
```

---

## Feature Matrix

### Complete Feature Checklist

| Feature | Status | Frontend | Backend | Database |
|---------|--------|----------|---------|----------|
| User Login | ✅ | Done | Done | Done |
| User Sign Up | ✅ | Done | Done | Done |
| Admin Approval | ✅ | Done | Done | Done |
| Role-Based Access | ✅ | Done | Done | Done |
| Document Upload | ✅ | Done | Done | Done |
| Document Edit | ✅ | Done | Done | Done |
| Document Delete | ✅ | Done | Done | Done |
| Document View | ✅ | Done | Done | Done |
| Document Download | ✅ | Done | Done | Done |
| Sub-Document Create | ✅ | Done | Done | Done |
| Sub-Document Edit | ✅ | Done | Done | Done |
| Sub-Document Delete | ✅ | Done | Done | Done |
| Document Category | ✅ | Done | Done | Done |
| Location Autocomplete | ✅ | Done | Done | Done |
| Search & Filter | ✅ | Done | Done | Done |
| Pagination | ✅ | Done | Done | Done |
| User Management | ✅ | Done | Done | Done |
| Activity Logging | ✅ | Done | Done | Done |
| PDF Watermark | ✅ | Done | Done | N/A |
| Map Visualization | ✅ | Done | Done | Done |
| Date Fields | ✅ | Done | Done | Done |
| Localization (EN/ID) | ✅ | Done | Done | N/A |
| Toast Notifications | ✅ | Done | N/A | N/A |
| Field Update Tracking | ✅ | Done | Done | N/A |
| Company Classification | ✅ | Done | Done | Done |
| Certificate Types | ✅ | Done | Done | Done |
| Form Management | 🔄 | In Progress | In Progress | In Progress |
| Form Submissions | 🔄 | In Progress | In Progress | In Progress |

---

**Document Version:** 1.0.0  
**Last Updated:** December 10, 2025  
**Total Features Documented:** 26 Core + Advanced Features
