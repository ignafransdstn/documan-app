# DocuMan - Business Process Documentation
## Detailed Business Process Flows & Workflows

**Last Updated:** December 10, 2025  
**Version:** 1.0.0

---

## Table of Contents
1. [Business Process Overview](#business-process-overview)
2. [Core Business Processes](#core-business-processes)
3. [Actor Roles & Responsibilities](#actor-roles--responsibilities)
4. [System Workflows](#system-workflows)
5. [Data Flows](#data-flows)
6. [Exception Handling](#exception-handling)

---

## Business Process Overview

### Organizational Context

**DocuMan** adalah sistem yang dirancang untuk mendukung manajemen dokumentasi dalam organisasi properti/real estate, dengan fokus pada:
- **Centralized Document Repository:** Satu tempat untuk semua dokumen
- **Metadata Enrichment:** Setiap dokumen memiliki informasi lengkap
- **Access Control:** Hanya authorized users yang bisa akses dokumen
- **Audit Trail:** Semua aktivitas tercatat untuk compliance
- **Geographic Tracking:** Lokasi dan koordinat untuk properti

---

## Core Business Processes

### 1. User Management Process

#### 1.1 New User Registration (Self-Service)

```
Stakeholders: New Employee, Admin

Process Flow:
┌─────────────────────────────────────────────┐
│ 1. Prospective User visits sign-up page     │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 2. User fills registration form             │
│    - Username (unique check)                │
│    - Email (unique check)                   │
│    - Password (minimum 6 chars)             │
│    - Full name                              │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 3. Frontend validation                      │
│    ✓ All fields filled                      │
│    ✓ Format valid                           │
│    ✗ If error → show inline message        │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 4. Backend validation & user creation       │
│    ✓ Username unique                        │
│    ✓ Email unique                           │
│    ✓ Password hashed (bcryptjs)             │
│    ✗ If duplicate → error response          │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 5. User record created (isApproved=false)   │
│    - Default level: Level 1                 │
│    - isActive: true                         │
│    - Awaiting admin approval                │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 6. Frontend success notification            │
│    "Registration successful, awaiting       │
│     admin approval"                         │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 7. Admin reviews pending users              │
└────────────┬────────────────────────────────┘
             │
             ├─→ [Approve] → Set isApproved=true
             │              → User can login
             │
             └─→ [Reject] → Delete user record
                           → User gets email (future)

Duration: 1-2 business days average
Success Rate: 95%+ (validation prevents errors)
```

#### 1.2 User Level Assignment

```
Stakeholders: Admin, HR Department

Process:
┌─────────────────────────────────────────────┐
│ 1. Admin views Users page                   │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 2. Identify user to assign level            │
│    - Review job title/department            │
│    - Determine appropriate access level     │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 3. Open Edit User modal                     │
│    - Current level: Level 1                 │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 4. Change user level in dropdown            │
│    [Dropdown: admin/level1/level2/3/4]      │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 5. Click Update → API call                  │
│    PUT /api/users/:id                       │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 6. Backend updates user record              │
│    - Set new userLevel                      │
│    - Record timestamp                       │
│    - Log activity                           │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 7. Admin gets success notification          │
│    - User level changed to Level 2          │
│    - Takes effect immediately               │
└────────────┬────────────────────────────────┘

Duration: 5 minutes
Frequency: When hiring or promoting
Prerequisite: Admin access
```

#### 1.3 User Activation/Deactivation

```
Stakeholders: Admin, HR (when employee leaves)

Process:
┌─────────────────────────────────────────────┐
│ 1. Admin identifies user to deactivate      │
│    - User leaving organization              │
│    - User on leave                          │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 2. Admin clicks status toggle                │
│    Current: Active (isActive=true)          │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 3. Confirmation dialog                      │
│    "Deactivate user? User cannot login"     │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 4. Admin confirms                           │
│    PATCH /api/users/:id/status              │
│    { isActive: false }                      │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 5. User record updated                      │
│    - isActive = false                       │
│    - Activity logged                        │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 6. Effect: User cannot login                │
│    - Session remains but expires            │
│    - No new sessions allowed                │
└────────────┬────────────────────────────────┘

Duration: 1 minute
Reversible: Yes, toggle back to activate
Audit Trail: Full logging
```

---

### 2. Document Management Process

#### 2.1 Document Upload (Master Document)

```
Stakeholders: Document Manager, Administrator, User

Starting Condition: User authenticated, on Documents page

Process:
┌──────────────────────────────────────────────────┐
│ 1. Click "Upload Document" button                │
│    Upload form appears with all fields           │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ 2. Select Document Type: "Master Document"       │
│    (vs Sub-Document for linked documents)        │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│ 3. Fill Required Fields:                         │
│    ✓ Title (document name)                       │
│    ✓ Category (dropdown)                         │
│      - Corporate Document / Permit Document      │
│    ✓ Location (autocomplete)                     │
│      - Select from 30+ locations                 │
│    ✓ Description (max 350 chars)                 │
│    ✓ File upload (PDF only)                      │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ 4. Fill Optional Fields:                         │
│    □ Certificate Type (dropdown)                 │
│    □ Land Size                                   │
│    □ Area Name                                   │
│    □ Project Name                                │
│    □ Company (dropdown: JH, JHT, BEP, PIJ)      │
│    □ Publish Date (date picker)                 │
│    □ Expiration Date (date picker)               │
│    □ Document Obtained Date                      │
│    □ Origin Document                             │
│    □ Previous Owner                              │
│    □ Latitude/Longitude (coordinates)            │
│    □ Zone URL                                    │
│    □ Zone RTDR                                   │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ 5. Frontend Validation                           │
│    ✓ Required fields filled                      │
│    ✓ File size < 50MB                           │
│    ✓ File type = PDF                             │
│    ✗ If validation fails → show error message   │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ 6. Click "Upload" button                         │
│    - Show progress indicator                     │
│    - Form disabled during upload                 │
│    - POST /api/documents                         │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ 7. Backend Processing:                           │
│    ✓ Authenticate user (JWT validation)          │
│    ✓ Authorize permission (document upload)      │
│    ✓ Validate file size                          │
│    ✓ Validate file type                          │
│    ✓ Validate metadata                           │
│    ✗ If fails → return error response            │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ 8. File Processing:                              │
│    - Save to disk: /uploads/documents/           │
│    - Name: [originalName]-[timestamp].pdf        │
│    - Generate file URL                           │
│    - Store file path in database                 │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ 9. Database Record Creation:                     │
│    INSERT Documents table:                       │
│    - id (auto-increment)                         │
│    - title                                       │
│    - location                                    │
│    - category                                    │
│    - fileUrl                                     │
│    - all metadata fields                         │
│    - createdBy (user ID)                         │
│    - createdAt (timestamp)                       │
│    - updatedAt (timestamp)                       │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ 10. Activity Logging:                            │
│     INSERT ActivityLogs:                         │
│     - userId, action: "upload"                   │
│     - resourceType: "Document"                   │
│     - resourceId: new document ID                │
│     - status: "success"                          │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ 11. Frontend Notification:                       │
│     ✓ Upload succeeded                           │
│     - Toast notification (green)                 │
│     - Form clears/resets                         │
│     - New document appears in list               │
│     - Scroll to newly uploaded document          │
└──────────┬──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────┐
│ 12. Process Complete                             │
│     Document now accessible to authorized users  │
└──────────────────────────────────────────────────┘

Duration: 30 seconds - 2 minutes (depending on file size)
Success Rate: 98% (validation prevents most errors)
Rollback: Delete operation available if mistake
Error Handling: Detailed error messages guide user
```

#### 2.2 Sub-Document Upload (Linked Document)

```
Stakeholders: Document Manager, Master Document Owner

Starting Condition: Master document exists in system

Process:
┌───────────────────────────────────────────────────────┐
│ 1. View master document                               │
│    Expand to show sub-documents section               │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────┐
│ 2. Click "Add Sub-Document" button                    │
│    Upload form opens (similar to master)              │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────┐
│ 3. Document Type Auto-selected: "Sub-Document"        │
│    Parent document ID: [master document ID]           │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────┐
│ 4. Fill Form (same fields as master):                 │
│    - All metadata fields                              │
│    - Category can be same or different                │
│    - Location can be same or different                │
│    - Select PDF file                                  │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────┐
│ 5. Backend Processing:                                │
│    - Same validation as master                        │
│    - Get next sub-document number                     │
│    - Auto-generate: SUB-001, SUB-002, etc.            │
│    - Link to parent document via documentId FK        │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────┐
│ 6. Database Record Creation:                          │
│    INSERT SubDocuments:                               │
│    - subDocumentNo (auto: SUB-NNN)                    │
│    - All metadata fields                              │
│    - documentId (FK to master)                        │
│    - createdBy (user ID)                              │
│    - timestamps                                       │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────┐
│ 7. Activity Logged & Notification Shown               │
│    New sub-document appears in master's list          │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────┐
│ 8. Master Document Updated Display:                   │
│    Sub-document count incremented                     │
│    New sub-document visible in expanded list          │
└───────────────────────────────────────────────────────┘

Auto-Numbering: System generated (SUB-001, SUB-002, ...)
Max Sub-Documents: No limit
Duplication: Allowed (same file can be sub of multiple masters)
```

#### 2.3 Document Editing (Update Metadata)

```
Stakeholders: Document Owner, Editor, Auditor

Starting Condition: Document exists, user has edit permission (Level 2+)

Process:
┌───────────────────────────────────────────┐
│ 1. View document card or detail           │
│    Click "Edit" button                    │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 2. Edit Modal Opens                       │
│    - All fields populated with current    │
│      values (read from database)          │
│    - Location shows current value         │
│    - Dates displayed in readable format   │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 3. User modifies desired fields           │
│    - Can change any field                 │
│    - Can change category                  │
│    - Can update location (autocomplete)   │
│    - Can modify dates                     │
│    - Cannot change document ID            │
│    - Cannot change creation date          │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 4. Frontend tracks changed fields         │
│    - Compare with original values         │
│    - Build "changes" object               │
│    Example:                               │
│    {                                      │
│      title: "New Title",                  │
│      location: "New Location",            │
│      category: "Permit Document"          │
│    }                                      │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 5. Click "Update" button                  │
│    Frontend validation                    │
│    - Required fields filled               │
│    - Format validation                    │
│    - Prepare API payload                  │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 6. API Call: PUT /api/documents/:id       │
│    Body: { title, location, category...  │
│    Headers: Authorization token           │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 7. Backend Processing:                    │
│    ✓ Validate JWT token                   │
│    ✓ Check user permission (Level 2+)     │
│    ✓ Check document ownership (optional)  │
│    ✓ Validate updated fields              │
│    ✗ Reject if validation fails           │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 8. Database Update:                       │
│    UPDATE Documents SET:                  │
│    - Only modified fields                 │
│    - updatedAt = NOW()                    │
│    WHERE id = ?                           │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 9. Activity Logging:                      │
│    INSERT ActivityLogs:                   │
│    - action: "update"                     │
│    - details: changed fields list         │
│    - Example:                             │
│      {                                    │
│        changedFields: [                   │
│          "title", "location",             │
│          "category"                       │
│        ]                                  │
│      }                                    │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 10. Frontend Notification:                │
│     Toast shows changed fields as badges  │
│     ✓ Document Updated                    │
│     [Title Changed]                       │
│     [Location Changed]                    │
│     [Category Changed]                    │
│                                           │
│     - Auto-hide after 5 seconds           │
│     - Modal closes                        │
└───────────────┬───────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│ 11. Document List Updated:                │
│     Display shows new values               │
│     Document card refreshed                │
└───────────────────────────────────────────┘

Duration: 30 seconds
Audit Trail: Full change history logged
Permissions: Level 2+
Reversibility: Subsequent edit can revert changes
Notification: User knows what changed
```

#### 2.4 Document Deletion

```
Stakeholders: Document Owner, Administrator, Compliance Officer

Starting Condition: Document exists, user has delete permission (Level 3+)

Process:
┌──────────────────────────────────────────────┐
│ 1. Click "Delete" button on document         │
│    Red icon / button clearly marked          │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│ 2. System checks for sub-documents           │
│    - Count sub-documents for this master     │
│    - Determine if cascade delete needed      │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│ 3. Confirmation Dialog:                      │
│    ┌──────────────────────────────────┐      │
│    │ Delete Document?                 │      │
│    │ This action cannot be undone.    │      │
│    │ This document has X sub-docs.    │      │
│    │ [Cancel] [Delete] (red button)   │      │
│    └──────────────────────────────────┘      │
└──────────────┬───────────────────────────────┘
               │
               ├─→ User clicks [Cancel]
               │   → Dialog closes
               │   → No changes made
               │   ✓ Process ends here
               │
               └─→ User clicks [Delete]
                   ↓
┌──────────────────────────────────────────────┐
│ 4. API Call: DELETE /api/documents/:id       │
│    Headers: Authorization token              │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│ 5. Backend Processing:                       │
│    ✓ Validate JWT token                      │
│    ✓ Check delete permission (Level 3+)      │
│    ✓ Verify document exists                  │
│    ✗ Reject if not authorized                │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│ 6. Cascade Delete:                           │
│    Transaction start:                        │
│    - Delete document PDF file from disk      │
│    - Delete SubDocuments:                    │
│      - For each sub-document:                │
│        * Delete PDF file                     │
│        * Delete DB record                    │
│    - Delete Documents record                 │
│    - Commit transaction                      │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│ 7. Activity Logging (multiple entries):       │
│    - "delete" action for master doc          │
│    - "delete" action for each sub-doc        │
│    - Status: "success" for all               │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│ 8. Frontend Update:                          │
│    ✓ Document removed from list              │
│    ✓ Success notification shown              │
│    ✓ Page updates (pagination adjusted)      │
│    ✓ Sub-document count decremented          │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│ 9. Process Complete                          │
│    Document permanently deleted              │
│    Cannot be recovered (hard delete)         │
└──────────────────────────────────────────────┘

Duration: 10-30 seconds
Reversibility: NO (hard delete, no soft delete)
Audit Trail: Complete audit of deletion
Permission Required: Level 3+
Files Deleted: Main document + all sub-documents
Cascade: All sub-documents automatically deleted
```

#### 2.5 Document Viewing

```
Stakeholders: All authenticated users

Starting Condition: Document exists, user has view permission (Level 1+)

Process:
┌─────────────────────────────────────────┐
│ 1. Click document card or title         │
│    Open detail modal                    │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 2. Detail Modal Loads:                  │
│    ├─ Document title (read-only)        │
│    ├─ All metadata fields (read-only)   │
│    ├─ Category badge                    │
│    ├─ Location with map                 │
│    │  (Leaflet map with marker)         │
│    ├─ Download button                   │
│    └─ Close button                      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 3. User views metadata:                 │
│    - Read all document information      │
│    - Cannot edit (view-only)            │
│    - Can view location on map           │
│    - Can download document              │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 4. Optional: Click Download             │
│    → Trigger PDF download               │
│    → File saved to downloads folder     │
│    → Activity logged                    │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 5. PDF Viewer Integration:              │
│    - Embedded PDF viewer                │
│    - Shows pages of document            │
│    - Watermark visible (CONFIDENTIAL)   │
│    - Cannot copy/select text            │
│    - Anti-screenshot measures           │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 6. Map Display:                         │
│    - Leaflet map centered on location   │
│    - Marker shows coordinates           │
│    - Zoom controls available            │
│    - Street view optional (future)      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 7. Close Modal:                         │
│    - Modal closes                       │
│    - Return to document list            │
└─────────────────────────────────────────┘

Duration: Variable (user-dependent)
Performance: <1 second modal load
Security: Watermark prevents unauthorized copying
Audit: View logged only on download
Permissions: All authenticated users
```

---

### 3. Search & Filtering Process

#### 3.1 Search Document by Title

```
Stakeholders: Any user looking for specific document

Process:
┌────────────────────────────────────────┐
│ 1. User types in search box            │
│    Real-time input                     │
│    "Jimbaran Hijau"                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 2. Frontend detects input change       │
│    - Debounce timer (300ms)            │
│    - Build search query                │
└────────────┬────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 3. Query API: GET /api/documents       │
│    ?search=jimbaran&page=1&limit=10    │
└────────────┬────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 4. Backend Processing:                 │
│    - Case-insensitive LIKE query       │
│    - Search in title field             │
│    - Filter by user permissions        │
│    - Apply pagination                  │
│    - Return results + total count      │
└────────────┬────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 5. Frontend Updates:                   │
│    - Display results matching query    │
│    - Show result count                 │
│    - Show pagination                   │
│    - "No results" if empty             │
└────────────┬────────────────────────────┘

Duration: <500ms (average)
Case-Sensitivity: No (case-insensitive)
Scope: Document titles only
Live Update: Yes (changes as user types)
```

#### 3.2 Filter by Category/Type

```
Stakeholders: Users looking for specific document types

Process:
┌────────────────────────────────────────┐
│ 1. Access filter options               │
│    See filter dropdowns/buttons        │
└────────────┬────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 2. Apply filters:                      │
│    ├─ Category:                        │
│    │  • Corporate Document             │
│    │  • Permit Document                │
│    │  • All                            │
│    │                                   │
│    └─ Master/Sub filter:               │
│       • Master only                    │
│       • Master with subs               │
│       • All                            │
└────────────┬────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 3. API Call with filter params:        │
│    GET /api/documents?                 │
│      category=Corporate&               │
│      masterOnly=false&                 │
│      page=1                            │
└────────────┬────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 4. Backend filters results             │
│    - Apply WHERE clauses               │
│    - Combine multiple filters          │
│    - Count matching results            │
│    - Paginate response                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 5. Display filtered results            │
│    - Only documents matching filters   │
│    - Update count display              │
│    - Reset pagination to page 1        │
└────────────────────────────────────────┘

Duration: <500ms
Persistence: Reset on page reload
Combination: Multiple filters work together
```

---

### 4. Activity Logging & Audit Trail

```
Stakeholders: Compliance Officer, System Administrator, Auditor

Logging Scope: Every user action is logged

Logged Actions:
├── Document Operations
│   ├── Upload
│   ├── Edit (with field list)
│   ├── Delete
│   └── Download
├── User Operations
│   ├── Login
│   ├── Logout
│   ├── Create user
│   └── Change level
└── System Operations
    ├── Permission denied
    └── Errors

Log Record Structure:
{
  id: INT
  userId: INT (FK User)
  action: VARCHAR (upload, edit, delete, login, etc)
  resourceType: VARCHAR (Document, SubDocument, User)
  resourceId: INT (which document/user)
  details: JSON {
    changedFields: ["field1", "field2"],
    oldValues: {...},
    newValues: {...}
  }
  ipAddress: VARCHAR
  userAgent: VARCHAR (browser info)
  status: VARCHAR (success, failure)
  createdAt: TIMESTAMP
}

Audit Trail Access:
- Admin only
- Filter by:
  • User
  • Action type
  • Date range
  • Resource type
- Display in table format
- Export to CSV (future)
```

---

## Actor Roles & Responsibilities

### 1. Administrator
**Responsibilities:**
- User account management (approve, reject, deactivate)
- Assign user levels and permissions
- Monitor system health
- View audit logs
- System configuration (future)

**Actions Allowed:**
- Create documents (unlimited)
- Edit all documents
- Delete all documents
- Manage all users
- View all documents regardless of owner
- Access forms management
- View complete audit trail

**Access Level:** 100% (full system)

### 2. Level 4 User (Form Submitter)
**Responsibilities:**
- Submit forms
- Manage own documents
- Create and link sub-documents
- View assigned documents

**Actions Allowed:**
- Create documents
- Edit own documents
- Delete own documents
- Create/edit/delete own sub-documents
- Submit forms
- View own activity logs (partial)

**Restrictions:**
- Cannot manage users
- Cannot delete others' documents
- Cannot manage forms

### 3. Level 3 User (Senior Editor)
**Responsibilities:**
- Create and manage documents
- Edit document metadata
- Manage sub-documents
- Provide documentation

**Actions Allowed:**
- Create documents
- Edit own documents (and possibly shared)
- Delete own documents
- Create/edit/delete sub-documents
- View documents within own department (future)

**Restrictions:**
- Cannot manage users
- Cannot delete shared documents
- Cannot manage forms

### 4. Level 2 User (Editor)
**Responsibilities:**
- Create and edit documents
- Cannot delete documents
- Upload and manage content

**Actions Allowed:**
- Create documents
- Edit own documents
- Create/edit sub-documents
- Cannot delete documents
- View documents

**Restrictions:**
- Cannot delete anything
- Cannot change document structure

### 5. Level 1 User (Viewer)
**Responsibilities:**
- Access documents
- Review content
- View-only access

**Actions Allowed:**
- View all documents (based on permissions)
- View sub-documents
- Download for personal reference
- View metadata

**Restrictions:**
- Cannot upload
- Cannot edit
- Cannot delete

---

## System Workflows

### Complete Document Lifecycle

```
┌─────────────────────────────────────────────┐
│ 1. NEW (Just uploaded)                      │
│    • Document in system                     │
│    • All metadata initialized               │
│    • Ready for access                       │
└─────────────┬───────────────────────────────┘
              │
              ├─→ Edit Phase:
              │   ├─ Edit metadata
              │   ├─ Add sub-documents
              │   ├─ Update coordinates
              │   └─ Adjust details
              │   ↓
              │
              ├─→ Review Phase:
              │   ├─ View complete document
              │   ├─ Verify accuracy
              │   ├─ Check sub-documents
              │   └─ Download for approval
              │   ↓
              │
              ├─→ Active Phase:
              │   ├─ Document accessible
              │   ├─ Referenced in workflows
              │   ├─ Viewed by users
              │   └─ Tracked in audit log
              │   ↓
              │
              └─→ Delete Phase:
                  ├─ User requests deletion
                  ├─ Confirmation required
                  ├─ Cascade delete subs
                  └─ Permanently removed
                  
All phases logged in activity log
```

---

## Data Flows

### Document Data Flow

```
User Input
   ↓
Frontend Validation
   ├─ Required fields check
   ├─ Format validation
   └─ File type/size check
   ↓
API Request (JSON + FormData)
   ├─ Metadata in JSON
   └─ File in FormData
   ↓
Backend Processing
   ├─ JWT validation
   ├─ Permission check
   ├─ Input validation
   └─ File processing
   ↓
File Storage
   ├─ Save to disk
   └─ Generate URL
   ↓
Database Storage
   ├─ Insert Documents record
   ├─ Store file URL
   └─ Store metadata
   ↓
Activity Logging
   ├─ Log user action
   └─ Record success
   ↓
Response to Frontend
   ├─ Return document ID
   └─ Return full record
   ↓
Frontend Display
   ├─ Update document list
   ├─ Show notification
   └─ Refresh pagination
```

### Search Data Flow

```
User Types Query
   ↓
Frontend Debounces (300ms)
   ↓
Build Search Parameters
   ├─ Search term
   ├─ Page number
   └─ Filters
   ↓
API Query
   GET /api/documents?search=...&page=...
   ↓
Database Query
   ├─ LIKE search on title
   ├─ Apply WHERE filters
   ├─ COUNT total
   └─ LIMIT & OFFSET for page
   ↓
Results Formatting
   ├─ Fetch all columns
   ├─ Include sub-doc count
   └─ Format for display
   ↓
Response to Frontend
   ├─ Document array
   ├─ Total count
   └─ Page info
   ↓
Frontend Renders
   ├─ Clear previous results
   ├─ Display new results
   └─ Update pagination
```

---

## Exception Handling

### Error Scenarios & Recovery

#### 1. Upload Fails (File Size Exceeded)
```
Trigger: User uploads >50MB file
Detection: Frontend first, Backend confirmation
Recovery:
  1. Show error message
  2. Suggest compression
  3. Allow retry
  4. No database record created
  5. File deleted from temp storage
```

#### 2. Network Error During Upload
```
Trigger: Connection lost during file transfer
Detection: XHR error event
Recovery:
  1. Stop upload process
  2. Show error notification
  3. No partial database record
  4. Clean up temp file
  5. User can retry
```

#### 3. Unauthorized Access Attempt
```
Trigger: User without permission tries action
Detection: JWT validation or permission check fails
Recovery:
  1. Reject API request
  2. Return 403 Forbidden
  3. Log attempt in audit
  4. Frontend redirects to dashboard
  5. Show permission denied message
```

#### 4. Database Transaction Failure
```
Trigger: Database constraint violation (e.g., duplicate username)
Detection: Database returns error
Recovery:
  1. Rollback transaction
  2. Return error response
  3. Frontend shows specific error
  4. User can correct and retry
  5. Activity log shows failure
```

#### 5. File Storage Failure
```
Trigger: Disk full or permission denied
Detection: File write operation fails
Recovery:
  1. Delete partial file
  2. Rollback database transaction
  3. Show error to user
  4. Alert administrator (future)
  5. Suggest contacting support
```

---

**Document Version:** 1.0.0  
**Last Updated:** December 10, 2025  
**Total Processes Documented:** 8 Core Processes + 4 Sub-processes
