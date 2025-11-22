# 🚀 Deployment Roadmap - DocuMan Prototype

## 📊 Overview

Deployment prototype DocuMan menggunakan **UpCloud VM + Freenom Domain + Cloudflare CDN** untuk akses publik dengan biaya minimal.

---

## 🎯 Architecture Prototype

```
Internet Users
      ↓
┌─────────────────────────────────────────┐
│         Cloudflare CDN                  │
│  - DDoS Protection                      │
│  - SSL/TLS Certificate                  │
│  - DNS Management                       │
│  - Caching & Speed                      │
└────────────┬────────────────────────────┘
             ↓
    Domain: documan.tk (Freenom)
             ↓
┌─────────────────────────────────────────┐
│      UpCloud Virtual Machine            │
│      IP: [Your Public IP]               │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Nginx (Port 80/443)           │    │
│  │  - Reverse Proxy               │    │
│  │  - SSL Termination             │    │
│  └──────────┬─────────────────────┘    │
│             │                           │
│      ┌──────┴──────┐                   │
│      ↓             ↓                    │
│  ┌────────┐   ┌──────────┐            │
│  │ Docker │   │  Docker  │            │
│  │Frontend│   │ Backend  │            │
│  │ :3000  │   │  :5001   │            │
│  └────────┘   └────┬─────┘            │
│                    ↓                    │
│              ┌──────────┐              │
│              │ Docker   │              │
│              │PostgreSQL│              │
│              │  :5432   │              │
│              └──────────┘              │
└─────────────────────────────────────────┘
```

---

## 📅 Timeline Deployment (3-4 Jam)

### **Phase 1: Setup Domain Gratis (30 menit)**
- [ ] Daftar akun Freenom
- [ ] Pilih domain `.tk`, `.ml`, atau `.ga`
- [ ] Register domain (contoh: `documan.tk`)
- [ ] Verifikasi email

### **Phase 2: Setup Cloudflare (20 menit)**
- [ ] Daftar akun Cloudflare (gratis)
- [ ] Add site (domain dari Freenom)
- [ ] Update nameservers di Freenom
- [ ] Tunggu propagasi DNS (5-10 menit)
- [ ] Enable SSL/TLS (Full)
- [ ] Enable caching dan optimization

### **Phase 3: Setup UpCloud VM (30 menit)**
- [ ] Create VM di UpCloud
- [ ] Specs: 2 vCPU, 4 GB RAM, 50 GB SSD
- [ ] OS: Ubuntu 22.04 LTS
- [ ] Note Public IP address
- [ ] Setup SSH access
- [ ] Update system packages

### **Phase 4: Install Dependencies (30 menit)**
- [ ] Install Docker & Docker Compose
- [ ] Install Nginx
- [ ] Setup UFW Firewall
- [ ] Install Certbot untuk SSL

### **Phase 5: Upload & Configure (30 menit)**
- [ ] Upload project dari GitHub
- [ ] Configure `.env.production`
- [ ] Generate JWT secret
- [ ] Set database credentials
- [ ] Update CORS origins

### **Phase 6: Deploy Application (30 menit)**
- [ ] Build Docker images
- [ ] Start containers (docker-compose up)
- [ ] Initialize database
- [ ] Create admin user
- [ ] Verify all services running

### **Phase 7: Configure Nginx + SSL (30 menit)**
- [ ] Create Nginx reverse proxy config
- [ ] Obtain SSL certificate from Let's Encrypt
- [ ] Configure HTTPS redirect
- [ ] Test Nginx configuration
- [ ] Reload Nginx

### **Phase 8: DNS Configuration (20 menit)**
- [ ] Add A record di Cloudflare → UpCloud IP
- [ ] Add CNAME for www
- [ ] Enable proxy (orange cloud)
- [ ] Test DNS propagation
- [ ] Verify SSL active

### **Phase 9: Testing & Verification (30 menit)**
- [ ] Test akses dari browser
- [ ] Test login admin
- [ ] Test upload dokumen
- [ ] Test download dokumen
- [ ] Test user management
- [ ] Test dari berbagai network
- [ ] Performance test

### **Phase 10: Security Hardening (20 menit)**
- [ ] Change default admin password
- [ ] Setup backup automation
- [ ] Configure monitoring
- [ ] Enable Cloudflare security features
- [ ] Review firewall rules

---

## 💰 Estimasi Biaya

| Item | Provider | Biaya/Bulan | Biaya/Tahun |
|------|----------|-------------|-------------|
| **Domain** | Freenom (.tk/.ml/.ga) | **GRATIS** | **GRATIS** |
| **CDN/Security** | Cloudflare Free | **GRATIS** | **GRATIS** |
| **SSL Certificate** | Let's Encrypt | **GRATIS** | **GRATIS** |
| **VM Server** | UpCloud (2vCPU/4GB) | ~Rp 80.000 | ~Rp 960.000 |
| **Bandwidth** | UpCloud (included) | **GRATIS** | **GRATIS** |
| **Backup Storage** | UpCloud (optional) | ~Rp 20.000 | ~Rp 240.000 |
| **TOTAL** | | **~Rp 80.000** | **~Rp 960.000** |

**Catatan:** 
- Domain gratis dari Freenom bisa diperpanjang setiap tahun (tetap gratis)
- Cloudflare Free tier sudah sangat cukup untuk prototype
- Bisa upgrade server jika traffic meningkat

---

## 🛠️ Detailed Steps

### **STEP 1: Register Domain Gratis (Freenom)**

1. **Akses Freenom:**
   ```
   URL: https://www.freenom.com
   ```

2. **Cari Domain:**
   - Ketik: `documan` di search box
   - Pilih TLD gratis: `.tk`, `.ml`, `.ga`, `.cf`, `.gq`
   - Rekomendasi: `.tk` (paling stabil)

3. **Register:**
   ```
   Domain: documan.tk
   Period: 12 Months @ FREE
   
   Email: [your email]
   Password: [strong password]
   ```

4. **Verifikasi:**
   - Check email untuk verification link
   - Klik link untuk activate

5. **Catat Informasi:**
   ```
   Domain: documan.tk
   Freenom Account: [email]
   Login: https://my.freenom.com
   ```

---

### **STEP 2: Setup Cloudflare**

1. **Daftar Cloudflare:**
   ```
   URL: https://cloudflare.com/sign-up
   Email: [your email]
   Password: [strong password]
   ```

2. **Add Site:**
   ```
   1. Click "Add a Site"
   2. Enter: documan.tk
   3. Select Plan: FREE (Rp 0)
   4. Continue
   ```

3. **Cloudflare akan scan DNS records:**
   ```
   Wait for scan complete...
   Click "Continue"
   ```

4. **Cloudflare akan memberikan nameservers:**
   ```
   Example:
   chloe.ns.cloudflare.com
   darwin.ns.cloudflare.com
   
   CATAT KEDUA NAMESERVERS INI!
   ```

5. **Update Nameservers di Freenom:**
   ```
   1. Login ke my.freenom.com
   2. Services → My Domains
   3. Manage Domain → Management Tools
   4. Nameservers → Use custom nameservers
   5. Nameserver 1: chloe.ns.cloudflare.com
   6. Nameserver 2: darwin.ns.cloudflare.com
   7. Change Nameservers
   ```

6. **Tunggu Propagasi (10-30 menit):**
   ```
   Cloudflare akan detect otomatis
   Status akan berubah: "Active"
   ```

7. **Configure SSL di Cloudflare:**
   ```
   1. SSL/TLS → Overview
   2. Select: "Full (strict)" atau "Full"
   3. Enable "Always Use HTTPS"
   4. Enable "Automatic HTTPS Rewrites"
   ```

8. **Enable Performance Features:**
   ```
   1. Speed → Optimization
   2. Enable "Auto Minify" (JS, CSS, HTML)
   3. Enable "Brotli"
   4. Enable "Rocket Loader" (optional)
   ```

---

### **STEP 3: Setup UpCloud VM**

1. **Login ke UpCloud:**
   ```
   URL: https://hub.upcloud.com
   ```

2. **Create Server:**
   ```
   Click "Deploy a Server"
   
   Location: Singapore (terdekat dengan Indonesia)
   
   Operating System:
   - Ubuntu 22.04 LTS
   
   Server Plan:
   - CPU: 2 vCPU
   - RAM: 4 GB
   - Storage: 50 GB SSD
   - Bandwidth: Unlimited
   
   Hostname: documan-production
   
   Authentication:
   - SSH Keys (recommended) atau
   - Password
   
   Network: Public IPv4 + IPv6
   
   Backup: Yes (optional, +Rp 20k/month)
   ```

3. **Deploy & Note Public IP:**
   ```
   Wait for deployment (2-3 minutes)
   
   Public IP: [will be shown]
   Example: 94.237.XXX.XXX
   
   CATAT IP INI!
   ```

4. **First SSH Access:**
   ```bash
   ssh root@94.237.XXX.XXX
   
   # Update system
   apt update && apt upgrade -y
   
   # Set timezone
   timedatectl set-timezone Asia/Jakarta
   
   # Create user (optional but recommended)
   adduser documan
   usermod -aG sudo documan
   ```

---

### **STEP 4: Install Dependencies (Automated)**

Gunakan script `install.sh` yang sudah dibuat:

```bash
# Clone repository
cd /opt
git clone https://github.com/ignafransdstn/documan-app.git
cd documan-app

# Make install script executable
chmod +x install.sh

# Run installation
./install.sh
```

Script akan install:
- ✅ Docker
- ✅ Docker Compose
- ✅ Nginx
- ✅ UFW Firewall
- ✅ Certbot (SSL)

**Atau Manual:**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx
apt install -y nginx

# Install Certbot
apt install -y certbot python3-certbot-nginx

# Setup Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

### **STEP 5: Configure Application**

1. **Navigate to project:**
   ```bash
   cd /opt/documan-app
   ```

2. **Create .env file:**
   ```bash
   cp .env.production .env
   nano .env
   ```

3. **Edit .env:**
   ```env
   # Database
   DB_NAME=document_management_prod
   DB_USER=documan_user
   DB_PASSWORD=UltraSecure2024!@#ChangeMePlease
   DB_HOST=postgres
   DB_PORT=5432
   
   # JWT Secret (generate new)
   JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
   
   # Application
   NODE_ENV=production
   PORT=5001
   
   # File Upload
   MAX_FILE_SIZE=10485760
   
   # CORS - Update with your domain
   ALLOWED_ORIGINS=https://documan.tk,https://www.documan.tk,http://94.237.XXX.XXX
   ```

4. **Generate JWT Secret:**
   ```bash
   openssl rand -base64 32
   # Copy output dan paste ke JWT_SECRET
   ```

5. **Save & Exit:**
   ```
   Ctrl+O (save)
   Enter
   Ctrl+X (exit)
   ```

---

### **STEP 6: Deploy Application**

```bash
cd /opt/documan-app

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

Script akan:
1. ✅ Build Docker images
2. ✅ Start containers
3. ✅ Initialize database
4. ✅ Create admin user
5. ✅ Run health checks

**Verify containers running:**
```bash
docker-compose ps

# Expected output:
# documan-postgres    Up (healthy)
# documan-backend     Up (healthy)
# documan-frontend    Up (healthy)
```

**Test locally:**
```bash
# Test backend
curl http://localhost:5001/health

# Test frontend
curl http://localhost:3000
```

---

### **STEP 7: Configure Nginx Reverse Proxy**

1. **Create Nginx config:**
   ```bash
   nano /etc/nginx/sites-available/documan
   ```

2. **Paste configuration:**
   ```nginx
   # Upstream backends
   upstream backend_api {
       server localhost:5001;
       keepalive 32;
   }
   
   upstream frontend_app {
       server localhost:3000;
       keepalive 32;
   }
   
   # HTTP Server (akan redirect ke HTTPS setelah SSL setup)
   server {
       listen 80;
       listen [::]:80;
       server_name documan.tk www.documan.tk;
   
       # Let's Encrypt challenge
       location /.well-known/acme-challenge/ {
           root /var/www/html;
       }
   
       # Client max body size
       client_max_body_size 15M;
   
       # API Proxy
       location /api {
           proxy_pass http://backend_api;
           proxy_http_version 1.1;
           
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           
           proxy_connect_timeout 60s;
           proxy_send_timeout 60s;
           proxy_read_timeout 60s;
       }
   
       # API Docs
       location /api-docs {
           proxy_pass http://backend_api;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   
       # Uploads
       location /uploads {
           proxy_pass http://backend_api;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
       }
   
       # Frontend
       location / {
           proxy_pass http://frontend_app;
           proxy_http_version 1.1;
           
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           
           # WebSocket support
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable site:**
   ```bash
   # Create symlink
   ln -s /etc/nginx/sites-available/documan /etc/nginx/sites-enabled/
   
   # Remove default site
   rm /etc/nginx/sites-enabled/default
   
   # Test configuration
   nginx -t
   
   # Reload Nginx
   systemctl reload nginx
   ```

---

### **STEP 8: Setup SSL Certificate**

1. **Obtain SSL from Let's Encrypt:**
   ```bash
   certbot --nginx -d documan.tk -d www.documan.tk
   ```

2. **Certbot akan bertanya:**
   ```
   Email address: [your email]
   Agree to terms: Yes (Y)
   Share email: No (N)
   Redirect HTTP to HTTPS: Yes (2)
   ```

3. **Verify SSL:**
   ```bash
   # Test SSL
   curl https://documan.tk
   
   # Check certificate
   certbot certificates
   ```

4. **Setup auto-renewal:**
   ```bash
   # Test renewal
   certbot renew --dry-run
   
   # Cron will auto-renew (already setup by certbot)
   ```

**Nginx config akan otomatis update dengan SSL:**
```nginx
# HTTPS akan ditambahkan oleh Certbot
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name documan.tk www.documan.tk;

    ssl_certificate /etc/letsencrypt/live/documan.tk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/documan.tk/privkey.pem;
    # ... rest of config
}
```

---

### **STEP 9: Configure DNS di Cloudflare**

1. **Login ke Cloudflare Dashboard:**
   ```
   Select: documan.tk
   ```

2. **Add DNS Records:**
   ```
   Type: A
   Name: @
   IPv4 address: [UpCloud Public IP - 94.237.XXX.XXX]
   Proxy status: Proxied (orange cloud) ✅
   TTL: Auto
   
   Click "Save"
   ```

   ```
   Type: A
   Name: www
   IPv4 address: [UpCloud Public IP - 94.237.XXX.XXX]
   Proxy status: Proxied (orange cloud) ✅
   TTL: Auto
   
   Click "Save"
   ```

3. **Verify DNS Propagation:**
   ```bash
   # Check DNS
   nslookup documan.tk
   dig documan.tk
   
   # Online checker
   # https://dnschecker.org
   ```

4. **Enable Cloudflare Features:**
   ```
   SSL/TLS:
   - SSL/TLS encryption mode: Full (strict)
   - Always Use HTTPS: ON
   - Automatic HTTPS Rewrites: ON
   - Minimum TLS Version: TLS 1.2
   
   Speed → Optimization:
   - Auto Minify: JS, CSS, HTML (ON)
   - Brotli: ON
   - HTTP/2: ON
   - HTTP/3 (with QUIC): ON
   
   Caching → Configuration:
   - Caching Level: Standard
   - Browser Cache TTL: 4 hours
   
   Security → Settings:
   - Security Level: Medium
   - Challenge Passage: 30 minutes
   - Browser Integrity Check: ON
   
   Firewall → Security Level:
   - Security Level: Medium
   - Bot Fight Mode: ON (optional)
   ```

---

### **STEP 10: Update Frontend API URL**

Frontend perlu tahu URL backend yang benar:

1. **Update frontend environment:**
   ```bash
   cd /opt/documan-app/frontend
   nano .env.production
   ```

2. **Set API URL:**
   ```env
   VITE_API_URL=https://documan.tk/api
   ```

3. **Rebuild frontend:**
   ```bash
   cd /opt/documan-app
   docker-compose build frontend --no-cache
   docker-compose up -d frontend
   ```

**Atau update vite.config.ts** (sudah di-set untuk production):
```typescript
// File sudah benar, tidak perlu diubah
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true
    }
  }
}
```

---

## ✅ Verification Checklist

### **A. DNS & SSL:**
```bash
# Check DNS resolve
nslookup documan.tk

# Check SSL certificate
curl -I https://documan.tk

# Online SSL checker
# https://www.ssllabs.com/ssltest/
```

### **B. Application Access:**

1. **Frontend:**
   ```
   URL: https://documan.tk
   Expected: Login page muncul
   ```

2. **Backend API:**
   ```
   URL: https://documan.tk/api/health
   Expected: {"status":"healthy"}
   ```

3. **API Documentation:**
   ```
   URL: https://documan.tk/api-docs
   Expected: Swagger UI muncul
   ```

### **C. Functionality Test:**

1. **Login:**
   ```
   Username: admin
   Password: admin123
   Expected: Redirect to dashboard
   ```

2. **Upload Document:**
   ```
   Upload file PDF
   Add GPS coordinates
   Expected: Success
   ```

3. **View Documents:**
   ```
   Check document list
   Expected: Document muncul
   ```

4. **Download Document:**
   ```
   Click download
   Expected: File downloaded
   ```

### **D. Security Test:**

```bash
# Check firewall
sudo ufw status

# Check SSL grade
# https://www.ssllabs.com/ssltest/analyze.html?d=documan.tk

# Check headers
curl -I https://documan.tk
```

### **E. Performance Test:**

```bash
# Check response time
curl -w "@curl-format.txt" -o /dev/null -s https://documan.tk

# Online speed test
# https://tools.pingdom.com
# https://gtmetrix.com
```

---

## 🔒 Security Hardening

### **1. Change Default Credentials:**

```bash
# Change admin password via application
# Login → Settings → Change Password

# Or via backend script
cd /opt/documan-app/backend
docker exec -it documan-backend node src/scripts/resetAdminPassword.js
```

### **2. Setup Fail2Ban:**

```bash
# Install Fail2Ban
apt install -y fail2ban

# Configure
nano /etc/fail2ban/jail.local
```

Add:
```ini
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600
```

```bash
systemctl restart fail2ban
```

### **3. Enable Cloudflare Security:**

```
Cloudflare Dashboard → Security:

1. Bot Fight Mode: ON
2. Challenge Passage: 30 minutes
3. Security Level: Medium
4. Browser Integrity Check: ON

Firewall Rules (optional):
- Block countries (if needed)
- Rate limiting
- Challenge on specific paths
```

### **4. Database Security:**

```bash
# PostgreSQL is isolated in Docker network
# Only accessible from backend container
# No public access

# Verify
docker network inspect documan-network
```

### **5. Backup Automation:**

```bash
# Make backup script executable
chmod +x /opt/documan-app/backup-db.sh

# Test backup
/opt/documan-app/backup-db.sh

# Schedule daily backup
crontab -e
```

Add:
```cron
# Daily database backup at 2 AM
0 2 * * * /opt/documan-app/backup-db.sh >> /var/log/documan-backup.log 2>&1

# Weekly cleanup of old backups (30 days)
0 3 * * 0 find /opt/documan-app/backup -name "*.sql.gz" -mtime +30 -delete
```

---

## 📊 Monitoring Setup

### **1. Setup Monitoring Script:**

```bash
# Make executable
chmod +x /opt/documan-app/monitor.sh

# Run manually
/opt/documan-app/monitor.sh

# Schedule hourly checks
crontab -e
```

Add:
```cron
# Hourly health check
0 * * * * /opt/documan-app/monitor.sh >> /var/log/documan-monitor.log 2>&1
```

### **2. Cloudflare Analytics:**

```
Cloudflare Dashboard → Analytics:
- Page views
- Unique visitors
- Bandwidth
- Threats blocked
- Response time
```

### **3. Server Monitoring:**

```bash
# Install htop
apt install -y htop

# Monitor resources
htop

# Check disk usage
df -h

# Check memory
free -h

# Check Docker stats
docker stats
```

---

## 🔄 Update & Maintenance

### **Update Application Code:**

```bash
cd /opt/documan-app

# Pull latest code
git pull origin master

# Rebuild containers
docker-compose build --no-cache

# Restart with zero downtime
docker-compose up -d

# Verify
docker-compose ps
./monitor.sh
```

### **Update System:**

```bash
# Update packages
apt update && apt upgrade -y

# Update Docker images
docker-compose pull

# Restart containers
docker-compose up -d

# Clean old images
docker system prune -a
```

---

## 📱 Access Information

### **Public URLs:**

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://documan.tk | ✅ Public |
| **API** | https://documan.tk/api | ✅ Public |
| **API Docs** | https://documan.tk/api-docs | ✅ Public |
| **Database** | Internal only | 🔒 Private |

### **Admin Credentials:**

```
URL: https://documan.tk
Username: admin
Password: admin123

⚠️ CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!
```

### **SSH Access:**

```bash
ssh root@94.237.XXX.XXX
# or
ssh documan@94.237.XXX.XXX
```

---

## 🎓 Development Workflow

### **For Future Development:**

1. **Local Development:**
   ```bash
   # Work on local machine
   git checkout -b feature-new-feature
   # Make changes
   npm test
   git commit -m "Add new feature"
   git push origin feature-new-feature
   ```

2. **Deploy to Production:**
   ```bash
   # SSH to server
   ssh root@94.237.XXX.XXX
   
   # Navigate to app
   cd /opt/documan-app
   
   # Backup database
   ./backup-db.sh
   
   # Pull changes
   git pull origin master
   
   # Rebuild & restart
   docker-compose build --no-cache
   docker-compose up -d
   
   # Verify
   ./monitor.sh
   ```

3. **Rollback (if needed):**
   ```bash
   # Git rollback
   git log --oneline
   git reset --hard <commit-hash>
   
   # Rebuild
   docker-compose build --no-cache
   docker-compose up -d
   
   # Or restore database
   gunzip < backup/documan_backup_YYYYMMDD.sql.gz | \
     docker exec -i documan-postgres psql -U documan_user -d document_management_prod
   ```

---

## 📞 Support & Resources

### **Dashboards:**

- **UpCloud:** https://hub.upcloud.com
- **Cloudflare:** https://dash.cloudflare.com
- **Freenom:** https://my.freenom.com
- **GitHub:** https://github.com/ignafransdstn/documan-app

### **Useful Commands:**

```bash
# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Database shell
docker exec -it documan-postgres psql -U documan_user -d document_management_prod

# Backend shell
docker exec -it documan-backend sh

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### **Documentation:**

- `README.md` - System overview
- `DEPLOYMENT-UPCLOUD.md` - Detailed deployment guide
- `QUICK-DEPLOY.md` - Quick reference
- `docs/` - Technical documentation

---

## ⚠️ Important Notes

### **Domain (Freenom):**
- ✅ Gratis 12 bulan, bisa diperpanjang
- ⚠️ Harus diperpanjang sebelum expire
- ⚠️ Domain bisa dicabut jika melanggar TOS
- 📅 Set reminder 1 bulan sebelum expire

### **SSL Certificate:**
- ✅ Auto-renew by Certbot
- ✅ Valid 90 hari, renew otomatis setiap 60 hari
- ⚠️ Check renewal: `certbot certificates`

### **Cloudflare:**
- ✅ Free tier cukup untuk prototype
- ✅ Unlimited bandwidth
- ⚠️ Cache might need purge after updates

### **UpCloud:**
- ⚠️ Biaya ~Rp 80k/bulan
- ⚠️ Pastikan top-up sebelum habis
- ✅ Bisa upgrade/downgrade kapan saja

---

## 🎯 Next Steps After Deployment

### **Immediate (Week 1):**
- [ ] Test all features from different devices
- [ ] Share URL with test users
- [ ] Collect feedback
- [ ] Monitor performance and errors
- [ ] Change default admin password

### **Short Term (Month 1):**
- [ ] Add more test users
- [ ] Upload sample documents
- [ ] Test load with multiple concurrent users
- [ ] Optimize based on usage patterns
- [ ] Setup monitoring alerts

### **Medium Term (Month 2-3):**
- [ ] Implement requested features
- [ ] Improve UI/UX based on feedback
- [ ] Add more security features
- [ ] Optimize database queries
- [ ] Setup staging environment

### **Long Term (Month 4+):**
- [ ] Consider paid domain (.com/.id)
- [ ] Upgrade server if needed
- [ ] Implement advanced features
- [ ] Add mobile app (optional)
- [ ] Scale infrastructure

---

## ✅ Success Criteria

Prototype dianggap berhasil jika:

- ✅ Accessible dari internet: https://documan.tk
- ✅ SSL/HTTPS aktif dan valid
- ✅ Login berfungsi normal
- ✅ Upload dokumen berhasil
- ✅ Download dokumen berhasil
- ✅ Map integration working
- ✅ User management functional
- ✅ Response time < 2 detik
- ✅ Uptime > 99%
- ✅ Backup automation running

---

**Deployment Status:** 🚀 Ready to Deploy

**Estimated Total Time:** 3-4 hours

**Total Cost:** ~Rp 80.000/month (hanya UpCloud VM)

---

**Good luck with your deployment!** 🎉

Jika ada masalah atau pertanyaan, cek troubleshooting section atau hubungi support.
