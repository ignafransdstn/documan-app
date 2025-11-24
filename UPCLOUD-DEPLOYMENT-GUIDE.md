# 🚀 UpCloud Deployment Guide - DocuMan

Complete step-by-step guide to deploy DocuMan on UpCloud server.

---

## 📋 Prerequisites

### 1. UpCloud Account
- Sign up at: https://upcloud.com
- Add payment method (credit card or PayPal)
- Minimum deposit: $10 USD

### 2. Domain (Optional for now)
- Can deploy with IP first
- Buy domain later (recommended: Namecheap, Cloudflare)
- Or use free subdomain from Afraid.org

---

## 🖥️ STEP 1: Create UpCloud Server

### 1.1 Login to UpCloud Dashboard

https://hub.upcloud.com/

### 1.2 Create New Server

Click **"Deploy a server"** → **"Cloud Server"**

**Configuration:**
```
Location: Singapore (fastest for Indonesia)
Operating System: Ubuntu 22.04 LTS
Plan: 
  - Simple (Recommended)
  - 1 vCPU
  - 2 GB RAM
  - 50 GB SSD
  
Price: ~$6/month (~Rp 95k/month)

Server name: documan-production
Hostname: documan
```

**Additional Settings:**
- ✅ Enable IPv4
- ✅ Enable firewall
- ✅ Add SSH key (recommended) OR use password

### 1.3 Start Server

Click **"Deploy"** → Wait ~2 minutes

**Note down:**
- ✅ Server IP address
- ✅ SSH username (usually `root`)
- ✅ SSH password (if not using key)

---

## 🔐 STEP 2: Connect to Server

### Option A: SSH from Terminal (macOS/Linux)

```bash
ssh root@YOUR_SERVER_IP
```

Example:
```bash
ssh root@95.217.123.456
```

Enter password when prompted.

### Option B: UpCloud Web Console

- In server dashboard → Click **"Console"**
- Login with root credentials

---

## ⚙️ STEP 3: Initial Server Setup

### 3.1 Run Setup Script

```bash
# Download setup script
curl -fsSL https://raw.githubusercontent.com/ignafransdstn/documan-app/master/scripts/setup-server.sh -o setup-server.sh

# Make executable
chmod +x setup-server.sh

# Run setup
sudo bash setup-server.sh
```

**What this installs:**
- ✅ Docker & Docker Compose
- ✅ UFW Firewall
- ✅ Essential tools (git, curl, wget)
- ✅ Monitoring tools (htop, ncdu)

**Duration:** ~5-10 minutes

---

## 📦 STEP 4: Clone & Configure Application

### 4.1 Clone Repository

```bash
# Go to deployment directory
cd /opt/documan

# Clone from GitHub
git clone https://github.com/ignafransdstn/documan-app.git .

# Check files
ls -la
```

### 4.2 Configure Environment

```bash
# Copy environment template
cp .env.production .env

# Edit with nano
nano .env
```

**Update these values:**

```env
# Database
DB_NAME=documan_db
DB_USER=postgres
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE  # ⚠️ Change this!

# JWT Secret - Generate with:
# openssl rand -base64 32
JWT_SECRET=YOUR_RANDOM_JWT_SECRET_HERE  # ⚠️ Change this!

# File Upload (10MB default)
MAX_FILE_SIZE=10485760

# CORS - Update after getting domain
ALLOWED_ORIGINS=http://YOUR_SERVER_IP

# API URL - Update after getting domain
VITE_API_URL=http://YOUR_SERVER_IP/api
```

**Generate secure secrets:**

```bash
# Generate DB password
openssl rand -base64 24

# Generate JWT secret
openssl rand -base64 32
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

---

## 🚀 STEP 5: Deploy Application

### 5.1 Run Deployment Script

```bash
# Make script executable (if not already)
chmod +x scripts/deploy.sh

# Run deployment
bash scripts/deploy.sh
```

**What happens:**
1. ✅ Checks Docker installation
2. ✅ Stops old containers (if any)
3. ✅ Builds Docker images (~5-10 min)
4. ✅ Starts all services
5. ✅ Waits for health checks

**Duration:** ~10-15 minutes (first time)

### 5.2 Verify Deployment

```bash
# Check running containers
docker compose ps

# Should show:
# - documan-postgres (healthy)
# - documan-backend (healthy)
# - documan-frontend (healthy)
# - documan-nginx (healthy)
```

---

## ✅ STEP 6: Test Application

### 6.1 Get Server IP

```bash
curl ifconfig.me
```

### 6.2 Access Application

Open browser and go to:

```
http://YOUR_SERVER_IP
```

**Expected:**
- ✅ Login page loads
- ✅ No SSL warning (HTTP only for now)
- ✅ Can login with `admin` / `admin123`

### 6.3 Test API

```
http://YOUR_SERVER_IP/api-docs
```

**Expected:**
- ✅ Swagger documentation loads
- ✅ Can test endpoints

### 6.4 Create Admin User (if needed)

```bash
# Connect to backend container
docker compose exec backend npm run create-admin

# Or manually via PostgreSQL
docker compose exec postgres psql -U postgres -d documan_db
```

---

## 🌐 STEP 7: Setup Domain (When Ready)

### 7.1 Update DNS Records

**After you buy domain**, add A record:

```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600

Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600
```

**Wait for DNS propagation** (~10-60 minutes)

### 7.2 Test DNS

```bash
# Check if domain points to server
dig +short yourdomain.com

# Should return YOUR_SERVER_IP
```

### 7.3 Update Environment

```bash
# Edit .env
nano .env
```

Update:
```env
ALLOWED_ORIGINS=http://yourdomain.com,https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
```

### 7.4 Setup SSL Certificate

```bash
# Run SSL setup script
bash scripts/setup-ssl.sh yourdomain.com
```

**What happens:**
1. ✅ Updates nginx config with your domain
2. ✅ Obtains SSL certificate from Let's Encrypt
3. ✅ Enables HTTPS
4. ✅ Redirects HTTP → HTTPS
5. ✅ Auto-renewal configured

**Duration:** ~2-3 minutes

### 7.5 Access via HTTPS

```
https://yourdomain.com
```

**Expected:**
- ✅ Green padlock (SSL active)
- ✅ Application loads
- ✅ Can login

---

## 📊 Monitoring & Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100
```

### Check Status

```bash
# Container status
docker compose ps

# Resource usage
docker stats

# Server resources
htop
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend

# Full restart (rebuild)
docker compose down
docker compose up -d --build
```

### Database Backup

```bash
# Create backup
docker compose exec postgres pg_dump -U postgres documan_db > backup.sql

# Restore backup
docker compose exec -T postgres psql -U postgres documan_db < backup.sql
```

### Update Application

```bash
# Pull latest code
git pull origin master

# Redeploy
bash scripts/deploy.sh
```

---

## 🔧 Troubleshooting

### Issue: Can't connect to server

**Check firewall:**
```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Issue: Services unhealthy

**Check logs:**
```bash
docker compose logs backend
```

**Common fixes:**
```bash
# Restart services
docker compose restart

# Full rebuild
docker compose down
docker compose up -d --build
```

### Issue: Database connection error

**Check DATABASE_URL:**
```bash
docker compose exec backend env | grep DB
```

**Restart database:**
```bash
docker compose restart postgres
```

### Issue: Out of disk space

**Check usage:**
```bash
df -h
docker system df
```

**Clean up:**
```bash
# Remove unused images
docker system prune -a

# Remove volumes (⚠️ destroys data)
docker volume prune
```

---

## 💰 Cost Breakdown

**Monthly costs:**

| Service | Provider | Cost |
|---------|----------|------|
| Server (2GB RAM) | UpCloud | ~Rp 95k |
| Domain (.com) | Namecheap | ~Rp 200k/year |
| SSL Certificate | Let's Encrypt | FREE |
| **Total** | | **~Rp 95-100k/month** |

**Free alternatives:**
- Domain: Use Afraid.org (FREE)
- Total: **Rp 95k/month** (UpCloud only)

---

## 📞 Support

**UpCloud Support:**
- Email: support@upcloud.com
- Docs: https://upcloud.com/docs

**DocuMan Issues:**
- GitHub: https://github.com/ignafransdstn/documan-app/issues

---

## ✅ Deployment Checklist

- [ ] UpCloud server created
- [ ] SSH access working
- [ ] Setup script executed
- [ ] Repository cloned
- [ ] .env configured (DB_PASSWORD, JWT_SECRET)
- [ ] Application deployed
- [ ] Can access via IP
- [ ] Login working
- [ ] API docs accessible
- [ ] Domain purchased (optional)
- [ ] DNS configured (if domain)
- [ ] SSL setup (if domain)
- [ ] HTTPS working (if domain)
- [ ] Backups configured

---

**Deployment Time Estimate:**
- Without domain: ~30-45 minutes
- With domain + SSL: ~60-90 minutes (includes DNS wait)

**Status:** Ready for Production ✅
