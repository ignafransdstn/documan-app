# 📋 DocuMan - Document Management System

## Dokumentasi Singkat

### 🎯 Tujuan Sistem

**DocuMan** adalah sistem manajemen dokumen berbasis web yang dirancang untuk:
- Mengelola dan menyimpan dokumen secara aman dengan enkripsi
- Melacak jejak audit lengkap setiap aktivitas user
- Mengorganisir dokumen dalam struktur hierarki (master & sub-dokumen)
- Mengontrol akses dokumen berdasarkan peran/role pengguna
- Mencegah akses ilegal dengan anti-screenshot protection
- Mendokumentasikan lokasi dokumen dengan GPS tracking
- Menyediakan user experience yang modern dan responsif

---

## 📚 Fitur & Fungsi Sistem

### 1. **Authentication & Authorization**
**Fungsi:** Keamanan akses sistem berbasis peran
- ✅ Login dengan email & password
- ✅ JWT token-based authentication
- ✅ 4 level role: Admin, Level1, Level2, Level3
- ✅ Role-based access control (RBAC) untuk setiap fitur
- ✅ Session management & token refresh
- ✅ Password hashing dengan bcryptjs

### 2. **User Management**
**Fungsi:** Kelola pengguna sistem
- ✅ Create user baru (Admin only)
- ✅ Read/View semua user dengan filter
- ✅ Update profil user & role
- ✅ Delete user (soft delete)
- ✅ Activate/Deactivate user status
- ✅ Edit profil user sendiri
- ✅ Change password

### 3. **Document Management**
**Fungsi:** Kelola dokumen master utama
- ✅ Upload dokumen (PDF, Word, Excel, Images)
- ✅ View dokumen dengan preview
- ✅ Edit metadata dokumen (title, description, etc)
- ✅ Delete dokumen (cascade delete sub-dokumen)
- ✅ Search & filter dokumen
- ✅ GPS coordinate tracking (lokasi dokumen)
- ✅ File versioning & history
- ✅ Download dokumen
- ✅ Set visibility level per role

### 4. **Sub-Document Management**
**Fungsi:** Kelola dokumen detail/pendamping
- ✅ Create sub-dokumen dari dokumen master
- ✅ Upload multiple sub-dokumen
- ✅ View dokumen dalam struktur hierarki
- ✅ Edit sub-dokumen metadata
- ✅ Delete sub-dokumen
- ✅ Cascade operations saat master dihapus
- ✅ Maintain dokumen relationships

### 5. **Activity Logging & Audit Trail**
**Fungsi:** Catat & monitor semua aktivitas
- ✅ Log setiap action user (Create, Read, Update, Delete)
- ✅ Record timestamp aktivitas
- ✅ Track user yang melakukan action
- ✅ Record IP address & user agent
- ✅ Search activity history
- ✅ Filter by user, action type, tanggal
- ✅ Export activity logs
- ✅ Compliance & audit reporting

### 6. **Security Features**
**Fungsi:** Perlindungan dokumen & sistem
- ✅ Anti-screenshot protection (CSS/JS techniques)
- ✅ Right-click disabled (prevent save)
- ✅ Keyboard shortcuts disabled
- ✅ Content protection watermark
- ✅ CORS configuration
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ XSS prevention (React sanitization)
- ✅ Rate limiting (preparation)

### 7. **Map Integration**
**Fungsi:** Visualisasi lokasi dokumen
- ✅ OpenStreetMap integration
- ✅ Display dokumen locations
- ✅ Mark dokumen di map
- ✅ View GPS coordinates
- ✅ Geotagged dokumen search

### 8. **UI/UX Features**
**Fungsi:** Pengalaman pengguna yang modern
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Smooth page transitions & animations
- ✅ Loading indicators & spinners
- ✅ Toast notifications (success, error, info)
- ✅ Modal dialogs untuk confirmations
- ✅ Sidebar navigation
- ✅ Dark/Light theme support (preparation)
- ✅ Accessibility features (ARIA labels)

### 9. **Reporting & Analytics**
**Fungsi:** Insight & reporting sistem
- ✅ Activity summary dashboard
- ✅ User activity reports
- ✅ Document access reports
- ✅ Export to PDF/CSV
- ✅ Chart visualizations
- ✅ Date range filtering

### 10. **API Documentation**
**Fungsi:** Developer reference
- ✅ Swagger/OpenAPI documentation
- ✅ Interactive API explorer
- ✅ Request/Response examples
- ✅ Authentication details
- ✅ Error code documentation
- ✅ Available at `/api-docs`

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                       User Browser                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (React 18 + TypeScript)                           │
│  ├─ Pages: Login, Dashboard, Documents, Users, Activity    │
│  ├─ Components: Navigation, Forms, Tables, Modals          │
│  ├─ Contexts: Auth, User, Document                         │
│  └─ Utils: API client, Validators, Helpers                 │
│                                                              │
├────────────────────▲────────────────────────────────────────┤
│                    │ REST API / JSON                         │
├────────────────────▼────────────────────────────────────────┤
│                                                              │
│  Backend (Express.js + Node.js v20)                         │
│  ├─ Routes: /auth, /documents, /users, /activity-logs      │
│  ├─ Controllers: Auth, Document, User, Activity            │
│  ├─ Middlewares: JWT Auth, Validators, Error Handling      │
│  ├─ Models: User, Document, SubDocument, ActivityLog       │
│  └─ Services: Upload, GPS, Email (prep), Export (prep)     │
│                                                              │
├────────────────────▲────────────────────────────────────────┤
│                    │ SQL Queries                             │
├────────────────────▼────────────────────────────────────────┤
│                                                              │
│  Database (PostgreSQL 14+)                                  │
│  ├─ Tables: users, documents, subDocuments, activityLogs   │
│  ├─ Indexes: For optimal query performance                 │
│  └─ Migrations: Version controlled schema changes           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Role-Based Access Control (RBAC)

| Action | Admin | Level1 | Level2 | Level3 |
|--------|-------|--------|--------|--------|
| **User Management** | ✅ Full | ❌ No | ❌ No | ❌ No |
| **Create Document** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Document** | ✅ All | ✅ Own | ✅ Own | ✅ Own |
| **Edit Document** | ✅ All | ✅ Own | ✅ Own | ⚠️ Limited |
| **Delete Document** | ✅ Yes | ✅ Own | ❌ No | ❌ No |
| **View Activity Logs** | ✅ All | ✅ Own | ❌ No | ❌ No |
| **Manage Roles** | ✅ Yes | ❌ No | ❌ No | ❌ No |

---

## 📁 Struktur Folder

```
document-management-system/
├── backend/                          # Node.js Express API
│   ├── src/
│   │   ├── app.js                   # Express app setup
│   │   ├── config/                  # Database & Swagger config
│   │   ├── controllers/             # Business logic
│   │   ├── routes/                  # API endpoints
│   │   ├── models/                  # Sequelize models
│   │   ├── middlewares/             # Auth, validators
│   │   └── utils/                   # Helper functions
│   ├── migrations/                  # Database migrations
│   ├── tests/                       # Test suites
│   └── package.json
│
├── frontend/                         # React Vite app
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   ├── components/              # Reusable components
│   │   ├── contexts/                # Context API
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Helper functions
│   │   └── App.tsx                  # Root component
│   ├── public/                      # Static assets
│   └── package.json
│
├── docs/                            # Documentation files
│   ├── SYSTEM-DOCUMENTATION.md
│   ├── FEATURES-DOCUMENTATION.md
│   ├── BUSINESS-PROCESS-DOCUMENTATION.md
│   └── FLOWCHART-DOCUMENTATION.md
│
├── scripts/                         # Utility scripts
├── docker-compose.yml               # Docker configuration
├── run-dev.sh                       # Start development servers
├── stop-dev.sh                      # Stop development servers
└── README.md                        # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20.19.5+
- PostgreSQL 14+
- npm or yarn

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd document-management-system

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start services
./run-dev.sh

# Frontend: http://localhost:5173
# Backend API: http://localhost:5001
# API Docs: http://localhost:5001/api-docs
```

### Default Credentials
```
Email: admin@example.com
Password: admin123
Role: Admin
```

---

## 📊 Database Schema

### Users Table
```sql
- id (PK)
- name
- email (UNIQUE)
- password (hashed)
- role (admin, level1, level2, level3)
- isActive (boolean)
- createdAt, updatedAt
```

### Documents Table
```sql
- id (PK)
- title
- description
- filePath
- fileSize
- mimeType
- uploadedBy (FK → Users)
- latitude (GPS)
- longitude (GPS)
- visibilityLevel (role)
- createdAt, updatedAt
```

### SubDocuments Table
```sql
- id (PK)
- title
- documentId (FK → Documents)
- filePath
- fileSize
- uploadedBy (FK → Users)
- createdAt, updatedAt
```

### ActivityLogs Table
```sql
- id (PK)
- action (create, read, update, delete)
- resourceType (user, document, etc)
- resourceId
- userId (FK → Users)
- ipAddress
- userAgent
- createdAt
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd ../frontend
npm test

# E2E tests
npm run test:e2e
```

---

## 📝 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user detail
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/activate` - Activate user
- `PATCH /api/users/:id/deactivate` - Deactivate user

### Documents
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document detail
- `POST /api/documents` - Upload document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/download` - Download file

### Sub-Documents
- `GET /api/documents/:id/sub-documents` - List sub-docs
- `POST /api/documents/:id/sub-documents` - Add sub-doc
- `DELETE /api/documents/:id/sub-documents/:subId` - Delete sub-doc

### Activity Logs
- `GET /api/activity-logs` - List activities
- `GET /api/activity-logs/summary` - Activity summary
- `POST /api/activity-logs/export` - Export logs

---

## 🔒 Security Best Practices

✅ **Implemented:**
- JWT token authentication
- Password hashing (bcryptjs)
- CORS configuration
- SQL injection prevention (ORM)
- XSS prevention (React sanitization)
- Anti-screenshot protection
- Role-based access control
- Activity logging & audit trail

⚠️ **Recommended for Production:**
- HTTPS/SSL certificate
- Rate limiting & DDoS protection
- 2FA/MFA implementation
- Database encryption at rest
- API versioning
- Environment-based secrets
- Regular security audits

---

## 📞 Support & Contact

Untuk bantuan atau pertanyaan:
- 📧 Email: support@example.com
- 🐛 Issues: Report di GitHub Issues
- 💬 Discussions: GitHub Discussions

---

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated:** December 11, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready

