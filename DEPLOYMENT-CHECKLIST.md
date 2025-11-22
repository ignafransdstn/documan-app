# ✅ Deployment Checklist - DocuMan Prototype

## 📋 Quick Start Checklist

Ikuti checklist ini step-by-step untuk deploy DocuMan prototype ke internet.

---

## FASE 1: PERSIAPAN (30 menit)

### ☐ 1. Register Domain Gratis (15 menit)

**Website:** https://www.freenom.com

- [ ] Buka Freenom
- [ ] Search domain: `documan`
- [ ] Pilih TLD: `.tk` (recommended), `.ml`, atau `.ga`
- [ ] Check availability
- [ ] Add to cart
- [ ] Checkout (pilih 12 months @ FREE)
- [ ] Create account atau login
- [ ] Verify email
- [ ] Confirm domain: **documan.tk** ✅

**Output:** Domain `documan.tk` ready

---

### ☐ 2. Setup Cloudflare CDN (15 menit)

**Website:** https://cloudflare.com

- [ ] Daftar akun Cloudflare (FREE plan)
- [ ] Click "Add a Site"
- [ ] Enter domain: `documan.tk`
- [ ] Select plan: FREE
- [ ] Wait for DNS scan
- [ ] **CATAT nameservers yang diberikan:**
  ```
  Nameserver 1: _____________.ns.cloudflare.com
  Nameserver 2: _____________.ns.cloudflare.com
  ```

- [ ] Login ke Freenom → My Domains → Manage Domain
- [ ] Management Tools → Nameservers
- [ ] Select: "Use custom nameservers"
- [ ] Paste nameservers dari Cloudflare
- [ ] Click "Change Nameservers"
- [ ] Tunggu 10-30 menit untuk propagasi
- [ ] Verify di Cloudflare: Status = "Active" ✅

**Output:** Cloudflare aktif untuk `documan.tk`

---

## FASE 2: SETUP SERVER (45 menit)

### ☐ 3. Create UpCloud VM (15 menit)

**Website:** https://hub.upcloud.com

- [ ] Login ke UpCloud
- [ ] Click "Deploy a Server"

**Configuration:**
```
Location: Singapore
OS: Ubuntu 22.04 LTS
Plan: 2 vCPU, 4 GB RAM, 50 GB SSD
Hostname: documan-production
Authentication: SSH Key (recommended) atau Password
```

- [ ] Deploy server
- [ ] Wait 2-3 minutes
- [ ] **CATAT Public IP:**
  ```
  Server IP: ___.___.___.___
  ```

**Output:** Server IP = `___.___.___.___ ` ✅

---

### ☐ 4. First SSH Access (10 menit)

```bash
# SSH to server (replace with your IP)
ssh root@___.___.___.___ 

# Update system
apt update && apt upgrade -y

# Set timezone
timedatectl set-timezone Asia/Jakarta

# Install Git
apt install -y git
```

- [ ] SSH berhasil
- [ ] System updated
- [ ] Timezone set ke Asia/Jakarta
- [ ] Git installed ✅

---

### ☐ 5. Install Dependencies (20 menit)

```bash
# Clone project
cd /opt
git clone https://github.com/ignafransdstn/documan-app.git
cd documan-app

# Make install script executable
chmod +x install.sh

# Run installation (auto-install Docker, Nginx, etc)
./install.sh
```

**Script akan install:**
- [ ] Docker
- [ ] Docker Compose
- [ ] Nginx
- [ ] Certbot (SSL)
- [ ] UFW Firewall (ports 22, 80, 443)

**Verify:**
```bash
docker --version
docker-compose --version
nginx -v
```

- [ ] Semua installed ✅

---

## FASE 3: CONFIGURE & DEPLOY (60 menit)

### ☐ 6. Configure Application (15 menit)

```bash
cd /opt/documan-app

# Copy environment template
cp .env.production .env

# Edit environment file
nano .env
```

**Update .env dengan values ini:**
```env
DB_NAME=document_management_prod
DB_USER=documan_user
DB_PASSWORD=UltraSecure2024!@#YourStrongPassword  # ⚠️ GANTI INI!
DB_HOST=postgres
DB_PORT=5432

JWT_SECRET=your_generated_secret_here_min_32_chars  # ⚠️ GANTI INI!

NODE_ENV=production
PORT=5001

MAX_FILE_SIZE=10485760

ALLOWED_ORIGINS=https://documan.tk,https://www.documan.tk
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
# Copy output dan paste ke JWT_SECRET
```

- [ ] .env file created
- [ ] DB_PASSWORD diganti (strong password)
- [ ] JWT_SECRET generated dan set
- [ ] ALLOWED_ORIGINS set ke domain Anda
- [ ] Save file (Ctrl+O, Enter, Ctrl+X) ✅

---

### ☐ 7. Deploy Application (15 menit)

```bash
cd /opt/documan-app

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Script akan:**
- [ ] Build Docker images (backend, frontend, postgres)
- [ ] Start containers
- [ ] Initialize database
- [ ] Create admin user
- [ ] Run health checks

**Verify:**
```bash
docker-compose ps

# Expected output:
# documan-postgres    Up (healthy)
# documan-backend     Up (healthy)  
# documan-frontend    Up (healthy)
```

**Test locally:**
```bash
curl http://localhost:5001/health
# Expected: {"status":"healthy"}

curl http://localhost:3000
# Expected: HTML response
```

- [ ] All containers UP and HEALTHY ✅

---

### ☐ 8. Configure Nginx (15 menit)

```bash
# Create Nginx config
nano /etc/nginx/sites-available/documan
```

**Paste configuration ini:**
```nginx
upstream backend_api {
    server localhost:5001;
}

upstream frontend_app {
    server localhost:3000;
}

server {
    listen 80;
    listen [::]:80;
    server_name documan.tk www.documan.tk;

    client_max_body_size 15M;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location /api {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api-docs {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /uploads {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://frontend_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable site:**
```bash
# Create symlink
ln -s /etc/nginx/sites-available/documan /etc/nginx/sites-enabled/

# Remove default
rm /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Reload
systemctl reload nginx
```

- [ ] Nginx config created
- [ ] Site enabled
- [ ] Config test passed
- [ ] Nginx reloaded ✅

---

### ☐ 9. Setup SSL Certificate (15 menit)

```bash
# Obtain SSL certificate
certbot --nginx -d documan.tk -d www.documan.tk
```

**Certbot akan bertanya:**
```
Email: [your-email@example.com]          # ⚠️ Your email
Terms of Service: Y
Share email: N
Redirect HTTP to HTTPS: 2 (Yes)
```

**Verify SSL:**
```bash
certbot certificates

# Test HTTPS
curl https://documan.tk
```

- [ ] SSL certificate obtained
- [ ] HTTPS redirect enabled
- [ ] Certificate verified ✅

---

## FASE 4: DNS & GO LIVE (30 menit)

### ☐ 10. Configure DNS di Cloudflare (10 menit)

**Login:** https://dash.cloudflare.com

- [ ] Select site: `documan.tk`
- [ ] Go to DNS → Records

**Add A Record untuk root domain:**
```
Type: A
Name: @
IPv4 address: [Your UpCloud IP]
Proxy status: ✅ Proxied (orange cloud)
TTL: Auto
```

**Add A Record untuk www:**
```
Type: A
Name: www
IPv4 address: [Your UpCloud IP]
Proxy status: ✅ Proxied (orange cloud)
TTL: Auto
```

- [ ] A record @ created
- [ ] A record www created
- [ ] Both proxied through Cloudflare ✅

---

### ☐ 11. Enable Cloudflare Features (10 menit)

**SSL/TLS Settings:**
- [ ] SSL/TLS → Overview
- [ ] Encryption mode: **Full (strict)**
- [ ] Always Use HTTPS: **ON**
- [ ] Automatic HTTPS Rewrites: **ON**

**Speed Optimization:**
- [ ] Speed → Optimization
- [ ] Auto Minify: **JS, CSS, HTML** (ON)
- [ ] Brotli: **ON**

**Security:**
- [ ] Security → Settings
- [ ] Security Level: **Medium**
- [ ] Bot Fight Mode: **ON**

- [ ] All Cloudflare features enabled ✅

---

### ☐ 12. Wait for DNS Propagation (10 menit)

```bash
# Check DNS resolution
nslookup documan.tk

# Or use online tool
# https://dnschecker.org
```

- [ ] DNS resolves to Cloudflare IP
- [ ] Both documan.tk and www.documan.tk working
- [ ] Propagation complete ✅

---

## FASE 5: TESTING & VERIFICATION (30 menit)

### ☐ 13. Test Application Access

**Open Browser:**

1. **Frontend:**
   ```
   URL: https://documan.tk
   ```
   - [ ] Page loads successfully
   - [ ] Login page displayed
   - [ ] No SSL warnings
   - [ ] Page loads fast (Cloudflare CDN)

2. **Backend API:**
   ```
   URL: https://documan.tk/api/health
   ```
   - [ ] Returns: `{"status":"healthy",...}`

3. **API Documentation:**
   ```
   URL: https://documan.tk/api-docs
   ```
   - [ ] Swagger UI displayed

---

### ☐ 14. Test Application Features

**Login:**
- [ ] Go to https://documan.tk
- [ ] Username: `admin`
- [ ] Password: `admin123`
- [ ] Click Login
- [ ] Redirect to Dashboard ✅

**Upload Document:**
- [ ] Navigate to Documents page
- [ ] Click "Upload Document"
- [ ] Fill form:
  - [ ] Document No
  - [ ] Title
  - [ ] Description
  - [ ] GPS Coordinates
  - [ ] Upload PDF file
- [ ] Click Submit
- [ ] Document appears in list ✅

**Download Document:**
- [ ] Click document in list
- [ ] Click Download
- [ ] File downloads successfully ✅

**Map View:**
- [ ] View document details
- [ ] Map shows location marker
- [ ] Coordinates displayed ✅

**User Management (Admin):**
- [ ] Navigate to Users page
- [ ] Create new user
- [ ] Edit user
- [ ] Deactivate user ✅

---

### ☐ 15. Security Verification

```bash
# Check firewall
ufw status

# Check containers
docker-compose ps

# Check Nginx
systemctl status nginx

# Check SSL grade
# Visit: https://www.ssllabs.com/ssltest/
# Enter: documan.tk
```

- [ ] Firewall active (22, 80, 443 open)
- [ ] All containers healthy
- [ ] Nginx running
- [ ] SSL grade A or A+ ✅

---

## FASE 6: POST-DEPLOYMENT (30 menit)

### ☐ 16. Change Default Password

- [ ] Login as admin
- [ ] Go to Settings/Profile
- [ ] Change password from `admin123` to strong password
- [ ] Logout and login with new password
- [ ] Password changed ✅

---

### ☐ 17. Setup Monitoring

```bash
# Make monitor script executable
chmod +x /opt/documan-app/monitor.sh

# Test monitor
/opt/documan-app/monitor.sh

# Schedule hourly monitoring
crontab -e
```

**Add to crontab:**
```cron
# Hourly health check
0 * * * * /opt/documan-app/monitor.sh >> /var/log/documan-monitor.log 2>&1
```

- [ ] Monitor script working
- [ ] Cron job scheduled ✅

---

### ☐ 18. Setup Backup

```bash
# Make backup script executable
chmod +x /opt/documan-app/backup-db.sh

# Test backup
/opt/documan-app/backup-db.sh

# Check backup created
ls -lh /opt/documan-app/backup/

# Schedule daily backup
crontab -e
```

**Add to crontab:**
```cron
# Daily database backup at 2 AM
0 2 * * * /opt/documan-app/backup-db.sh >> /var/log/documan-backup.log 2>&1
```

- [ ] Backup script working
- [ ] Backup file created
- [ ] Cron job scheduled ✅

---

### ☐ 19. Documentation & Access Info

**Create access document:**

```markdown
# DocuMan Production Access

## Public URLs
- Frontend: https://documan.tk
- API: https://documan.tk/api
- API Docs: https://documan.tk/api-docs

## Admin Access
- Username: admin
- Password: [YOUR_NEW_PASSWORD]

## Server Access
- SSH: ssh root@[YOUR_IP]
- Location: /opt/documan-app

## Dashboards
- UpCloud: https://hub.upcloud.com
- Cloudflare: https://dash.cloudflare.com
- Freenom: https://my.freenom.com
- GitHub: https://github.com/ignafransdstn/documan-app

## Monitoring
- Health: https://documan.tk/api/health
- Logs: docker-compose logs -f
- Monitor: /opt/documan-app/monitor.sh

## Backup
- Location: /opt/documan-app/backup/
- Schedule: Daily 2 AM
- Retention: 30 days
```

- [ ] Access info documented
- [ ] Credentials saved securely ✅

---

### ☐ 20. Share with Test Users

- [ ] Test from different devices:
  - [ ] Desktop browser
  - [ ] Mobile browser
  - [ ] Different network (WiFi, mobile data)
  - [ ] Different locations

- [ ] Share URL with team/users:
  ```
  Website: https://documan.tk
  Username: [create for them]
  Password: [set for them]
  ```

- [ ] Collect feedback
- [ ] Monitor usage ✅

---

## ✅ DEPLOYMENT COMPLETE!

### Final Checklist:

- [ ] Domain registered: **documan.tk**
- [ ] Cloudflare CDN active
- [ ] UpCloud server running
- [ ] Application deployed
- [ ] SSL/HTTPS working
- [ ] All features tested
- [ ] Security hardened
- [ ] Monitoring setup
- [ ] Backup automated
- [ ] Access documented
- [ ] Users can access publicly

---

## 📊 Deployment Summary

| Item | Status | Details |
|------|--------|---------|
| **Domain** | ✅ | documan.tk (Freenom) |
| **CDN** | ✅ | Cloudflare (FREE) |
| **Server** | ✅ | UpCloud Singapore |
| **SSL** | ✅ | Let's Encrypt |
| **Application** | ✅ | Docker containers |
| **Database** | ✅ | PostgreSQL |
| **Monitoring** | ✅ | Automated |
| **Backup** | ✅ | Daily 2 AM |
| **Public Access** | ✅ | https://documan.tk |

---

## 🎉 Success!

System DocuMan sudah live dan bisa diakses publik di:

### 🌐 **https://documan.tk**

---

## 📞 Support

Jika ada masalah:

1. Check logs: `docker-compose logs -f`
2. Run monitor: `/opt/documan-app/monitor.sh`
3. Check documentation: `/opt/documan-app/DEPLOYMENT-ROADMAP.md`
4. Review troubleshooting: `/opt/documan-app/QUICK-DEPLOY.md`

---

## 🔄 Next Steps

**Untuk Development:**
- Setup staging environment
- Implement new features
- Collect user feedback
- Optimize performance

**Untuk Production:**
- Monitor usage analytics
- Plan scalability
- Consider premium domain
- Add more features

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Domain:** https://documan.tk

**Server IP:** _______________

**Status:** ✅ **PRODUCTION READY**

---

Good luck! 🚀
