# Service Management Scripts Guide

Complete automation toolkit for managing Document Management System services on macOS.

---

## 📋 Overview

This project includes 8 comprehensive shell scripts for automated service lifecycle management:

| Script | Purpose | Status |
|--------|---------|--------|
| `start-services.sh` | ✅ Created | Start all services with health checks |
| `stop-services.sh` | ✅ Created | Gracefully stop all services |
| `status-services.sh` | ✅ Created | Real-time health check & API testing |
| `view-logs.sh` | ✅ Created | View and filter service logs |
| `restart-services.sh` | ✅ Created | Restart services with verification |
| `health-monitor.sh` | ✅ Created | Continuous monitoring with auto-restart |
| `setup-cron.sh` | ✅ Created | Schedule automatic service management |
| `backup-logs.sh` | ✅ Created | Archive and backup log files |

---

## 🚀 Quick Start

### 1. Make scripts executable
```bash
chmod +x *.sh
```

### 2. Start all services
```bash
./start-services.sh
```

### 3. Verify services are running
```bash
./status-services.sh
```

### 4. Get public URL
```bash
./view-logs.sh cloudflare
```

### 5. Stop services gracefully
```bash
./stop-services.sh
```

---

## 📖 Detailed Script Documentation

### start-services.sh
**Purpose**: Start all services in correct order with health verification

**Usage**:
```bash
./start-services.sh [service]
```

**Options**:
- `backend` - Start backend only
- `nginx` - Start nginx only
- `socat` - Start socat only
- `cloudflare` - Start cloudflare tunnel only
- `all` - Start all services (default)

**What it does**:
1. Starts Node.js backend on port 5001
2. Starts Nginx reverse proxy on port 3000
3. Starts Socat TCP forwarder on port 5173
4. Starts Cloudflare tunnel with HTTP/2
5. Verifies each service is running
6. Logs all operations to `/tmp/backend.log`, etc.

**Output**:
```
========================================
Document Management System - START
========================================

Starting Backend...
  ✅ Backend started (PID: 7770, Port 5001)
Starting Nginx...
  ✅ Nginx started (PID: 73499, Port 3000)
Starting Socat...
  ✅ Socat started (PID: 10082, Port 5173)
Starting Cloudflare Tunnel...
  ✅ Cloudflare Tunnel started
  🌐 Public URL: https://absence-cbs-humidity-addressed.trycloudflare.com
```

**Related logs**:
- Backend: `/tmp/backend.log`
- Nginx: `/tmp/nginx.log`
- Socat: `/tmp/socat.log`
- Cloudflare: `/tmp/cloudflare-tunnel.log`

---

### stop-services.sh
**Purpose**: Gracefully stop all services with shutdown verification

**Usage**:
```bash
./stop-services.sh [service]
```

**Options**:
- `backend` - Stop backend only
- `nginx` - Stop nginx only
- `socat` - Stop socat only
- `cloudflare` - Stop cloudflare tunnel only
- `all` - Stop all services (default)

**What it does**:
1. Stops Cloudflare tunnel first
2. Stops Socat forwarder
3. Stops Nginx
4. Stops Node.js backend
5. Verifies all processes are terminated
6. Confirms no ports remain in use

**Output**:
```
========================================
Document Management System - STOP
========================================

Stopping Cloudflare Tunnel...
  ✅ Cloudflare Tunnel stopped
Stopping Socat...
  ✅ Socat stopped
Stopping Nginx...
  ✅ Nginx stopped
Stopping Backend...
  ✅ Backend stopped

Port Verification:
  ✅ Port 5001 is free
  ✅ Port 3000 is free
  ✅ Port 5173 is free
```

---

### status-services.sh
**Purpose**: Real-time health check of all services with API testing

**Usage**:
```bash
./status-services.sh
```

**What it checks**:
1. **Port Status**: Verifies all 4 ports are in use
2. **Process Info**: Shows PID and resource usage
3. **Database Connection**: Tests PostgreSQL connectivity
4. **API Tests**: 
   - Frontend loading (checks for "DocuMan" title)
   - Login endpoint (admin credentials)
   - Users API endpoint
5. **Nginx Health**: Verifies reverse proxy
6. **Public URL**: Extracts Cloudflare tunnel URL

**Output**:
```
========================================
Document Management System - STATUS
========================================

Port Status:
  ✅ Port 5001 (Backend): LISTENING
  ✅ Port 3000 (Nginx): LISTENING
  ✅ Port 5173 (Socat): LISTENING
  ✅ Cloudflare: ACTIVE

Process Information:
  Backend PID: 7770 (Running for 45 minutes)
  Nginx PID: 73499, 78747
  Socat PID: 10082
  
Database Connection:
  ✅ Connected to documan_db
  ✅ User count: 5 users

API Tests:
  ✅ Frontend: Loading correctly
  ✅ Login: Working (admin user found)
  ✅ Users API: Responding

Public URL:
  🌐 https://absence-cbs-humidity-addressed.trycloudflare.com
```

---

### view-logs.sh
**Purpose**: View and filter service logs for troubleshooting

**Usage**:
```bash
./view-logs.sh [service] [lines]
```

**Options**:
- `backend` - View backend logs (default)
- `nginx` - View nginx logs
- `socat` - View socat logs
- `cloudflare` - View cloudflare logs
- `monitor` - View health monitor logs
- `all` - View all logs combined

**Parameters**:
- `lines`: Number of lines to display (default: 50)

**Examples**:
```bash
# View last 50 backend log lines
./view-logs.sh backend

# View last 100 nginx log lines
./view-logs.sh nginx 100

# View cloudflare logs (includes public URL)
./view-logs.sh cloudflare

# View all logs combined
./view-logs.sh all
```

**Features**:
- Automatic public URL extraction from Cloudflare logs
- Color-coded output by service
- Timestamp filtering
- Search capability

---

### restart-services.sh
**Purpose**: Restart services with verification (useful for applying changes)

**Usage**:
```bash
./restart-services.sh [service]
```

**Options**:
- `backend` - Restart backend only
- `nginx` - Restart nginx only
- `socat` - Restart socat only
- `cloudflare` - Restart cloudflare tunnel only
- `all` - Restart all services (default)

**What it does**:
1. Stops the service(s)
2. Waits for graceful shutdown
3. Starts service(s) again
4. Verifies successful restart
5. Shows new public URL if Cloudflare restarted

**Output**:
```
Restarting Backend...
  Stopping existing backend...
  Starting backend...
  ✅ Backend restarted

Restarting Cloudflare Tunnel...
  Stopping existing cloudflare...
  Starting cloudflare...
  ✅ Cloudflare Tunnel restarted
  🌐 Public URL: https://absence-cbs-humidity-addressed.trycloudflare.com
```

**Common use cases**:
- After code changes: `./restart-services.sh backend`
- After nginx config changes: `./restart-services.sh nginx`
- To get new Cloudflare URL: `./restart-services.sh cloudflare`
- Complete system restart: `./restart-services.sh all`

---

### health-monitor.sh
**Purpose**: Continuous monitoring with automatic restart on failure

**Usage**:
```bash
./health-monitor.sh [interval]
```

**Parameters**:
- `interval`: Check interval in seconds (default: 30)

**Examples**:
```bash
# Check every 30 seconds (default)
./health-monitor.sh

# Check every 60 seconds
./health-monitor.sh 60

# Check every 10 seconds (aggressive monitoring)
./health-monitor.sh 10
```

**What it monitors**:
1. **Backend**: Port 5001 + API responsiveness
2. **Nginx**: Port 3000 + HTTP 200 response
3. **Socat**: Port 5173 listening
4. **Cloudflare**: Process status

**Auto-restart logic**:
- Triggers restart after 2 consecutive failures
- Logs all state changes to `/tmp/health-monitor.log`
- Provides real-time status with timestamps

**Log file**:
```
/tmp/health-monitor.log
```

**Sample output**:
```
[2024-01-15 14:30:45] 🚀 Health monitor started (interval: 30s)
[2024-01-15 14:31:15] ✅ All services healthy
[2024-01-15 14:32:45] ❌ Backend check failed
[2024-01-15 14:33:15] ⚠️  Backend failed - attempting restart
[2024-01-15 14:33:20] ✅ Backend restored
```

**Running in background**:
```bash
# Start in background
./health-monitor.sh 60 &

# View logs in real-time
tail -f /tmp/health-monitor.log

# Stop monitoring
pkill -f "health-monitor.sh"
```

---

### setup-cron.sh
**Purpose**: Schedule automatic service management via cron jobs

**Usage**:
```bash
./setup-cron.sh [action]
```

**Actions**:
- `install` - Install cron jobs for automatic management
- `remove` - Remove all DocuMan cron jobs
- `list` - Show current DocuMan cron jobs
- `help` - Show help message (default)

**Installation**:
```bash
./setup-cron.sh install
```

**What gets scheduled**:
1. **6:00 AM Daily**: Start all services
2. **Every 10 minutes**: Health check
3. **11:00 PM Daily**: Backup logs
4. **Sunday 2:00 AM**: Full system restart

**Log files created**:
- `/tmp/cron-startup.log` - Startup results
- `/tmp/cron-healthcheck.log` - Health check results
- `/tmp/cron-backup.log` - Backup results
- `/tmp/cron-restart.log` - Restart results

**View installed jobs**:
```bash
./setup-cron.sh list
```

**Remove all jobs**:
```bash
./setup-cron.sh remove
```

**Manual crontab editing**:
```bash
crontab -e
```

**Example crontab with DocuMan jobs**:
```
# DocuMan - Daily startup at 6:00 AM
0 6 * * * cd /path/to/project && bash start-services.sh

# DocuMan - Health check every 10 minutes
*/10 * * * * cd /path/to/project && bash status-services.sh

# DocuMan - Backup logs daily at 11:00 PM
0 23 * * * cd /path/to/project && bash backup-logs.sh

# DocuMan - Weekly restart on Sunday at 2:00 AM
0 2 * * 0 cd /path/to/project && bash restart-services.sh all
```

---

### backup-logs.sh
**Purpose**: Archive and backup log files with automatic cleanup

**Usage**:
```bash
./backup-logs.sh [days]
```

**Parameters**:
- `days`: Keep backups newer than N days (default: 7)

**Examples**:
```bash
# Backup logs (keep backups > 7 days old)
./backup-logs.sh

# Keep backups > 30 days old
./backup-logs.sh 30

# Keep only recent backups (delete > 3 days old)
./backup-logs.sh 3
```

**What it backs up**:
- `/tmp/backend.log`
- `/tmp/nginx.log`
- `/tmp/socat.log`
- `/tmp/cloudflare-tunnel.log`
- `/tmp/health-monitor.log`
- All cron job logs
- Backend project logs

**Backup location**:
```
./logs-backup/logs-YYYYMMDD-HHMMSS.tar.gz
```

**Output**:
```
========================================
Log Backup and Archival
Timestamp: 20240115-143045
========================================

Backing up log files...
  📋 Backed up backend.log
  📋 Backed up nginx.log
  📋 Backed up socat.log
  📋 Backed up cloudflare-tunnel.log
  📋 Backed up health-monitor.log

✅ Collected 5 log file(s)

Compressing logs...
✅ Archive created: 2.3M
   Location: ./logs-backup/logs-20240115-143045.tar.gz

Cleaning up old backups (older than 7 days)...
  ℹ️  No old backups to delete

Backup Statistics:
  📦 Total backups: 3
  💾 Total size: 8.4M
  🆕 Newest backup: Jan 15 14:30
  🆙 Oldest backup: Jan 12 08:15
```

**Restore from backup**:
```bash
# Extract backup
tar -xzf ./logs-backup/logs-20240115-143045.tar.gz -C /tmp

# View extracted logs
ls -la /tmp/documan-logs-20240115-143045/
```

---

## 🔄 Typical Workflow

### Morning startup
```bash
# 1. Start all services
./start-services.sh

# 2. Verify everything is running
./status-services.sh

# 3. Get public URL
./view-logs.sh cloudflare | grep "https://"
```

### During development
```bash
# 1. View logs while working
./view-logs.sh backend 100

# 2. Restart backend after code changes
./restart-services.sh backend

# 3. Check health
./status-services.sh
```

### Monitoring
```bash
# 1. Start health monitor in background
./health-monitor.sh 60 &

# 2. Monitor logs in real-time
tail -f /tmp/health-monitor.log
```

### End of day
```bash
# 1. Backup logs
./backup-logs.sh

# 2. Stop services
./stop-services.sh
```

### Scheduled operations
```bash
# 1. Install cron jobs
./setup-cron.sh install

# 2. System automatically handles startup/health/backup
# 3. Check results in cron log files
```

---

## 🔐 Security Considerations

### Port Access
- Backend (5001): Internal only, accessed via Nginx
- Nginx (3000): Local reverse proxy
- Socat (5173): Local port forwarder
- Public access: Through Cloudflare Tunnel only

### Log Files
- Stored in `/tmp` (cleared on system restart)
- Backups in `./logs-backup/` (persistent)
- Include timestamps for audit trail
- Consider logs for sensitive information

### Process Management
- Scripts use `pkill` and `killall` for graceful shutdown
- Verification checks ensure successful start/stop
- Error handling prevents orphaned processes

---

## 🐛 Troubleshooting

### Services won't start
```bash
# Check what's using the ports
lsof -i :5001
lsof -i :3000
lsof -i :5173

# Kill existing processes if needed
pkill -f "node src/app.js"
pkill socat
nginx -s stop

# Then restart
./start-services.sh
```

### One service keeps restarting
```bash
# View its logs
./view-logs.sh [service] 100

# Check for errors
grep -i "error" /tmp/[service].log

# Restart just that service
./restart-services.sh [service]
```

### Can't access from public URL
```bash
# View Cloudflare tunnel status
./view-logs.sh cloudflare

# Check if Socat is forwarding correctly
./status-services.sh

# Restart cloudflare tunnel (gets new URL)
./restart-services.sh cloudflare
```

### Health monitor not running
```bash
# Check if it's already running
ps aux | grep health-monitor

# View its log file
tail -f /tmp/health-monitor.log

# Stop and restart
pkill -f health-monitor.sh
./health-monitor.sh 60 &
```

---

## 📊 Performance Tips

### Optimize check interval
```bash
# Every 10 seconds: Maximum responsiveness
./health-monitor.sh 10

# Every 30 seconds: Balanced approach (default)
./health-monitor.sh 30

# Every 60 seconds: Minimal resource usage
./health-monitor.sh 60
```

### Backup frequency
```bash
# Daily backup (cron recommended)
./backup-logs.sh 7

# Weekly cleanup (keep 30 days)
./backup-logs.sh 30

# Monthly cleanup (keep 90 days)
./backup-logs.sh 90
```

---

## 📝 Service Architecture

```
┌─────────────────────────────────────┐
│      User Request (Public)          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Cloudflare Tunnel (HTTP/2)        │
│   Port 5173                         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Socat Forwarder (5173 → 3000)    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Nginx Reverse Proxy               │
│   Port 3000                         │
├──────────────┬──────────────────────┤
│              │                      │
│    /         │    /api             │
│    │         │    │                │
│    ▼         │    ▼                │
│  Frontend    │  Backend            │
│  (React)     │  (Node.js 5001)    │
│    │         │    │                │
│    └─────────┴────┘                │
│              │                      │
│         PostgreSQL                  │
│         Database                    │
└─────────────────────────────────────┘
```

---

## 📞 Support

For issues or questions:
1. Check relevant log file: `./view-logs.sh [service]`
2. Run health check: `./status-services.sh`
3. Review this guide's troubleshooting section
4. Check backend documentation: `docs/BACKEND-DOCUMENTATION.md`

---

**Last updated**: January 2024
**Version**: 1.0
**Project**: Document Management System (DocuMan)
