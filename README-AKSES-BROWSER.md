# 🚀 Document Management System - Akses Browser

## ✅ STATUS: BACKEND BERHASIL DIJALANKAN!

Backend API Document Management System sudah **RUNNING** dan siap diakses dari browser eksternal.

---

## 🌐 CARA MENGAKSES DARI BROWSER

### 1. **Swagger API Documentation (RECOMMENDED)**
```
http://10.184.0.2:5000/api-docs/
```
**atau jika dari komputer yang sama:**
```
http://localhost:5000/api-docs/
```

### 2. **File Akses Browser**
Buka file: **`AKSES-API-BROWSER.html`** di browser Anda untuk interface yang user-friendly.

---

## 📋 INFORMASI SERVER

| Parameter | Value |
|-----------|-------|
| **Status** | ✅ RUNNING |
| **IP Address** | 10.184.0.2 |
| **Port** | 5000 |
| **Database** | ✅ CONNECTED (PostgreSQL) |
| **CORS** | ✅ ENABLED |
| **Authentication** | ✅ JWT Working |

---

## 🧪 API ENDPOINTS YANG BISA DITEST

### Authentication
- **Register**: `POST http://10.184.0.2:5000/api/auth/register`
- **Login**: `POST http://10.184.0.2:5000/api/auth/login`
- **Profile**: `GET http://10.184.0.2:5000/api/auth/profile`

### Documents
- **List Documents**: `GET http://10.184.0.2:5000/api/documents`
- **Upload Document**: `POST http://10.184.0.2:5000/api/documents`
- **Download Document**: `GET http://10.184.0.2:5000/api/documents/download/:id`

### Users (Admin Only)
- **List Users**: `GET http://10.184.0.2:5000/api/users`
- **User Sessions**: `GET http://10.184.0.2:5000/api/users/sessions`

---

## 🎯 LANGKAH-LANGKAH TESTING

### 1. Buka Swagger UI
```
http://10.184.0.2:5000/api-docs/
```

### 2. Register User Baru
- Klik endpoint `POST /auth/register`
- Klik "Try it out"
- Masukkan data:
```json
{
  "username": "testuser",
  "email": "test@example.com", 
  "password": "password123"
}
```
- Klik "Execute"

### 3. Login & Dapatkan Token
- Klik endpoint `POST /auth/login`
- Masukkan username dan password yang sama
- Copy token dari response

### 4. Authorize
- Klik tombol "Authorize" di atas
- Masukkan: `Bearer YOUR_TOKEN_HERE`
- Klik "Authorize"

### 5. Test Endpoints Lain
Sekarang Anda bisa test semua endpoint yang memerlukan authentication.

---

## ⚠️ PENTING!

1. **Jangan tutup terminal** yang menjalankan `npm run dev`
2. **Server harus tetap berjalan** agar API bisa diakses
3. **Gunakan token JWT** untuk endpoint yang memerlukan authentication
4. **Default user level**: `level3` (read-only access)

---

## 🔗 QUICK ACCESS LINKS

- **Swagger UI**: http://10.184.0.2:5000/api-docs/
- **Register API**: http://10.184.0.2:5000/api/auth/register
- **Login API**: http://10.184.0.2:5000/api/auth/login
- **Documents API**: http://10.184.0.2:5000/api/documents

---

## 📱 CONTOH CURL COMMANDS

### Register User:
```bash
curl -X POST http://10.184.0.2:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'
```

### Login:
```bash
curl -X POST http://10.184.0.2:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Get Documents (dengan token):
```bash
curl -X GET http://10.184.0.2:5000/api/documents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ✅ SISTEM SIAP DIGUNAKAN!

Backend Document Management System sudah **100% functional** dan siap diakses dari browser eksternal. Gunakan Swagger UI untuk testing dan dokumentasi lengkap.

**Happy Testing! 🎉**