#!/bin/bash

# Document Management System - Cron Job Setup Script
# Sets up automatic service management via cron jobs
# Usage: ./setup-cron.sh [action]
# Actions: install, remove, list, help

ACTION=${1:-help}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRON_ID="documan-services"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Cron Job Setup for DocuMan Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to install cron jobs
install_cron() {
    echo -e "${YELLOW}Installing cron jobs...${NC}"
    echo ""
    
    # Get current crontab (if exists)
    crontab -l 2>/dev/null > /tmp/crontab.tmp || true
    
    # Check if jobs already exist
    if grep -q "# $CRON_ID" /tmp/crontab.tmp 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Cron jobs already exist, skipping${NC}"
        rm -f /tmp/crontab.tmp
        return
    fi
    
    # Add cron jobs
    cat >> /tmp/crontab.tmp << EOF

# $CRON_ID - Daily startup at 6:00 AM
0 6 * * * cd $PROJECT_DIR && bash start-services.sh >> /tmp/cron-startup.log 2>&1

# $CRON_ID - Health check every 10 minutes
*/10 * * * * cd $PROJECT_DIR && bash status-services.sh >> /tmp/cron-healthcheck.log 2>&1

# $CRON_ID - Backup logs daily at 11:00 PM
0 23 * * * cd $PROJECT_DIR && bash backup-logs.sh >> /tmp/cron-backup.log 2>&1

# $CRON_ID - Weekly restart on Sunday at 2:00 AM
0 2 * * 0 cd $PROJECT_DIR && bash restart-services.sh all >> /tmp/cron-restart.log 2>&1
EOF
    
    # Install new crontab
    crontab /tmp/crontab.tmp
    rm -f /tmp/crontab.tmp
    
    echo -e "${GREEN}✅ Cron jobs installed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Scheduled jobs:${NC}"
    echo "  🕐 Daily startup: 6:00 AM"
    echo "  🔍 Health check: Every 10 minutes"
    echo "  💾 Backup logs: 11:00 PM daily"
    echo "  🔄 Weekly restart: Sunday 2:00 AM"
}

# Function to remove cron jobs
remove_cron() {
    echo -e "${YELLOW}Removing cron jobs...${NC}"
    echo ""
    
    crontab -l 2>/dev/null > /tmp/crontab.tmp || {
        echo -e "${YELLOW}No crontab found${NC}"
        return
    }
    
    if grep -q "# $CRON_ID" /tmp/crontab.tmp; then
        # Remove lines containing CRON_ID
        grep -v "# $CRON_ID" /tmp/crontab.tmp > /tmp/crontab.new
        crontab /tmp/crontab.new
        echo -e "${GREEN}✅ Cron jobs removed successfully!${NC}"
    else
        echo -e "${YELLOW}No DocuMan cron jobs found${NC}"
    fi
    
    rm -f /tmp/crontab.tmp /tmp/crontab.new
}

# Function to list cron jobs
list_cron() {
    echo -e "${BLUE}Current cron jobs for DocuMan:${NC}"
    echo ""
    
    if crontab -l 2>/dev/null | grep -q "# $CRON_ID"; then
        crontab -l 2>/dev/null | grep "# $CRON_ID" -A 1 | grep -v "^--$"
        echo ""
    else
        echo -e "${YELLOW}No DocuMan cron jobs found${NC}"
        echo ""
    fi
    
    echo -e "${BLUE}All cron jobs:${NC}"
    crontab -l 2>/dev/null || echo -e "${YELLOW}No crontab found${NC}"
}

# Function to show help
show_help() {
    echo -e "${BLUE}Usage: ./setup-cron.sh [action]${NC}"
    echo ""
    echo "Actions:"
    echo "  install - Install cron jobs for automatic service management"
    echo "  remove  - Remove all DocuMan cron jobs"
    echo "  list    - List current cron jobs"
    echo "  help    - Show this help message"
    echo ""
    echo -e "${BLUE}Automatic Jobs:${NC}"
    echo "  • Daily startup at 6:00 AM"
    echo "  • Health check every 10 minutes"
    echo "  • Log backup daily at 11:00 PM"
    echo "  • Weekly full restart on Sunday at 2:00 AM"
    echo ""
    echo -e "${BLUE}Log Files:${NC}"
    echo "  • Startup logs: /tmp/cron-startup.log"
    echo "  • Health check logs: /tmp/cron-healthcheck.log"
    echo "  • Backup logs: /tmp/cron-backup.log"
    echo "  • Restart logs: /tmp/cron-restart.log"
    echo ""
}

case "$ACTION" in
    install)
        install_cron
        ;;
    remove)
        remove_cron
        ;;
    list)
        list_cron
        ;;
    help|*)
        show_help
        ;;
esac

echo ""
