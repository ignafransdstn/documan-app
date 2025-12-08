# Quick Reference - Service Management

## 🎯 The 5-Second Quick Start

```bash
# Navigate to project
cd "/Volumes/DATA/JIMBARAN HIJAU/Project File/document-management-system"

# Start everything
./start-services.sh

# Check status
./status-services.sh

# Get public URL
./view-logs.sh cloudflare | grep "https://"
```

---

## 📋 Command Cheat Sheet

### Essential Commands
```bash
# Start all services
./start-services.sh

# Check everything is running
./status-services.sh

# View logs
./view-logs.sh all

# Stop everything
./stop-services.sh

# Restart everything
./restart-services.sh all
```

### Service-Specific
```bash
# Backend only
./restart-services.sh backend
./view-logs.sh backend 100

# Nginx only
./restart-services.sh nginx
./view-logs.sh nginx 50

# Cloudflare only
./restart-services.sh cloudflare
./view-logs.sh cloudflare | grep "https://"

# Socat only
./restart-services.sh socat
./view-logs.sh socat 50
```

### Monitoring & Maintenance
```bash
# Continuous monitoring (30s checks)
./health-monitor.sh 60 &

# View monitor logs
tail -f /tmp/health-monitor.log

# Stop monitoring
pkill -f health-monitor.sh

# Backup logs
./backup-logs.sh

# Setup automatic scheduling
./setup-cron.sh install

# View scheduled jobs
./setup-cron.sh list
```

---

## 🔴 Emergency Commands

### Service won't start?
```bash
# Check what's using the ports
lsof -i :5001
lsof -i :3000
lsof -i :5173

# Kill everything
pkill -f "node src/app.js"
pkill socat
pkill nginx
pkill cloudflared

# Try again
./start-services.sh
```

### Need to restart completely?
```bash
# Stop all
./stop-services.sh

# Wait 5 seconds
sleep 5

# Start all
./start-services.sh
```

### Can't access from public URL?
```bash
# Get new URL
./restart-services.sh cloudflare

# View logs
./view-logs.sh cloudflare

# Or check from browser
./status-services.sh
```

---

## 📊 Script Overview

| Command | Purpose | Time |
|---------|---------|------|
| `./start-services.sh` | Start all 4 services | ~11s |
| `./stop-services.sh` | Stop all services | ~10s |
| `./status-services.sh` | Health check + tests | ~5s |
| `./view-logs.sh all` | Show all logs | ~2s |
| `./restart-services.sh` | Restart services | ~15s |
| `./health-monitor.sh` | Background monitoring | Continuous |
| `./setup-cron.sh install` | Schedule jobs | One-time |
| `./backup-logs.sh` | Archive logs | ~10s |

---

## 🔍 Log File Locations

```bash
# View real-time
tail -f /tmp/backend.log              # Backend
tail -f /tmp/nginx.log                # Nginx
tail -f /tmp/socat.log                # Socat
tail -f /tmp/cloudflare-tunnel.log    # Cloudflare
tail -f /tmp/health-monitor.log       # Monitor

# View backups
ls -lh ./logs-backup/

# Extract backup
tar -xzf ./logs-backup/logs-*.tar.gz -C /tmp
```

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Port already in use | `pkill -f node; pkill socat; pkill nginx; pkill cloudflared` |
| Services won't start | Check logs: `./view-logs.sh backend 100` |
| Can't access URL | `./restart-services.sh cloudflare` (gets new URL) |
| Health monitor failing | `pkill -f health-monitor.sh && ./health-monitor.sh 60 &` |
| Database won't connect | Verify PostgreSQL running, check backend logs |

---

## ⏰ Cron Job Setup

```bash
# Install automatic scheduling
./setup-cron.sh install

# View installed jobs
./setup-cron.sh list

# Remove all jobs
./setup-cron.sh remove

# Manual edit
crontab -e
```

**Auto-scheduled**:
- 6:00 AM: Start services
- Every 10 min: Health check (auto-restart if needed)
- 11:00 PM: Backup logs
- Sunday 2:00 AM: Full system restart

---

## 💾 Backup & Recovery

```bash
# Create backup
./backup-logs.sh

# Keep backups > 30 days old
./backup-logs.sh 30

# List backups
ls -lh ./logs-backup/

# Extract specific backup
tar -xzf ./logs-backup/logs-20240115-143045.tar.gz -C /tmp

# View extracted logs
ls /tmp/documan-logs-20240115-143045/
```

---

## 🌐 Getting Public URL

```bash
# From status check
./status-services.sh | grep "🌐"

# From cloudflare logs
./view-logs.sh cloudflare | grep "https://"

# From log file directly
grep "https://" /tmp/cloudflare-tunnel.log | head -1
```

---

## 🔄 Daily Workflow

**Morning**:
```bash
./start-services.sh
./status-services.sh
```

**During Day**:
```bash
./view-logs.sh backend 50      # If debugging
./restart-services.sh backend  # After code changes
```

**End of Day**:
```bash
./backup-logs.sh
./stop-services.sh
```

---

## 📱 Run in Background

```bash
# Start services in background
nohup ./start-services.sh > startup.log 2>&1 &

# Health monitoring
./health-monitor.sh 30 &

# Check what's running
jobs -l

# Bring to foreground
fg %1

# Send to background
Ctrl+Z then type: bg
```

---

## 🔗 Service Ports

- **Backend**: Port 5001 (internal)
- **Nginx**: Port 3000 (reverse proxy)
- **Socat**: Port 5173 (forwarder)
- **Cloudflare**: HTTPS public tunnel

**Connections**:
```
User → Cloudflare (HTTPS) → Socat (5173) → Nginx (3000) → 
  ├─ Frontend (/)
  └─ API (5001)
```

---

## ✅ Verification Commands

```bash
# All services running?
./status-services.sh

# Specific port open?
lsof -i :5001

# Process running?
ps aux | grep "node src/app.js"

# Database connected?
./status-services.sh | grep "Database"

# API responding?
curl http://localhost:3000/api/users

# Frontend accessible?
curl http://localhost:3000 | head -1
```

---

## 🎓 Script Details

### start-services.sh
- Starts 4 services in order
- Verifies each before continuing
- Shows public URL
- Logs to /tmp

### stop-services.sh
- Stops in reverse order
- Verifies ports are free
- Safe error handling

### status-services.sh
- Port status check
- Process verification
- Database test
- API endpoint tests

### view-logs.sh
- Filter by service
- Set line count
- Auto-extract URL from Cloudflare

### restart-services.sh
- Stop + start services
- Useful for changes
- Shows new Cloudflare URL

### health-monitor.sh
- Continuous background check
- Auto-restarts failed services
- Real-time logging

### setup-cron.sh
- Schedule daily startup
- Auto health checks
- Automatic backups
- Weekly restarts

### backup-logs.sh
- Compress log files
- Auto cleanup old backups
- Statistics reporting

---

## 📞 Need Help?

```bash
# Show help for any script
./start-services.sh help
./stop-services.sh help
./status-services.sh help
./view-logs.sh help
./restart-services.sh help
./health-monitor.sh help
./setup-cron.sh help
./backup-logs.sh help
```

Or read the full guide:
```bash
cat SCRIPT-GUIDE.md
cat SCRIPTS-SUMMARY.md
```

---

**Project**: Document Management System
**Created**: December 3, 2024
**Status**: ✅ Ready for Production Use
