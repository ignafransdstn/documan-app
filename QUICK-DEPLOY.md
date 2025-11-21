# 🚀 Quick Deployment Guide - DocuMan to UpCloud

## 📋 Pre-Deployment Checklist

- [ ] UpCloud account ready
- [ ] Domain name (optional but recommended)
- [ ] SSH key for server access
- [ ] All project files ready
- [ ] Dokumentasi telah dibaca

---

## ⚡ Express Deployment (15 Minutes)

### Step 1: Create UpCloud VM (3 min)

```bash
# Login to UpCloud Console
# https://hub.upcloud.com/

# Create Server:
- Location: Singapore
- OS: Ubuntu 22.04 LTS
- Plan: 2 CPU, 4 GB RAM, 50 GB SSD
- Hostname: documan-production
- Add SSH Key

# Note Public IP: 94.237.XXX.XXX
```

### Step 2: Initial Server Setup (5 min)

```bash
# SSH to server
ssh root@94.237.XXX.XXX

# Run quick install
curl -fsSL https://raw.githubusercontent.com/your-repo/install.sh | bash

# Or manual install:
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
apt install -y nginx
```

### Step 3: Upload Project (2 min)

**From Local Machine:**
```bash
cd document-management-system

# Create deployment archive
tar -czf documan-deploy.tar.gz \
    backend/ frontend/ docs/ \
    docker-compose.yml \
    Dockerfile.backend Dockerfile.frontend \
    nginx-frontend.conf \
    .env.production \
    deploy.sh backup-db.sh monitor.sh \
    README.md

# Upload to server
scp documan-deploy.tar.gz root@94.237.XXX.XXX:/root/

# SSH to server and extract
ssh root@94.237.XXX.XXX
mkdir -p /opt/documan
tar -xzf documan-deploy.tar.gz -C /opt/documan
cd /opt/documan
```

### Step 4: Configure Environment (2 min)

```bash
# Edit .env file
cp .env.production .env
nano .env

# Update these values:
# DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
# JWT_SECRET=YOUR_JWT_SECRET_HERE (generate with: openssl rand -base64 32)
# ALLOWED_ORIGINS=http://94.237.XXX.XXX
```

### Step 5: Deploy Application (3 min)

```bash
# Make scripts executable
chmod +x *.sh

# Deploy
./deploy.sh

# Wait for containers to be healthy
docker-compose ps

# Expected output:
# documan-postgres    ... Up (healthy)
# documan-backend     ... Up (healthy)
# documan-frontend    ... Up (healthy)
```

### Step 6: Configure Nginx (Optional - for domain)

**Create `/etc/nginx/sites-available/documan`:**
```nginx
server {
    listen 80;
    server_name 94.237.XXX.XXX;

    location /api {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/documan /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## 🌐 Access Your Application

| Service | URL |
|---------|-----|
| **Frontend** | http://94.237.XXX.XXX:3000 |
| **Backend API** | http://94.237.XXX.XXX:5001/api |
| **API Docs** | http://94.237.XXX.XXX:5001/api-docs |
| **With Nginx** | http://94.237.XXX.XXX |

**Default Login:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT**: Change admin password immediately!

---

## 🛠️ Common Commands

### Service Management
```bash
# View logs
docker-compose logs -f

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Check health
./monitor.sh
```

### Database Management
```bash
# Backup database
./backup-db.sh

# Access PostgreSQL
docker exec -it documan-postgres psql -U documan_user -d document_management_prod

# View database size
docker exec documan-postgres psql -U documan_user -c \
  "SELECT pg_size_pretty(pg_database_size('document_management_prod'));"
```

### Logs
```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100

# Search for errors
docker-compose logs | grep -i error
```

### Updates
```bash
# Pull latest changes (if using Git)
git pull

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Clean old images
docker system prune -a
```

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Generate secure JWT_SECRET (32+ characters)
- [ ] Set strong DB_PASSWORD
- [ ] Configure UFW firewall
- [ ] Setup SSL certificate (Let's Encrypt)
- [ ] Update ALLOWED_ORIGINS to your domain
- [ ] Disable SSH password login (use keys only)
- [ ] Setup fail2ban (optional)
- [ ] Configure automatic backups

### Enable Firewall
```bash
ufw enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status
```

### SSL Certificate (with domain)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d documan.yourdomain.com
```

---

## 📊 Monitoring

### Daily Health Check
```bash
# Run monitor
./monitor.sh

# Setup cron (runs hourly)
crontab -e
# Add: 0 * * * * /opt/documan/monitor.sh >> /opt/documan/monitor.log 2>&1
```

### Daily Backup
```bash
# Setup backup cron (runs daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/documan/backup-db.sh >> /opt/documan/backup.log 2>&1
```

### Resource Monitoring
```bash
# Check disk space
df -h

# Check memory
free -h

# Check Docker stats
docker stats

# Check container health
docker ps
```

---

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs [service_name]

# Check if ports are in use
lsof -i :5001
lsof -i :5432

# Restart Docker
systemctl restart docker
```

### Database Connection Error
```bash
# Check PostgreSQL
docker exec documan-postgres pg_isready

# Check environment variables
docker exec documan-backend env | grep DB_

# Restart backend
docker-compose restart backend
```

### Frontend Not Loading
```bash
# Check container
docker ps | grep frontend

# View logs
docker-compose logs frontend

# Rebuild
docker-compose build frontend --no-cache
docker-compose up -d
```

### Can't Access from Browser
```bash
# Check Nginx
systemctl status nginx
nginx -t

# Check firewall
ufw status

# Check if containers are running
docker-compose ps
```

---

## 🔄 Rollback Procedure

```bash
# Stop current containers
docker-compose down

# Restore database backup
docker exec -i documan-postgres psql -U documan_user -d document_management_prod \
  < backup/documan_backup_YYYYMMDD_HHMMSS.sql

# Checkout previous version (if using Git)
git checkout <previous-commit>

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d
```

---

## 📞 Support & Resources

- **Documentation**: `/opt/documan/docs/`
- **Deployment Guide**: `DEPLOYMENT-UPCLOUD.md`
- **API Documentation**: http://your-ip:5001/api-docs
- **GitHub Issues**: (your repository issues page)

---

## 📈 Performance Tips

1. **Database Optimization**
   - Run VACUUM ANALYZE weekly
   - Monitor query performance
   - Set up connection pooling

2. **Nginx Caching**
   - Enable gzip compression
   - Set cache headers for static files
   - Use CDN for assets (optional)

3. **Docker Optimization**
   - Limit container resources
   - Use Alpine images
   - Clean old images regularly

4. **Backup Strategy**
   - Daily automated backups
   - Offsite backup storage
   - Test restore procedure

---

## ✅ Post-Deployment Tasks

- [ ] Change admin password
- [ ] Test all features
- [ ] Upload test documents
- [ ] Create test users
- [ ] Test file download
- [ ] Verify map integration
- [ ] Test from mobile device
- [ ] Setup monitoring alerts
- [ ] Configure automated backups
- [ ] Document custom configurations
- [ ] Train users
- [ ] Prepare support documentation

---

**Deployment Time:** ~15 minutes  
**Maintenance:** 15 minutes/week  
**Monitoring:** Automated  

**Status:** ✅ Production Ready
