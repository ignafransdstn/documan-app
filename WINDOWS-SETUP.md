# 🪟 Panduan Menjalankan DocuMan di Windows

## 🚀 Quick Start

### **Cara Tercepat (Recommended)**

```powershell
# 1. Setup awal (sekali saja)
.\start-dev.ps1

# Script akan otomatis:
# - Check prerequisites (Node.js, PostgreSQL)
# - Install dependencies jika belum
# - Buat file .env jika belum ada
# - Check & free ports jika sedang dipakai
# - Start backend + frontend

# 2. Cek status services
.\status-dev.ps1

# 3. Stop services
.\stop-dev.ps1
# Atau tekan Ctrl+C di terminal
```

---

## 📋 Prerequisites

Sebelum mulai, pastikan sudah install:

1. **Node.js 18+** → [Download](https://nodejs.org/)
   ```powershell
   node --version  # Check version
   ```

2. **PostgreSQL 14+** → [Download](https://www.postgresql.org/download/windows/)
   ```powershell
   psql --version  # Check version
   ```

3. **Git** (untuk clone repository)

---

## 🔧 Setup Detail (Step by Step)

### **1. Clone Repository & Install Dependencies**

```powershell
# Clone project
git clone https://github.com/ignafransdstn/documan-app.git
cd documan-app

# Install dependencies
npm install              # Root dependencies (concurrently)
npm run install:all      # Backend + Frontend dependencies
```

### **2. Setup Database**

#### **Buat Database via psql:**
```powershell
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE doc_management_dev;

# Keluar
\q
```

#### **Atau via pgAdmin (GUI):**
1. Buka pgAdmin 4
2. Right-click Databases → Create → Database
3. Name: `doc_management_dev`
4. Save

### **3. Konfigurasi Environment**

#### **Otomatis (Script akan buat):**
```powershell
.\start-dev.ps1
# Script akan buat backend/.env jika belum ada
```

#### **Manual:**
```powershell
# Buat file .env di folder backend
cd backend
New-Item -Path .env -ItemType File

# Edit dengan notepad atau VS Code
notepad .env

# Isi dengan:
PORT=5001
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=doc_management_dev
JWT_SECRET=ganti-dengan-secret-key-anda
JWT_EXPIRES_IN=7d
```

**⚠️ IMPORTANT:** Edit `DB_PASSWORD` sesuai password PostgreSQL Anda!

### **4. Jalankan Database Migrations**

```powershell
cd backend
npx sequelize-cli db:migrate
cd ..
```

Output yang diharapkan:
```
Loaded configuration file "config/database.js".
Using environment "development".
== 20251110-create-tables: migrating =======
== 20251110-create-tables: migrated (0.234s)
```

---

## ▶️ Menjalankan Services

### **Metode 1: PowerShell Script (RECOMMENDED) ⭐**

```powershell
# Start services
.\start-dev.ps1

# Output:
# ========================================
# Services Starting!
# ========================================
# Backend API:    http://localhost:5001
# API Docs:       http://localhost:5001/api-docs
# Frontend UI:    http://localhost:5173
#
# Press Ctrl+C to stop services
```

### **Metode 2: NPM Script**

```powershell
# Start backend + frontend sekaligus
npm run dev
```

### **Metode 3: Manual (2 Terminal)**

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
# Backend: http://localhost:5001
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
# Frontend: http://localhost:5173
```

---

## 🌐 Access Points

Setelah services running, buka di browser:

| Service | URL | Deskripsi |
|---------|-----|-----------|
| **Frontend** | http://localhost:5173 | Aplikasi web UI |
| **Backend API** | http://localhost:5001/api | REST API endpoints |
| **API Docs** | http://localhost:5001/api-docs | Swagger documentation |
| **Health Check** | http://localhost:5001/health | Backend status |

---

## ✅ Verifikasi Services

### **Cek Status via Script:**
```powershell
.\status-dev.ps1
```

Output:
```
========================================
DocuMan - Service Status Check
========================================

✓ Backend API
  Port:    5001
  PID:     12345
  Process: node
  URL:     http://localhost:5001

✓ Frontend UI
  Port:    5173
  PID:     67890
  Process: node
  URL:     http://localhost:5173
```

### **Cek Status Manual:**
```powershell
# Cek ports yang listening
netstat -ano | findstr "5001 5173"

# Test backend API
curl http://localhost:5001/health
# Response: {"status":"healthy","timestamp":"..."}

# Buka frontend di browser
start http://localhost:5173
```

---

## 🛑 Stop Services

### **Via Script:**
```powershell
.\stop-dev.ps1
```

### **Via Keyboard:**
```powershell
# Di terminal yang running services:
Ctrl + C
```

### **Force Kill:**
```powershell
# Kill by port
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process -Force
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
```

---

## 🔍 Troubleshooting

### **1. Port Already in Use**

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solusi:**
```powershell
# Cek siapa yang pakai port
netstat -ano | findstr 5001

# Kill process by PID
taskkill /PID <PID> /F

# Atau gunakan script
.\stop-dev.ps1
```

### **2. Database Connection Failed**

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solusi:**
1. **Cek PostgreSQL service running:**
   ```powershell
   # Buka Services (services.msc)
   # Cari "postgresql-x64-14" atau sejenisnya
   # Pastikan Status: Running
   
   # Atau via PowerShell:
   Get-Service -Name "*postgresql*"
   ```

2. **Start PostgreSQL jika stopped:**
   ```powershell
   # Via Services atau:
   net start postgresql-x64-14
   ```

3. **Cek credentials di .env:**
   ```powershell
   notepad backend\.env
   # Pastikan DB_USERNAME, DB_PASSWORD, DB_NAME benar
   ```

4. **Test connection:**
   ```powershell
   psql -U postgres -d doc_management_dev
   ```

### **3. Module Not Found**

**Error:**
```
Error: Cannot find module 'express'
```

**Solusi:**
```powershell
# Reinstall dependencies
npm run install:all

# Atau manual:
cd backend
npm install
cd ..\frontend
npm install
cd ..
```

### **4. Migration Failed**

**Error:**
```
ERROR: database "doc_management_dev" does not exist
```

**Solusi:**
```powershell
# Buat database
psql -U postgres -c "CREATE DATABASE doc_management_dev;"

# Jalankan migrations lagi
cd backend
npx sequelize-cli db:migrate
```

### **5. JWT Secret Error**

**Error:**
```
Error: secretOrPrivateKey must have a value
```

**Solusi:**
```powershell
# Pastikan JWT_SECRET ada di backend/.env
echo JWT_SECRET=my-super-secret-key-2024 >> backend\.env
```

---

## 🎯 First Time Login

### **Option 1: Create Admin User via Script**

```powershell
cd backend
npm run create-admin
# Follow prompts
```

### **Option 2: Manual via SQL**

```powershell
psql -U postgres -d doc_management_dev

# Jalankan SQL:
INSERT INTO "Users" (username, email, password, "userLevel", "isActive", "isApproved", "createdAt", "updatedAt")
VALUES (
  'admin',
  'admin@documan.com',
  '$2a$10$YourHashedPasswordHere',  -- Hash 'admin123'
  'admin',
  true,
  true,
  NOW(),
  NOW()
);
```

### **Option 3: Register via API**

```powershell
# POST request ke /api/auth/register
curl -X POST http://localhost:5001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"email\":\"admin@example.com\",\"password\":\"admin123\",\"userLevel\":\"admin\"}'
```

---

## 📝 Development Workflow

```powershell
# 1. Start dev environment
.\start-dev.ps1

# 2. Develop di VS Code (Hot reload aktif)
# - Backend: nodemon auto-restart
# - Frontend: Vite HMR (Hot Module Replacement)

# 3. Test changes di browser
start http://localhost:5173

# 4. Cek logs
# Backend logs: terminal output
# Frontend logs: Browser DevTools Console

# 5. Stop ketika selesai
.\stop-dev.ps1
# Atau Ctrl+C
```

---

## 🧪 Testing

```powershell
# Backend tests
cd backend
npm test                 # All tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage

# E2E tests
npm run test:e2e
```

---

## 📦 Scripts Reference

### **Root Package.json:**
```json
{
  "scripts": {
    "install:all": "Install backend + frontend dependencies",
    "dev": "Start backend + frontend dengan concurrently",
    "start:backend": "Production start backend",
    "start:frontend": "Production preview frontend"
  }
}
```

### **Backend Package.json:**
```json
{
  "scripts": {
    "start": "Production mode (node)",
    "dev": "Development mode (nodemon)",
    "test": "Run Jest tests",
    "test:e2e": "E2E tests"
  }
}
```

### **Frontend Package.json:**
```json
{
  "scripts": {
    "dev": "Vite dev server",
    "build": "TypeScript + Vite build",
    "preview": "Preview production build"
  }
}
```

---

## 🔐 Environment Variables

### **Backend .env:**
```bash
# Server
PORT=5001
NODE_ENV=development

# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=doc_management_dev

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Optional
CLOUDFLARE_TUNNEL_TOKEN=your_token
```

---

## 🚀 Production Deployment

Lihat dokumentasi lengkap:
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)
- [DEPLOYMENT-UPCLOUD.md](DEPLOYMENT-UPCLOUD.md)

---

## 📚 Additional Resources

- **API Documentation:** http://localhost:5001/api-docs (saat running)
- **Project README:** [README.md](README.md)
- **Quick Reference:** [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
- **Features Guide:** [DOKUMENTASI-LENGKAP.md](DOKUMENTASI-LENGKAP.md)

---

## 🆘 Need Help?

1. Check [DOKUMENTASI-LENGKAP.md](DOKUMENTASI-LENGKAP.md)
2. Review logs:
   - Backend: Terminal output
   - Frontend: Browser DevTools
3. Check issues di GitHub repository
4. Run diagnostics:
   ```powershell
   .\status-dev.ps1
   ```

---

**Happy Coding! 🎉**
