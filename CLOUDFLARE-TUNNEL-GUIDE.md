# Panduan Cloudflare Tunnel untuk Documan

Panduan ini menjelaskan cara menggunakan Cloudflare Tunnel untuk membuat aplikasi Documan dapat diakses dari internet secara gratis.

## 📋 Daftar Isi

- [Apa itu Cloudflare Tunnel?](#apa-itu-cloudflare-tunnel)
- [Persyaratan](#persyaratan)
- [Cara Setup](#cara-setup)
- [Cara Menggunakan](#cara-menggunakan)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## 🌐 Apa itu Cloudflare Tunnel?

Cloudflare Tunnel (sebelumnya Argo Tunnel) adalah layanan yang memungkinkan Anda expose aplikasi lokal ke internet tanpa:
- ✅ Membuka port di router
- ✅ Butuh IP publik static
- ✅ Konfigurasi firewall yang rumit
- ✅ VM berbayar

**Keuntungan:**
- 🆓 Gratis untuk personal use
- 🔒 Secure by default (traffic melalui Cloudflare)
- ⚡ CDN global otomatis
- 🛡️ DDoS protection
- 📊 Analytics gratis

**Kekurangan:**
- URL akan berubah jika tunnel di-recreate (kecuali pakai custom domain)
- Perlu tunnel tetap running
- Tergantung pada Cloudflare service availability

## 📦 Persyaratan

1. **macOS** (untuk script ini)
2. **Homebrew** - Package manager untuk macOS
   ```bash
   # Install Homebrew jika belum ada
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. **Docker & Docker Compose** - Sudah terinstall
4. **Akun Cloudflare** - Gratis, daftar di [cloudflare.com](https://dash.cloudflare.com/sign-up)

## 🚀 Cara Setup

### Langkah 1: Setup Tunnel

Jalankan script setup:

```bash
chmod +x setup-cloudflare-tunnel.sh
./setup-cloudflare-tunnel.sh
```

Script ini akan:
1. ✅ Install `cloudflared` via Homebrew
2. ✅ Membuka browser untuk login ke Cloudflare
3. ✅ Membuat tunnel baru
4. ✅ Konfigurasi routing
5. ✅ Generate URL public untuk aplikasi Anda

**Yang perlu Anda lakukan:**
- Login ke akun Cloudflare di browser
- Pilih domain (atau gunakan subdomain gratis `.trycloudflare.com`)
- Masukkan nama subdomain yang diinginkan (contoh: `documan-demo`)

### Langkah 2: Verifikasi Setup

Setelah setup berhasil, Anda akan melihat:
```
✓ Setup Complete!

Tunnel ID: xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Tunnel Name: documan-tunnel-xxxxxxxxxx
Your app will be available at: https://documan-demo.trycloudflare.com
```

Informasi ini juga disimpan di file `.cloudflare-tunnel-info`

## 🎯 Cara Menggunakan

### Menjalankan Aplikasi + Tunnel

**Opsi 1: Manual (Step by Step)**

1. Start Docker containers:
   ```bash
   docker-compose up -d
   ```

2. Tunggu sampai services ready (~30 detik)

3. Start Cloudflare tunnel:
   ```bash
   chmod +x start-cloudflare-tunnel.sh
   ./start-cloudflare-tunnel.sh
   ```

**Opsi 2: Otomatis**

Script `start-cloudflare-tunnel.sh` akan otomatis menanyakan apakah ingin start Docker containers jika belum running.

### Mengakses Aplikasi

Setelah tunnel running, akses aplikasi di:
```
https://your-subdomain.trycloudflare.com
```

Contoh: `https://documan-demo.trycloudflare.com`

### Menghentikan Tunnel

Untuk stop tunnel:
1. Tekan `Ctrl+C` di terminal yang menjalankan tunnel
2. Docker containers akan tetap running (bagus untuk development)

Untuk stop semua:
```bash
# Stop tunnel (Ctrl+C di terminal tunnel)
# Stop Docker
docker-compose down
```

## 🔧 Troubleshooting

### Problem: "cloudflared: command not found"

**Solusi:**
```bash
# Install cloudflared
brew install cloudflared

# Verify installation
cloudflared --version
```

### Problem: "tunnel configuration not found"

**Solusi:**
```bash
# Run setup lagi
./setup-cloudflare-tunnel.sh
```

### Problem: "502 Bad Gateway" saat akses URL

**Kemungkinan penyebab:**

1. **Docker containers belum ready**
   ```bash
   # Check status containers
   docker-compose ps
   
   # Check logs
   docker-compose logs
   ```

2. **Nginx belum running**
   ```bash
   # Restart nginx
   docker-compose restart nginx
   ```

3. **Port 80 sudah digunakan**
   ```bash
   # Check apa yang menggunakan port 80
   sudo lsof -i :80
   
   # Stop service yang conflict atau ubah port di docker-compose.yml
   ```

### Problem: "Authentication failed"

**Solusi:**
```bash
# Login ulang
cloudflared tunnel login

# Verify login
cloudflared tunnel list
```

### Problem: Connection timeout

**Solusi:**
1. Pastikan tunnel masih running
2. Check internet connection
3. Verify tunnel status:
   ```bash
   cloudflared tunnel info <tunnel-name>
   ```

## 📚 FAQ

### Apakah bisa menggunakan custom domain?

Ya! Jika Anda punya domain sendiri yang sudah di Cloudflare:

1. Update DNS record:
   ```bash
   cloudflared tunnel route dns <tunnel-name> app.yourdomain.com
   ```

2. Update `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: /path/to/credentials.json
   
   ingress:
     - hostname: app.yourdomain.com
       service: http://localhost:80
     - service: http_status:404
   ```

### Apakah tunnel harus selalu running?

Ya, tunnel harus running agar aplikasi bisa diakses dari internet. Jika Anda stop tunnel, URL tidak bisa diakses.

### Apakah aman?

Ya! Beberapa keamanan yang diberikan:
- ✅ Traffic encrypted via Cloudflare
- ✅ Tidak perlu expose port di router
- ✅ DDoS protection dari Cloudflare
- ✅ Dapat menambahkan Cloudflare Access untuk authentication

### Berapa limit gratis Cloudflare Tunnel?

Untuk personal use, tidak ada limit bandwidth atau traffic. Namun:
- Maximum 1000 concurrent connections
- Fair use policy applies

### Bagaimana cara update konfigurasi tunnel?

Edit file `~/.cloudflared/config.yml`:
```bash
nano ~/.cloudflared/config.yml
```

Lalu restart tunnel.

### Bagaimana cara delete tunnel?

```bash
# List tunnels
cloudflared tunnel list

# Delete tunnel
cloudflared tunnel delete <tunnel-name>

# Cleanup config
rm ~/.cloudflared/config.yml
rm .cloudflare-tunnel-info
```

### Apakah bisa multiple tunnels?

Ya! Anda bisa create multiple tunnels untuk different projects:
```bash
cloudflared tunnel create my-other-project
```

### Bagaimana cara monitoring tunnel?

**Real-time logs:**
```bash
# Tunnel logs tampil di terminal saat running
# atau gunakan
cloudflared tunnel info <tunnel-name>
```

**Cloudflare Dashboard:**
- Login ke [dash.cloudflare.com](https://dash.cloudflare.com)
- Pilih domain
- Pergi ke "Zero Trust" > "Networks" > "Tunnels"
- Lihat analytics dan metrics

### Apakah perlu restart tunnel setiap kali restart laptop?

Ya, tunnel tidak auto-start. Anda perlu jalankan:
```bash
./start-cloudflare-tunnel.sh
```

**Untuk auto-start (optional):**
```bash
# Install as service
cloudflared service install
```

## 🎓 Tips & Best Practices

### Development vs Production

**Development (pakai tunnel):**
```bash
# Quick demo/testing
./start-cloudflare-tunnel.sh
```

**Production:**
Untuk production app, pertimbangkan:
- Deploy ke platform seperti Railway/Render/Fly.io
- Atau setup VM dengan proper domain
- Tunnel lebih cocok untuk demo/testing

### Keamanan Tambahan

Tambahkan Cloudflare Access untuk authentication:
```bash
# Di Cloudflare Dashboard > Zero Trust > Access
# Create application untuk restrict access
```

### Performance

Cloudflare Tunnel sudah include:
- ✅ Global CDN
- ✅ Caching
- ✅ Compression
- ✅ HTTP/2

Tapi untuk best performance:
- Enable caching di nginx config
- Optimize static assets
- Use Cloudflare page rules

### Backup Configuration

Backup file penting:
```bash
# Backup tunnel credentials & config
cp ~/.cloudflared/config.yml ./cloudflare-config-backup.yml
cp ~/.cloudflared/*.json ./cloudflare-credentials-backup.json
cp .cloudflare-tunnel-info .cloudflare-tunnel-info.backup
```

## 📞 Support

Jika ada masalah:

1. **Check Cloudflare Status**: https://www.cloudflarestatus.com/
2. **Cloudflare Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
3. **Community**: https://community.cloudflare.com/

## 🔄 Alternatif Cloudflare Tunnel

Jika Cloudflare Tunnel tidak cocok:

| Service | Gratis? | Kelebihan | Kekurangan |
|---------|---------|-----------|------------|
| **Ngrok** | Ya (limited) | Mudah setup | URL berubah, limit bandwidth |
| **Tailscale** | Ya | Secure, persistent | Perlu install di client |
| **LocalTunnel** | Ya | Simple | Tidak reliable |
| **Serveo** | Ya | SSH-based | Sering down |

## 📝 Changelog

- **2025-11-26**: Initial documentation
- Setup script untuk macOS
- Start script dengan auto-check Docker
- Dokumentasi lengkap

---

**Happy tunneling! 🚀**

Jika ada pertanyaan, silakan buka issue di repository ini.
