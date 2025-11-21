# Panduan Akses API dari Browser

## Mengakses API dari Local Machine ke VM

### Metode 1: IAP Tunnel (Recommended)

1. **Prasyarat**:
   - Google Cloud SDK (gcloud) terinstall di laptop
   - Akses ke project GCP
   - Node.js dan npm terinstall di VM

2. **Setup IAP Tunnel**:
   ```bash
   # Login ke Google Cloud (jika belum)
   gcloud auth login

   # Set project
   gcloud config set project jh-01-476506

   # Buat IAP tunnel
   gcloud compute ssh --project=jh-01-476506 --zone=asia-southeast2-a backend-vm-1 -- -L 5000:localhost:5000
   ```

3. **Menjalankan Server**:
   Setelah terhubung ke VM melalui SSH:
   ```bash
   # Masuk ke direktori project
   cd /home/macbook_pro/document-management-system/backend

   # Install dependencies (jika belum)
   npm install

   # Jalankan server
   npm start
   ```

4. **Mengakses API**:
   - Swagger UI: http://localhost:5000/api-docs
   - API Endpoint: http://localhost:5000/api

### Metode 2: Direct Access via External IP (Alternative)

1. **Akses via IP**:
   - Swagger UI: http://34.101.60.96:5000/api-docs
   - API Endpoint: http://34.101.60.96:5000/api

2. **Catatan Keamanan**:
   - Metode ini kurang aman karena membuka port ke internet
   - Gunakan hanya untuk development
   - Pastikan firewall rules tepat

## Menggunakan Swagger UI

1. **Autentikasi**:
   - Buka Swagger UI
   - Gunakan endpoint `/api/auth/login`
   - Masukkan credentials admin default:
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```
   - Atau gunakan akun Anda sendiri jika sudah dibuat
   - Copy token dari response

   **Default Admin Account**:
   - Username: `admin`
   - Password: `admin123`
   - Email: `admin@example.com`
   - Level: `admin` (full access)

2. **Authorize**:
   - Klik tombol "Authorize" di bagian atas
   - Masukkan token dengan format: `Bearer <your_token>`
   - Klik "Authorize"

3. **Testing Endpoints**:
   - Pilih endpoint yang ingin ditest
   - Klik "Try it out"
   - Isi parameter yang diperlukan
   - Klik "Execute"

## Troubleshooting

1. **Tidak bisa akses localhost:5000**:
   - Pastikan server berjalan (`npm start`)
   - Cek port dengan `netstat -tulpn | grep 5000`
   - Pastikan tidak ada aplikasi lain menggunakan port 5000

2. **IAP Tunnel Error**:
   ```
   channel 2: open failed: connect failed: Connection refused
   ```
   Solusi:
   - Pastikan server Node.js berjalan
   - Cek firewall settings
   - Restart IAP tunnel

3. **Authentication Error**:
   - Pastikan format token benar: `Bearer <token>`
   - Cek expiry time token
   - Login ulang jika token expired

4. **File Upload Error**:
   - Cek ukuran file (max 10MB)
   - Pastikan tipe file diizinkan
   - Periksa permission folder uploads

## Monitoring

1. **Log Server**:
   ```bash
   # Di VM
   tail -f /home/macbook_pro/document-management-system/backend/logs/app.log
   ```

2. **Status Server**:
   ```bash
   # Di VM
   pm2 status # jika menggunakan PM2
   # atau
   ps aux | grep node
   ```

## Keamanan

1. **Best Practices**:
   - Selalu gunakan HTTPS di production
   - Jangan share token
   - Logout setelah selesai
   - Ganti password secara berkala

2. **Rate Limiting**:
   - 100 request per IP per 15 menit
   - Reset otomatis setelah periode cooldown

## Support

Jika mengalami masalah, hubungi:
- Email: support@example.com
- Issue Tracker: [GitHub Issues](https://github.com/your-repo/issues)