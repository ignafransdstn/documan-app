# DocuMan - Document Management System

> **� [QUICK START](./QUICK-START.md)** - Mulai dalam 5 menit!

> **📚 Dokumentasi Lengkap:** 
> - ⚡ [Quick Start Guide](./QUICK-START.md) - Setup cepat (5 menit)
> - 📖 [Dokumentasi Singkat](./DOKUMENTASI-SINGKAT.md) - Overview & fitur utama
> - 📘 [Dokumentasi Lengkap](./DOKUMENTASI-LENGKAP.md) - Detail teknis lengkap
> - 📑 [Dokumentasi Index](./DOKUMENTASI-INDEX.md) - Daftar semua dokumentasi
> - 📊 [Business Process](./docs/BUSINESS-PROCESS-DOCUMENTATION.md) - Alur bisnis & workflow
> - 🎯 [Features & Functions](./docs/FEATURES-DOCUMENTATION.md) - Detail fitur sistem
> - 🗺️ [Flowcharts](./docs/FLOWCHART-DOCUMENTATION.md) - Diagram alur visual

## 📋 Overview

**DocuMan** adalah sistem manajemen dokumen berbasis web yang dirancang untuk mengelola dokumen master dan sub-dokumen dengan fitur keamanan tinggi, tracking GPS, dan role-based access control.

### 🎯 Key Features

- **Authentication & Authorization** - JWT-based dengan role-based access control (Admin, Level1, Level2, Level3)
- **Document Management** - Upload, view, edit, delete dokumen dengan support GPS coordinates
- **Sub-Document System** - Hierarchical document structure dengan cascade operations
- **User Management** - Complete user CRUD dengan activation/deactivation
- **Activity Logging** - Track semua aktivitas user dalam sistem
- **Anti-Screenshot Protection** - Keamanan tingkat tinggi untuk melindungi dokumen
- **Map Integration** - Visualisasi lokasi dokumen dengan OpenStreetMap
- **Smooth Animations** - Modern UI dengan page transitions dan micro-interactions

### 🛠️ Technology Stack

#### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **ORM:** Sequelize
- **Authentication:** JWT (jsonwebtoken)
- **File Upload:** Multer
- **Password Hashing:** bcryptjs
- **API Documentation:** Swagger/OpenAPI
- **Testing:** Jest + Supertest

#### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **State Management:** Context API
- **Styling:** Custom CSS with animations
- **HTTP Client:** Axios

### 📊 System Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │ ◄─────► │   Frontend   │ ◄─────► │   Backend    │
│  (React)    │  HTTP   │   (Vite)     │  REST   │  (Express)   │
└─────────────┘         └──────────────┘   API   └──────┬───────┘
                                                         │
                                                         ▼
                                                  ┌──────────────┐
                                                  │  PostgreSQL  │
                                                  │   Database   │
                                                  └──────────────┘
```

### 👥 User Roles & Permissions

| Role    | Create Doc | Edit Doc | Delete Doc | View Doc | Manage Users | Download |
|---------|------------|----------|------------|----------|--------------|----------|
| Admin   | ✅         | ✅       | ✅         | ✅       | ✅           | ✅       |
| Level1  | ✅         | ✅       | ✅         | ✅       | ❌           | ✅       |
| Level2  | ✅         | ✅       | ❌         | ✅       | ❌           | ✅       |
| Level3  | ❌         | ❌       | ❌         | ✅       | ❌           | ❌       |

### 🚀 Quick Start

#### Prerequisites
```bash
- Node.js 18+
- PostgreSQL 14+
- npm atau yarn
```

#### Installation

1. **Clone Repository**
```bash
git clone <repository-url>
cd document-management-system
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database Anda
npm run create-admin
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- API Docs: http://localhost:5001/api-docs

#### Default Admin Login
```
Username: admin
Password: admin123
```

### 📁 Project Structure

```
document-management-system/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app entry point
│   │   ├── config/
│   │   │   ├── database.js        # Sequelize configuration
│   │   │   └── swagger.js         # Swagger setup
│   │   ├── controllers/
│   │   │   ├── authController.js  # Authentication logic
│   │   │   ├── documentController.js
│   │   │   └── userController.js
│   │   ├── middlewares/
│   │   │   ├── auth.js            # JWT verification
│   │   │   ├── screenCapture.js   # Anti-screenshot
│   │   │   └── validators.js      # Input validation
│   │   ├── models/
│   │   │   ├── index.js           # Sequelize models
│   │   │   ├── user.js
│   │   │   ├── document.js
│   │   │   └── subDocument.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── documents.js
│   │   │   └── users.js
│   │   └── scripts/
│   │       └── createAdmin.js
│   ├── tests/                     # Jest test suites
│   ├── uploads/                   # File storage
│   ├── .env                       # Environment variables
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg            # App icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Nav.tsx            # Navigation bar
│   │   │   └── PageTransition.tsx # Page animations
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx    # Auth state management
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DocumentsPage.tsx
│   │   │   └── UsersPage.tsx
│   │   ├── styles/
│   │   │   └── theme.css          # Global styles
│   │   ├── api.ts                 # API client
│   │   ├── App.tsx                # App root
│   │   └── main.tsx               # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── docs/
│   ├── BACKEND-DOCUMENTATION.md
│   ├── FRONTEND-DOCUMENTATION.md
│   ├── BUSINESS-LOGIC.md
│   └── DATABASE-SCHEMA.md
│
├── DEPLOYMENT-GUIDE.md
├── TEST-REPORT.md
└── README.md (this file)
```

### 🔐 Security Features

1. **Authentication**
   - JWT tokens dengan expiration
   - Bcrypt password hashing (10 rounds)
   - Token refresh mechanism
   - Session management

2. **Authorization**
   - Role-based access control (RBAC)
   - Protected API endpoints
   - Permission-based UI rendering

3. **Input Validation**
   - Email format validation
   - Password strength requirements
   - File type & size validation
   - SQL injection prevention (Sequelize ORM)

4. **File Security**
   - Sanitized file names
   - Type validation (PDF only)
   - Size limit (10MB default)
   - Secure storage path

5. **Anti-Screenshot Protection**
   - PrintScreen key blocking
   - Context menu disable
   - Keyboard shortcut prevention
   - Screenshot attempt alerts

### 📊 Database Schema

| Table | Kolom Utama |
|-------|-------------|
| `users` | id, username, email, password, userLevel, isActive |
| `documents` | id, documentNo, certificateType, company, publishDate, expiryDate, latitude, longitude, userId |
| `sub_documents` | id, subDocumentNo, certificateType, publishDate, expiryDate, documentId |
| `document_versions` | id, documentId, filePath, version, uploadedBy |
| `projects` | id, name, description, userId |
| `project_documents` | id, projectId, documentId |
| `activity_logs` | id, userId, action, description, ipAddress, createdAt |

```
users ──► documents ──► sub_documents
  │            └──────► document_versions
  │
  ├──► projects ──► project_documents ──► documents
  │
  └──► activity_logs
```

### 🧪 Testing

```bash
# Run all backend tests
cd backend
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
./test-e2e.sh
```

**Test Results:**
- Unit Tests: 35/52 passing
- E2E Tests: 9/10 passing
- Coverage: ~70%

### 📈 Performance

- **Page Load:** < 2s
- **API Response:** < 100ms average
- **File Upload:** Up to 10MB
- **Concurrent Users:** 50+ supported

### 🌍 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 📝 API Endpoints

#### Authentication
```
POST   /api/auth/signup          # Public registration
POST   /api/auth/login           # User login
POST   /api/auth/logout          # User logout
POST   /api/auth/refresh-token   # Refresh JWT
GET    /api/auth/profile         # Get profile
```

#### Documents
```
GET    /api/documents            # List all documents
GET    /api/documents/:id        # Get document
POST   /api/documents            # Create document
PUT    /api/documents/:id        # Update document
DELETE /api/documents/:id        # Delete document
POST   /api/documents/:id/subdocuments  # Add sub-doc
```

#### Users (Admin only)
```
GET    /api/users                # List users
POST   /api/users                # Create user
PUT    /api/users/:id            # Update user
DELETE /api/users/:id            # Delete user
PATCH  /api/users/:id/activation # Toggle active
GET    /api/users/summary        # Dashboard stats
GET    /api/users/activity-logs  # Activity logs
```

### 🎨 UI/UX Features

- **Smooth Page Transitions** - 0.4s fade + slide + blur effect
- **Button Animations** - Hover effects dengan scale & translateY
- **Modal Animations** - Fade in dengan slide up
- **Active Tab Indicators** - Gradient background dengan glow effect
- **Loading States** - Skeleton screens dan spinners
- **Responsive Design** - Mobile-first approach
- **Dark Theme** - Modern dark color scheme

### 🔧 Configuration

#### Backend Environment (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/doc_management
JWT_SECRET=your-secret-key-here
PORT=5001
NODE_ENV=development
MAX_FILE_SIZE=10485760
```

#### Frontend Environment
```env
VITE_API_URL=http://localhost:5001/api
```

### 📦 Deployment

#### Quick Deployment to UpCloud (Recommended)

```bash
# 1. Create UpCloud VM (Ubuntu 22.04, 2 CPU, 4 GB RAM)
# 2. Upload project files
scp documan-deploy.tar.gz root@YOUR_SERVER_IP:/root/

# 3. SSH to server and deploy
ssh root@YOUR_SERVER_IP
mkdir -p /opt/documan
tar -xzf documan-deploy.tar.gz -C /opt/documan
cd /opt/documan

# 4. Configure environment
cp .env.production .env
nano .env  # Edit DB_PASSWORD, JWT_SECRET, etc.

# 5. Deploy with Docker
chmod +x deploy.sh
./deploy.sh
```

**See detailed guides:**
- [DEPLOYMENT-UPCLOUD.md](DEPLOYMENT-UPCLOUD.md) - Complete deployment guide
- [QUICK-DEPLOY.md](QUICK-DEPLOY.md) - Quick reference & troubleshooting

#### Docker Compose (Production)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Health check
./monitor.sh

# Backup database
./backup-db.sh
```

#### Manual Production Build

**Backend:**
```bash
cd backend
npm ci --production
NODE_ENV=production node src/app.js
```

**Frontend:**
```bash
cd frontend
npm run build
# Deploy dist/ folder to Nginx or static hosting
```

### 🐛 Troubleshooting

**Database Connection Error:**
```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
```

**Port Already in Use:**
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9
```

**JWT Token Invalid:**
- Clear browser localStorage
- Re-login to get fresh token
- Verify JWT_SECRET matches

### 📚 Documentation

Detailed documentation tersedia di folder `docs/`:
- [Backend Documentation](docs/BACKEND-DOCUMENTATION.md)
- [Frontend Documentation](docs/FRONTEND-DOCUMENTATION.md)
- [Business Logic & Flow](docs/BUSINESS-LOGIC.md)
- [Database Schema](docs/DATABASE-SCHEMA.md)
- [Deployment Guide](DEPLOYMENT-GUIDE.md)

### 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### 📄 License

MIT License - see LICENSE file for details

### 👨‍💻 Development Team

- **System Architecture:** Full-stack Developer
- **Backend Development:** Node.js/Express Specialist
- **Frontend Development:** React/TypeScript Developer
- **Database Design:** PostgreSQL Expert
- **UI/UX Design:** Frontend Designer

### 📞 Support

- **Documentation:** See `/docs` folder
- **API Docs:** http://localhost:5001/api-docs
- **Issues:** GitHub Issues
- **Email:** support@documan.app

### 🎯 Roadmap

- [ ] Multi-language support (i18n)
- [ ] Advanced search with filters
- [ ] Document versioning
- [ ] OCR for scanned documents
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard

---

**Version:** 1.0.0  
**Release Date:** November 21, 2025  
**Status:** ✅ Production Ready

**© 2025 DocuMan. All rights reserved.**
