# 📚 Documentation Index

**Document Management System (DocuMan)**
*Complete service automation toolkit*

---

## 🚀 Start Here

### For the first time:
1. Read: **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** (5 min read)
2. Execute: `./start-services.sh`
3. Verify: `./status-services.sh`

### For daily use:
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Cheat sheet with all commands
- `./status-services.sh` - Check if everything is running
- `./view-logs.sh all` - View logs when debugging

---

## 📖 Complete Documentation

### Service Management Scripts
- **[SCRIPT-GUIDE.md](SCRIPT-GUIDE.md)** - 500+ line comprehensive guide
  - Detailed documentation for all 8 scripts
  - Usage examples and parameter explanations
  - Troubleshooting section
  - Service architecture diagram

- **[SCRIPTS-SUMMARY.md](SCRIPTS-SUMMARY.md)** - Overview and setup
  - New scripts summary
  - Service architecture
  - Common use cases
  - Error handling overview

- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Command cheat sheet
  - Essential commands
  - Emergency procedures
  - Log file locations
  - Common issues & fixes

### System Architecture
- **[SYSTEM-TOPOLOGY.md](SYSTEM-TOPOLOGY.md)** - Current development setup
  - 5 Mermaid diagrams
  - Network flow architecture
  - Component mapping
  - Technology stack

- **[SYSTEM-DOCUMENTATION.md](SYSTEM-DOCUMENTATION.md)** - System reference
  - Complete system overview
  - User management & roles
  - API documentation
  - Deployment procedures
  - Troubleshooting guide

- **[PRODUCTION-TOPOLOGY.md](PRODUCTION-TOPOLOGY.md)** - Production deployment
  - Docker-based deployment (7 diagrams)
  - Multi-container setup
  - Monitoring stack
  - Backup & recovery

- **[ENTERPRISE-TOPOLOGY-PLAN.md](ENTERPRISE-TOPOLOGY-PLAN.md)** - Enterprise infrastructure
  - Multi-environment setup (15 diagrams)
  - On-premise servers deployment
  - NAS backup integration
  - Monitoring infrastructure
  - Production→Test→Dev cloning strategy

### Business & Feature Documentation
- **[DESCRIPTION-FEATURE.md](DESCRIPTION-FEATURE.md)** - Feature overview
- **[BUSINESS-LOGIC.md](docs/BUSINESS-LOGIC.md)** - Business rules
- **[DATABASE-SCHEMA.md](docs/DATABASE-SCHEMA.md)** - Database structure

### API & Development
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - REST API reference
- **[BACKEND-DOCUMENTATION.md](docs/BACKEND-DOCUMENTATION.md)** - Backend guide
- **[FRONTEND-DOCUMENTATION.md](docs/FRONTEND-DOCUMENTATION.md)** - Frontend guide

### Deployment & Operations
- **[DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)** - Deployment procedures
- **[DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)** - Deployment overview
- **[DEPLOYMENT-UPCLOUD.md](DEPLOYMENT-UPCLOUD.md)** - UpCloud deployment
- **[UPCLOUD-DEPLOYMENT-GUIDE.md](UPCLOUD-DEPLOYMENT-GUIDE.md)** - Detailed UpCloud guide
- **[QUICK-DEPLOY.md](QUICK-DEPLOY.md)** - Quick deployment checklist

### Testing & Quality
- **[FINAL-TEST-REPORT.md](FINAL-TEST-REPORT.md)** - Test results
- **[TEST-REPORT.md](TEST-REPORT.md)** - Detailed test report
- **[ACTIVITY-LOGGING-SUMMARY.md](ACTIVITY-LOGGING-SUMMARY.md)** - Activity logging
- **[ACTIVITY-UI-ENHANCEMENT.md](ACTIVITY-UI-ENHANCEMENT.md)** - UI enhancements

---

## 🛠️ Available Scripts

### Core Service Management (4)
```bash
./start-services.sh      # Start all services with health checks
./stop-services.sh       # Stop all services gracefully
./status-services.sh     # Health check & API tests
./view-logs.sh [service] # View service logs
```

### Advanced Operations (4)
```bash
./restart-services.sh    # Restart services with verification
./health-monitor.sh      # Continuous monitoring with auto-restart
./setup-cron.sh          # Schedule automatic service management
./backup-logs.sh         # Archive and backup log files
```

---

## 📋 Quick Command Reference

### Start & Stop
```bash
./start-services.sh      # Everything
./stop-services.sh       # Everything
./restart-services.sh    # Everything
```

### Check Status
```bash
./status-services.sh     # Full health check
./view-logs.sh all       # All logs
./view-logs.sh backend   # Backend logs only
```

### Monitoring
```bash
./health-monitor.sh 60   # Start monitoring (60s intervals)
tail -f /tmp/health-monitor.log  # View monitor logs
pkill -f health-monitor.sh       # Stop monitoring
```

### Automation
```bash
./setup-cron.sh install  # Schedule automated jobs
./setup-cron.sh list     # View scheduled jobs
./setup-cron.sh remove   # Remove scheduled jobs
```

### Maintenance
```bash
./backup-logs.sh         # Backup all logs
./backup-logs.sh 30      # Keep backups > 30 days
```

---

## 🌍 Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Backend | 5001 | Node.js Express API |
| Nginx | 3000 | Reverse proxy & static files |
| Socat | 5173 | TCP forwarder for tunnel |
| Cloudflare | HTTPS | Public access via tunnel |
| PostgreSQL | 5432 | Database (internal) |

---

## 📂 Project Structure

```
document-management-system/
├── backend/                    # Node.js backend
│   ├── src/
│   ├── config/
│   ├── models/
│   ├── routes/
│   └── tests/
├── frontend/                   # React frontend
│   ├── src/
│   ├── public/
│   └── dist/ (production build)
├── nginx/                      # Nginx configuration
├── docs/                       # Documentation
├── logs-backup/               # Log archives
│
├── *.sh                        # Service management scripts
├── *.md                        # Documentation files
├── docker-compose.yml          # Docker setup
└── package.json               # Dependencies
```

---

## 🔄 Typical Workflow

### Morning
```bash
cd "/Volumes/DATA/JIMBARAN HIJAU/Project File/document-management-system"
./start-services.sh
./status-services.sh
# Get public URL from logs
./view-logs.sh cloudflare | grep "https://"
```

### During Development
```bash
./view-logs.sh backend 100    # Debug issues
./restart-services.sh backend # After code changes
./status-services.sh           # Verify everything
```

### Monitoring
```bash
./health-monitor.sh 30 &      # Start background monitor
tail -f /tmp/health-monitor.log # Watch real-time
```

### End of Day
```bash
./backup-logs.sh              # Archive logs
./stop-services.sh            # Stop services
```

---

## 🔐 Credentials

**Default Admin Account**:
- Username: `admin`
- Password: `admin123`

**Database**:
- Database: `documan_db`
- Host: `localhost`
- Port: `5432`

---

## 🌐 Public Access

**Current Setup**: Cloudflare Quick Tunnel (free, temporary URLs)

**Get current URL**:
```bash
./view-logs.sh cloudflare | grep "https://"
```

**URL changes on restart** - This is normal for Quick Tunnel.

**For permanent URL**: Upgrade to named Cloudflare Tunnel (requires account setup).

---

## 🔗 Service Architecture

```
┌─────────────────────────────┐
│   User (Browser/API)        │
└────────────┬────────────────┘
             │ HTTPS/HTTP2
             ▼
┌─────────────────────────────┐
│  Cloudflare Tunnel Port 5173│
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Socat Forwarder 5173→3000  │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Nginx Reverse Proxy 3000   │
├─────────────┬───────────────┤
│    /        │     /api      │
│    │        │     │         │
│ Frontend    │  Backend      │
│ (React)     │  (Node 5001)  │
└─────────────┴───────────────┘
             │
             ▼
        PostgreSQL
        Database
```

---

## 🐛 Troubleshooting

### Services won't start?
See: **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** → Emergency Commands

### Need to debug?
See: **[SCRIPT-GUIDE.md](SCRIPT-GUIDE.md)** → Troubleshooting section

### System not responding?
1. Check status: `./status-services.sh`
2. View logs: `./view-logs.sh all`
3. Restart: `./restart-services.sh all`

### Can't access from public URL?
1. Check tunnel: `./view-logs.sh cloudflare`
2. Restart tunnel: `./restart-services.sh cloudflare`
3. Get new URL: `./view-logs.sh cloudflare | grep "https://"`

---

## 📞 Documentation Map

| Need | Read | Command |
|------|------|---------|
| Quick start | QUICK-REFERENCE.md | `./start-services.sh` |
| Full details | SCRIPT-GUIDE.md | `./status-services.sh` |
| System overview | SYSTEM-DOCUMENTATION.md | `./view-logs.sh all` |
| Production setup | PRODUCTION-TOPOLOGY.md | `./backup-logs.sh` |
| Enterprise plan | ENTERPRISE-TOPOLOGY-PLAN.md | `./health-monitor.sh 60` |
| API reference | docs/API_DOCUMENTATION.md | View logs |
| Deployment | DEPLOYMENT-GUIDE.md | See QUICK-DEPLOY.md |

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] All scripts are executable: `ls -l *.sh`
- [ ] Start services: `./start-services.sh`
- [ ] Check all running: `./status-services.sh`
- [ ] View logs: `./view-logs.sh all`
- [ ] Get public URL: `./view-logs.sh cloudflare | grep "https://"`
- [ ] Access URL in browser
- [ ] Test login (admin/admin123)
- [ ] Restart services: `./restart-services.sh backend`
- [ ] Setup cron: `./setup-cron.sh install`

---

## 🚀 Next Steps

1. **Immediate**: Read [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
2. **Setup**: Run `./start-services.sh`
3. **Verify**: Run `./status-services.sh`
4. **Automate** (optional): Run `./setup-cron.sh install`
5. **Deploy** (future): Use PRODUCTION-TOPOLOGY.md or ENTERPRISE-TOPOLOGY-PLAN.md

---

## 📊 Statistics

- **Scripts**: 8 (1,090+ lines total)
- **Documentation**: 20+ markdown files
- **Diagrams**: 27+ Mermaid diagrams
- **Coverage**: Complete service lifecycle automation
- **Status**: ✅ Production Ready

---

**Last Updated**: December 3, 2024
**Version**: 1.0
**Project**: Document Management System (DocuMan)
**Status**: ✅ Complete & Ready for Use
