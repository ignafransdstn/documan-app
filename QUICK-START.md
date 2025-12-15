# 🚀 Quick Start Guide - DocuMan

Panduan cepat untuk memulai aplikasi DocuMan dalam 5 menit!

---

## ⚡ Setup Cepat (5 menit)

### 1️⃣ **Prerequisites**
Pastikan sudah install:
- ✅ Node.js 20.19.5+ (`node --version`)
- ✅ PostgreSQL 14+ (`psql --version`)
- ✅ npm atau yarn (`npm --version`)

### 2️⃣ **Clone & Install**

```bash
# Clone repository
git clone <your-repo-url>
cd document-management-system

# Install dependencies (backend)
cd backend
npm install
cd ..

# Install dependencies (frontend)
cd frontend
npm install
cd ..
```

### 3️⃣ **Setup Database**

```bash
# Buat database PostgreSQL
createdb doc_management_dev

# Atau gunakan psql
psql -U postgres -c "CREATE DATABASE doc_management_dev;"
```

### 4️⃣ **Configure Environment**

**Backend** (`.env`):
```bash
cd backend
cat > .env << 'EOF'
PORT=5001
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=doc_management_dev
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d
EOF
```

**Frontend** sudah auto-configured untuk `http://localhost:5001`

### 5️⃣ **Start Services**

```bash
# Method 1: Gunakan script (RECOMMENDED)
./run-dev.sh

# Method 2: Manual (dari project root)
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 📍 Access Points

Setelah services running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Login & App UI |
| **Backend API** | http://localhost:5001/api | REST API |
| **Swagger Docs** | http://localhost:5001/api-docs | API Documentation |

---

## 👤 Default Login

**Pertama kali:**

```bash
# Create admin user (run from backend folder)
npm run create-admin

# Akan prompt untuk:
# - Email: admin@example.com
# - Password: (set password)
```

Atau gunakan script otomatis:
```bash
cd backend
node -e "require('./src/scripts/create-admin-user').run()"
```

**Credentials:**
- Email: `admin@example.com` (atau yang Anda set)
- Password: (sesuai yang Anda input)

---

## 🔍 Verify Setup

✅ Verify backend running:
```bash
curl http://localhost:5001/api-docs/
# Should return HTML swagger docs
```

✅ Verify frontend running:
```bash
curl http://localhost:5173/
# Should return React app HTML
```

✅ Verify database connected:
```bash
# Check backend logs for "Database synchronized"
tail -f dev-backend.log | grep "Database"
```

---

## 📁 Project Structure

```
document-management-system/
├── backend/
│   ├── src/
│   │   ├── models/        # Database models
│   │   ├── controllers/   # API controllers
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Auth, validation
│   │   └── app.js         # Express app
│   ├── tests/             # Test files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── utils/         # Helper functions
│   │   └── App.tsx        # Main App
│   └── package.json
├── docs/                  # Documentation
├── DOKUMENTASI-SINGKAT.md # Quick intro
├── DOKUMENTASI-LENGKAP.md # Full guide
└── run-dev.sh            # Start script
```

---

## 🛠️ Common Commands

### Backend

```bash
cd backend

# Start dev server with nodemon
npm run dev

# Run tests
npm run test

# Create admin user
npm run create-admin

# View database
psql -d doc_management_dev -U postgres
```

### Frontend

```bash
cd frontend

# Start dev server with Vite
npm run dev

# Build for production
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

### Both

```bash
# From project root
./run-dev.sh      # Start both services
./stop-dev.sh     # Stop both services
```

---

## 🐛 Troubleshooting

### Port sudah dipakai

```bash
# Kill processes on port 5001
lsof -ti :5001 | xargs kill -9

# Kill processes on port 5173
lsof -ti :5173 | xargs kill -9
```

### Database connection error

```bash
# Check PostgreSQL running
brew services list | grep postgres

# Start PostgreSQL
brew services start postgresql@14

# Check database exists
psql -U postgres -l | grep doc_management
```

### Node version error

```bash
# Set correct Node version
nvm use 20.19.5

# Or install if missing
nvm install 20.19.5
```

### .nvmrc files

```bash
# Already created in project
cat backend/.nvmrc     # Should show 20.19.5
cat frontend/.nvmrc    # Should show 20.19.5
```

---

## 📚 Learn More

- 📖 [Dokumentasi Singkat](./DOKUMENTASI-SINGKAT.md) - Overview
- 📘 [Dokumentasi Lengkap](./DOKUMENTASI-LENGKAP.md) - Complete guide
- 📑 [Dokumentasi Index](./DOKUMENTASI-INDEX.md) - Semua docs
- 📊 [Business Process](./docs/BUSINESS-PROCESS-DOCUMENTATION.md) - Alur bisnis
- 🎯 [Features Guide](./docs/FEATURES-DOCUMENTATION.md) - Detail fitur

---

## ✅ Checklist Setup

- [ ] Node.js 20.19.5 installed
- [ ] PostgreSQL running
- [ ] Repository cloned
- [ ] Dependencies installed (npm install di backend & frontend)
- [ ] Database created (doc_management_dev)
- [ ] .env configured
- [ ] Admin user created
- [ ] Services running (./run-dev.sh)
- [ ] Can access http://localhost:5173
- [ ] Can login with admin credentials

---

## 🎉 Siap!

Jika semua checklist ✅, Anda siap menggunakan DocuMan! 🚀

**Pertanyaan?** Baca dokumentasi lengkap atau cek API docs di http://localhost:5001/api-docs

---

**Last Updated:** December 11, 2025
**Version:** 1.0
