# DocuMan - Ringkasan Singkat

## 📋 Apa Itu DocuMan?

**DocuMan** adalah aplikasi **Sistem Manajemen Dokumen** berbasis web yang membantu organisasi mengelola, menyimpan, dan melacak dokumen dengan aman.

---

## 🎯 Tujuan Utama

1. **Manajemen Dokumen Terpusat** - Simpan semua dokumen di satu tempat
2. **Keamanan Tinggi** - Proteksi dokumen dari akses & copypaste ilegal
3. **Tracking Lengkap** - Catat siapa akses dokumen kapan & dari mana
4. **Kontrol Akses** - Atur siapa bisa lihat dokumen berdasarkan role
5. **Organisasi Hierarki** - Kelompokkan dokumen dalam struktur master & sub
6. **Lokasi Dokumen** - Tandai lokasi dokumen dengan GPS coordinates
7. **User-Friendly** - Interface modern dengan animasi smooth

---

## ✨ 10 Fitur Utama

| # | Fitur | Deskripsi |
|----|-------|-----------|
| 1️⃣ | **Login & Keamanan** | Akses sistem dengan email/password, 4 level role |
| 2️⃣ | **Kelola User** | Admin bisa tambah, edit, hapus user |
| 3️⃣ | **Upload Dokumen** | Upload file (PDF, Word, Excel, Gambar) |
| 4️⃣ | **Organisir Dokumen** | Buat sub-dokumen detail dari dokumen master |
| 5️⃣ | **Search & Filter** | Cari dokumen by judul |
| 6️⃣ | **GPS Tracking** | Catat lokasi dokumen dengan latitude/longitude |
| 7️⃣ | **Audit Trail** | Log semua aktivitas user untuk keamanan |
| 8️⃣ | **Anti-Screenshot** | Cegah user copypaste atau capture dokumen |
| 9️⃣ | **Map View** | Lihat dokumen di map berdasarkan GPS |
| 🔟 | **API Documentation** | Swagger docs untuk developer |

---

## 🔐 4 Level User (Role)

```
┌──────────────────────────────────────────────┐
│  ADMIN                                       │
│  └─ Manage semua user, dokumentasi lengkap   │
├──────────────────────────────────────────────┤
│  LEVEL 1                                     │
│  └─ Akses dokumen team, create/edit          │
├──────────────────────────────────────────────┤
│  LEVEL 2                                     │
│  └─ Akses dokumen terbatas, read mostly      │
├──────────────────────────────────────────────┤
│  LEVEL 3                                     │
│  └─ Read-only access, minimal permissions    │
└──────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack (Teknologi)

**Backend:** Node.js + Express (API)
**Frontend:** React + TypeScript (Web UI)
**Database:** PostgreSQL (Penyimpanan Data)
**Security:** JWT + bcryptjs (Autentikasi)

---

## 📂 Struktur Dokumen

```
Dokumen Master
├── Judul: Laporan Q1 2024
├── File: laporan_q1.pdf
├── GPS: -8.123, 115.456 (Lokasi)
│
└── Sub-Dokumen
    ├── Detail Penjualan
    ├── Analisis Pasar
    └── Rekomendasi
```

---

## 🚀 Cara Menggunakan

### 1. **Login**
   - Buka: http://localhost:5173
   - Email: admin@example.com
   - Password: admin123

### 2. **Kelola User** (Admin only)
   - Go to: Users → Add User
   - Set role & status

### 3. **Upload Dokumen**
   - Go to: Documents → Upload
   - Pilih file & set lokasi GPS (opsional)

### 4. **Tambah Sub-Dokumen**
   - Buka dokumen → Add Sub-Document
   - Upload file detail

### 5. **View Activity**
   - Go to: Activity Logs
   - Lihat siapa akses apa kapan

### 6. **Lihat di Map**
   - Go to: Map View
   - Klik dokumentasi untuk detail

---

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────┐
│       User Login (Email/Password)       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   Dashboard Home     │
        └──────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    Documents   Users      Activity
    ┌──────────────────────┐
    │ Manage Docs & Upload │
    │ View in Map          │
    │ Edit Metadata        │
    └──────────────────────┘
```

---

## 🔒 Keamanan

✅ **Dokumen Aman:**
- Password-protected login
- Role-based access (tidak semua orang bisa lihat semua dokumen)
- Anti-screenshot (cegah copypaste dengan watermark)
- Audit trail (track siapa akses apa)

✅ **Data Aman:**
- Database encryption ready
- SQL injection prevention
- XSS protection

---

## 📊 Aktivitas Tracking

Setiap aktivitas dicatat:
- **Siapa** yang akses (Username)
- **Apa** yang dilakukan (Create/Read/Update/Delete)
- **Kapan** melakukan (Timestamp)
- **Dari mana** (IP Address)
- **Pakai apa** (Browser/Device)

---

## 🎯 Use Case / Contoh Penggunaan

### Scenario 1: Legal Department
- Simpan semua contract & dokumen legal
- Level3 staff hanya bisa read (lihat saja)
- Level1 bisa edit & create dokumen baru
- Admin tracking semua akses untuk compliance

### Scenario 2: Sales Department
- Upload quotation & proposal dokumen
- GPS track lokasi client
- Sub-dokumen untuk detail spesifikasi
- Share via role control (hide sensitive pricing dari junior staff)

### Scenario 3: HR Department
- Kelola employee documents
- Anti-screenshot untuk protect data pribadi
- Audit trail untuk HR compliance
- Role-based (HR head full access, staff limited)

---

## 📈 Keuntungan Menggunakan DocuMan

| Keuntungan | Deskripsi |
|-----------|-----------|
| 🔐 **Secure** | Dokumen terproteksi dengan encryption & access control |
| 📍 **Traceable** | Setiap akses tercatat untuk audit & compliance |
| 📱 **Modern** | User-friendly interface dengan animations |
| 🌐 **Cloud-Ready** | Bisa diakses dari mana saja via web |
| 👥 **Team Collaboration** | Share dokumen dengan role-based permission |
| 📊 **Reporting** | Activity logs untuk reporting & analytics |
| ⚡ **Fast** | Optimized untuk performa maksimal |
| 🛠️ **Customizable** | Bisa dimodifikasi sesuai kebutuhan |

---

## 🔌 API Endpoints (Developer)

**Akses dokumentasi lengkap di:**
```
http://localhost:5001/api-docs
```

**Main Endpoints:**
- `/api/auth/*` - Login/Logout/Token
- `/api/users/*` - User management
- `/api/documents/*` - Document CRUD
- `/api/activity-logs/*` - Activity tracking

---

## 📞 Bantuan

- **Frontend tidak muncul?** Cek http://localhost:5173
- **Backend error?** Cek database PostgreSQL sudah running
- **Dokumen tidak upload?** Cek permission folder uploads/
- **Forgot password?** Contact admin

---

## ✅ Status Sistem

| Komponen | Status |
|----------|--------|
| Backend API | ✅ Running (Port 5001) |
| Frontend UI | ✅ Running (Port 5173) |
| PostgreSQL | ✅ Running |
| Documentation | ✅ Complete |
| Features | ✅ All working |
| Security | ✅ Implemented |

---

**Ready to use! 🚀**

