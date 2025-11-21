# Deployment Guide - UpCloud Virtual Machine

## 📋 Overview

Panduan deployment DocuMan ke UpCloud VM menggunakan Docker + Nginx sebagai reverse proxy.

### 🎯 Deployment Architecture

```
Internet
    │
    ↓
┌─────────────────────────────────────────────────────┐
│           UpCloud Virtual Machine                    │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Nginx (Port 80/443)                         │   │
│  │  - Reverse Proxy                             │   │
│  │  - SSL Termination                           │   │
│  │  - Static File Serving                       │   │
│  └─────────┬────────────────────────────────────┘   │
│            │                                         │
│     ┌──────┴──────┐                                 │
│     │             │                                 │
│     ↓             ↓                                 │
│  ┌──────┐    ┌──────────┐                          │
│  │Docker│    │  Docker  │                          │
│  │Frontend  │Backend   │                          │
│  │(React)│    │(Node.js) │                          │
│  │Port   │    │Port 5001 │                          │
│  │3000   │    └────┬─────┘                          │
│  └──────┘         │                                 │
│                   ↓                                 │
│              ┌──────────┐                           │
│              │  Docker  │                           │
│              │PostgreSQL│                           │
│              │Port 5432 │                           │
│              └──────────┘                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 🛠️ Technology Stack

| Component | Technology | Port |
|-----------|-----------|------|
| **Web Server** | Nginx | 80, 443 |
| **Container** | Docker + Docker Compose | - |
| **Frontend** | React (Static Build) | 3000 |
| **Backend** | Node.js + Express | 5001 |
| **Database** | PostgreSQL | 5432 |
| **SSL** | Let's Encrypt (Certbot) | 443 |

---

## 🚀 Deployment Steps

### Phase 1: UpCloud VM Setup

#### Step 1.1: Create Virtual Machine

**Recommended Specs:**
```
- CPU: 2 vCPU
- RAM: 4 GB
- Storage: 50 GB SSD
- OS: Ubuntu 22.04 LTS
- Location: Singapore / Jakarta (closest to users)
```

**UpCloud Console Steps:**
1. Login ke UpCloud Console
2. Click **"Deploy a Server"**
3. Select **Location**: Singapore
4. Select **OS**: Ubuntu 22.04 LTS
5. Select **Plan**: 
   - CPU: 2 Core
   - RAM: 4 GB
   - Storage: 50 GB
6. Set **Hostname**: `documan-production`
7. Add **SSH Key** atau set root password
8. Click **"Deploy"**

**Note Public IP:**
```
Contoh: 94.237.XXX.XXX
```

#### Step 1.2: Initial Server Access

```bash
# SSH ke server menggunakan IP public
ssh root@94.237.XXX.XXX

# Update system
apt update && apt upgrade -y

# Set timezone
timedatectl set-timezone Asia/Jakarta

# Create non-root user (recommended)
adduser documan
usermod -aG sudo documan

# Switch to new user
su - documan
```

---

### Phase 2: Install Dependencies

#### Step 2.1: Install Docker

```bash
# Remove old versions (if any)
sudo apt remove docker docker-engine docker.io containerd runc

# Install prerequisites
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker run hello-world
```

#### Step 2.2: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

#### Step 2.3: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Allow in firewall
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

#### Step 2.4: Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d documan.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

---

### Phase 3: Upload Project Files

#### Step 3.1: Prepare Local Project

```bash
# Di local machine, create deployment package
cd document-management-system

# Remove node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules

# Remove test files (optional)
rm -rf backend/coverage
rm -rf backend/tests

# Create tarball
tar -czf documan-deploy.tar.gz \
    backend/ \
    frontend/ \
    docs/ \
    docker-compose.yml \
    .dockerignore \
    Dockerfile.backend \
    Dockerfile.frontend \
    nginx.conf \
    .env.production \
    README.md
```

#### Step 3.2: Upload to Server

**Option 1: SCP Upload**
```bash
# Upload tarball
scp documan-deploy.tar.gz documan@94.237.XXX.XXX:~/

# SSH to server
ssh documan@94.237.XXX.XXX

# Extract
mkdir -p ~/documan-app
tar -xzf documan-deploy.tar.gz -C ~/documan-app
cd ~/documan-app
```

**Option 2: Git Clone (Recommended)**
```bash
# On server
cd ~
git clone <your-repository-url> documan-app
cd documan-app
```

---

### Phase 4: Docker Configuration

#### Step 4.1: Create Dockerfile for Backend

Create `Dockerfile.backend`:

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY backend/ .

# Build stage (if needed)
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app ./

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/app.js"]
```

#### Step 4.2: Create Dockerfile for Frontend

Create `Dockerfile.frontend`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ .

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Step 4.3: Create Docker Compose File

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    container_name: documan-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-document_management_prod}
      POSTGRES_USER: ${DB_USER:-documan_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-your_secure_password}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    ports:
      - "5432:5432"
    networks:
      - documan-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-documan_user}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: documan-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 5001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-document_management_prod}
      DB_USER: ${DB_USER:-documan_user}
      DB_PASSWORD: ${DB_PASSWORD:-your_secure_password}
      JWT_SECRET: ${JWT_SECRET:-your_jwt_secret_key_here}
      MAX_FILE_SIZE: 10485760
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs
    ports:
      - "5001:5001"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - documan-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5001/health')"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend (Nginx serving static files)
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: documan-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - documan-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local

networks:
  documan-network:
    driver: bridge
```

#### Step 4.4: Create .env.production

Create `.env.production`:

```env
# Database Configuration
DB_NAME=document_management_prod
DB_USER=documan_user
DB_PASSWORD=UltraSecurePassword123!@#
DB_HOST=postgres
DB_PORT=5432

# JWT Secret (generate dengan: openssl rand -base64 32)
JWT_SECRET=your_generated_jwt_secret_here_min_32_chars

# Application
NODE_ENV=production
PORT=5001

# File Upload
MAX_FILE_SIZE=10485760

# CORS (set to your domain)
ALLOWED_ORIGINS=https://documan.yourdomain.com,http://94.237.XXX.XXX
```

#### Step 4.5: Create .dockerignore

Create `.dockerignore`:

```
# Node modules
**/node_modules
**/npm-debug.log

# Development files
**/.git
**/.gitignore
**/.env
**/.env.local
**/.DS_Store

# Test files
**/tests
**/coverage
**/*.test.js
**/*.spec.js

# Documentation
**/docs
**/*.md
!README.md

# Build artifacts
**/dist
**/build

# Uploads (will be mounted as volume)
**/uploads/*

# IDE
**/.vscode
**/.idea
```

---

### Phase 5: Nginx Configuration

#### Step 5.1: Create Nginx Config for Main Server

Create `/etc/nginx/sites-available/documan`:

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

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name 94.237.XXX.XXX documan.yourdomain.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 94.237.XXX.XXX documan.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/documan.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/documan.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Client max body size (for file uploads)
    client_max_body_size 15M;

    # API Proxy
    location /api {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # API Docs
    location /api-docs {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploaded Files
    location /uploads {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend (React App)
    location / {
        proxy_pass http://frontend_app;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

#### Step 5.2: Create Nginx Config for Frontend Container

Create `nginx-frontend.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Step 5.3: Enable Nginx Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/documan /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### Phase 6: Deploy Application

#### Step 6.1: Build and Start Containers

```bash
# Navigate to project directory
cd ~/documan-app

# Load environment variables
cp .env.production .env

# Build images
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Expected output:
# documan-postgres    ... Up (healthy)
# documan-backend     ... Up (healthy)
# documan-frontend    ... Up (healthy)
```

#### Step 6.2: Initialize Database

```bash
# Access backend container
docker exec -it documan-backend sh

# Run migrations (if using migrations)
# npm run migrate

# Create admin user
node src/scripts/createAdmin.js

# Exit container
exit
```

#### Step 6.3: Verify Services

```bash
# Check PostgreSQL
docker exec documan-postgres psql -U documan_user -d document_management_prod -c "SELECT NOW();"

# Check Backend API
curl http://localhost:5001/health

# Check Frontend
curl http://localhost:3000

# Check through Nginx
curl http://localhost/api/health
```

---

### Phase 7: Security Configuration

#### Step 7.1: Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Check status
sudo ufw status verbose
```

#### Step 7.2: Secure PostgreSQL

```bash
# Edit pg_hba.conf in container
docker exec -it documan-postgres sh

# PostgreSQL config already secured by Docker network isolation
# Only accessible from backend container via internal network
```

#### Step 7.3: Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Update .env with new secret
# Restart backend
docker-compose restart backend
```

#### Step 7.4: Setup Fail2Ban (Optional)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure for Nginx
sudo nano /etc/fail2ban/jail.local
```

Add:
```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban
```

---

### Phase 8: Monitoring & Logging

#### Step 8.1: Setup Log Rotation

Create `/etc/logrotate.d/documan`:

```
/home/documan/documan-app/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 documan documan
    sharedscripts
    postrotate
        docker-compose -f /home/documan/documan-app/docker-compose.yml restart backend
    endscript
}
```

#### Step 8.2: Setup Monitoring Script

Create `~/monitor.sh`:

```bash
#!/bin/bash

# Monitor DocuMan services
echo "=== DocuMan Health Check ==="
echo "Timestamp: $(date)"
echo ""

# Check Docker containers
echo "Docker Containers:"
docker-compose -f ~/documan-app/docker-compose.yml ps
echo ""

# Check Nginx
echo "Nginx Status:"
sudo systemctl status nginx --no-pager
echo ""

# Check disk space
echo "Disk Usage:"
df -h | grep -E '^/dev/'
echo ""

# Check memory
echo "Memory Usage:"
free -h
echo ""

# Check API health
echo "API Health:"
curl -s http://localhost:5001/health
echo ""
```

```bash
# Make executable
chmod +x ~/monitor.sh

# Add to crontab (run every hour)
crontab -e
# Add: 0 * * * * /home/documan/monitor.sh >> /home/documan/monitor.log 2>&1
```

---

### Phase 9: Backup Strategy

#### Step 9.1: Database Backup Script

Create `~/backup-db.sh`:

```bash
#!/bin/bash

# DocuMan Database Backup Script
BACKUP_DIR="/home/documan/documan-app/backup"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="documan_backup_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec documan-postgres pg_dump \
    -U documan_user \
    -d document_management_prod \
    > ${BACKUP_DIR}/${FILENAME}

# Compress backup
gzip ${BACKUP_DIR}/${FILENAME}

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${FILENAME}.gz"
```

```bash
# Make executable
chmod +x ~/backup-db.sh

# Schedule daily backup at 2 AM
crontab -e
# Add: 0 2 * * * /home/documan/backup-db.sh >> /home/documan/backup.log 2>&1
```

#### Step 9.2: Uploads Backup

```bash
# Sync uploads to backup location
rsync -av ~/documan-app/backend/uploads/ ~/backup/uploads/

# Or use cron for daily sync
# Add to crontab: 0 3 * * * rsync -av ~/documan-app/backend/uploads/ ~/backup/uploads/
```

---

### Phase 10: Domain Configuration (Optional)

#### Step 10.1: Point Domain to Server

In your domain registrar (e.g., Namecheap, GoDaddy):

```
Type: A Record
Name: @ or documan
Value: 94.237.XXX.XXX (your UpCloud IP)
TTL: 3600
```

#### Step 10.2: Update SSL Certificate

```bash
# Obtain SSL for domain
sudo certbot --nginx -d documan.yourdomain.com

# Update Nginx config with domain name
sudo nano /etc/nginx/sites-available/documan
# Change server_name to: documan.yourdomain.com

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔧 Maintenance Commands

### Docker Management

```bash
# View logs
docker-compose logs -f [service_name]

# Restart service
docker-compose restart [service_name]

# Stop all
docker-compose down

# Start all
docker-compose up -d

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d

# Remove all (DANGER - deletes data)
docker-compose down -v
```

### Database Management

```bash
# Access PostgreSQL shell
docker exec -it documan-postgres psql -U documan_user -d document_management_prod

# Backup database
docker exec documan-postgres pg_dump -U documan_user document_management_prod > backup.sql

# Restore database
docker exec -i documan-postgres psql -U documan_user -d document_management_prod < backup.sql

# Check database size
docker exec documan-postgres psql -U documan_user -c "SELECT pg_size_pretty(pg_database_size('document_management_prod'));"
```

### System Updates

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Clean up old images
docker system prune -a
```

---

## 🎯 Access Points

After deployment, your application will be accessible at:

| Service | URL | Port |
|---------|-----|------|
| **Frontend** | https://documan.yourdomain.com | 443 |
| **Backend API** | https://documan.yourdomain.com/api | 443 |
| **API Docs** | https://documan.yourdomain.com/api-docs | 443 |
| **Database** | Internal only (Docker network) | 5432 |

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs [service_name]

# Check if port is already in use
sudo lsof -i :5001
sudo lsof -i :5432

# Restart Docker
sudo systemctl restart docker
```

### Database connection error

```bash
# Check PostgreSQL is running
docker exec documan-postgres pg_isready

# Check environment variables
docker exec documan-backend env | grep DB_

# Check network
docker network inspect documan-network
```

### Nginx not working

```bash
# Check configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

---

## 📊 Performance Tuning

### PostgreSQL Optimization

Edit `docker-compose.yml` to add:

```yaml
postgres:
  command:
    - "postgres"
    - "-c"
    - "max_connections=200"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "effective_cache_size=1GB"
    - "-c"
    - "maintenance_work_mem=64MB"
    - "-c"
    - "checkpoint_completion_target=0.9"
    - "-c"
    - "wal_buffers=16MB"
    - "-c"
    - "default_statistics_target=100"
```

### Nginx Optimization

Add to `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
client_body_timeout 12;
client_header_timeout 12;
send_timeout 10;
```

---

## ✅ Deployment Checklist

- [ ] UpCloud VM created and accessible
- [ ] Docker + Docker Compose installed
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Project files uploaded
- [ ] Docker images built successfully
- [ ] Containers running (all healthy)
- [ ] Database initialized with admin user
- [ ] Nginx reverse proxy working
- [ ] Firewall configured (UFW)
- [ ] Monitoring scripts setup
- [ ] Backup scripts configured
- [ ] Domain pointed to server (if applicable)
- [ ] Application accessible from browser
- [ ] API endpoints tested
- [ ] File upload working
- [ ] Login/logout working
- [ ] All features tested in production

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Server IP:** _______________  
**Domain:** _______________

**Status:** ✅ Production Ready
