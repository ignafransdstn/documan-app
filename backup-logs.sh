#!/bin/bash

# Document Management System - Backup Logs Script
# Archives and compresses log files for storage and archival
# Usage: ./backup-logs.sh [days]
# days: Keep logs newer than N days (default: 7)

DAYS=${1:-7}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${PROJECT_DIR}/logs-backup"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/logs-${TIMESTAMP}.tar.gz"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Log Backup and Archival${NC}"
echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create backup directory
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo -e "${GREEN}✅ Created backup directory: $BACKUP_DIR${NC}"
fi

# Function to backup logs
backup_logs() {
    echo -e "${YELLOW}Backing up log files...${NC}"
    echo ""
    
    # Create temporary directory for logs
    TEMP_LOG_DIR="/tmp/documan-logs-${TIMESTAMP}"
    mkdir -p "$TEMP_LOG_DIR"
    
    # Copy log files
    local log_count=0
    
    if [ -f /tmp/backend.log ]; then
        cp /tmp/backend.log "$TEMP_LOG_DIR/"
        log_count=$((log_count + 1))
        echo "  📋 Backed up backend.log"
    fi
    
    if [ -f /tmp/nginx.log ]; then
        cp /tmp/nginx.log "$TEMP_LOG_DIR/"
        log_count=$((log_count + 1))
        echo "  📋 Backed up nginx.log"
    fi
    
    if [ -f /tmp/socat.log ]; then
        cp /tmp/socat.log "$TEMP_LOG_DIR/"
        log_count=$((log_count + 1))
        echo "  📋 Backed up socat.log"
    fi
    
    if [ -f /tmp/cloudflare-tunnel.log ]; then
        cp /tmp/cloudflare-tunnel.log "$TEMP_LOG_DIR/"
        log_count=$((log_count + 1))
        echo "  📋 Backed up cloudflare-tunnel.log"
    fi
    
    if [ -f /tmp/health-monitor.log ]; then
        cp /tmp/health-monitor.log "$TEMP_LOG_DIR/"
        log_count=$((log_count + 1))
        echo "  📋 Backed up health-monitor.log"
    fi
    
    # Backup cron logs
    if [ -f /tmp/cron-startup.log ]; then
        cp /tmp/cron-startup.log "$TEMP_LOG_DIR/"
        log_count=$((log_count + 1))
        echo "  📋 Backed up cron-startup.log"
    fi
    
    if [ -f /tmp/cron-healthcheck.log ]; then
        cp /tmp/cron-healthcheck.log "$TEMP_LOG_DIR/"
        log_count=$((log_count + 1))
        echo "  📋 Backed up cron-healthcheck.log"
    fi
    
    if [ -f /tmp/cron-restart.log ]; then
        cp /tmp/cron-restart.log "$TEMP_LOG_DIR/"
        log_count=$((log_count + 1))
        echo "  📋 Backed up cron-restart.log"
    fi
    
    if [ -f /tmp/cron-backup.log ]; then
        cp /tmp/cron-backup.log "$TEMP_LOG_DIR/"
        log_count=$((log_count + 1))
        echo "  📋 Backed up cron-backup.log"
    fi
    
    if [ -d "$PROJECT_DIR/backend/logs" ]; then
        cp -r "$PROJECT_DIR/backend/logs" "$TEMP_LOG_DIR/backend-logs" 2>/dev/null || true
        log_count=$((log_count + 1))
        echo "  📋 Backed up backend project logs"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Collected $log_count log file(s)${NC}"
    echo ""
    
    if [ $log_count -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No log files found to backup${NC}"
        rm -rf "$TEMP_LOG_DIR"
        return 1
    fi
    
    # Create tar.gz archive
    echo -e "${YELLOW}Compressing logs...${NC}"
    tar -czf "$BACKUP_FILE" -C /tmp "documan-logs-${TIMESTAMP}" 2>/dev/null
    
    if [ -f "$BACKUP_FILE" ]; then
        local file_size=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✅ Archive created: $file_size${NC}"
        echo "   Location: $BACKUP_FILE"
    else
        echo -e "${RED}❌ Failed to create archive${NC}"
        rm -rf "$TEMP_LOG_DIR"
        return 1
    fi
    
    # Clean up temporary directory
    rm -rf "$TEMP_LOG_DIR"
    
    return 0
}

# Function to cleanup old backups
cleanup_old_backups() {
    echo ""
    echo -e "${YELLOW}Cleaning up old backups (older than ${DAYS} days)...${NC}"
    
    local deleted=0
    while IFS= read -r file; do
        rm -f "$file"
        deleted=$((deleted + 1))
        echo "  🗑️  Deleted: $(basename $file)"
    done < <(find "$BACKUP_DIR" -name "logs-*.tar.gz" -mtime +$DAYS 2>/dev/null)
    
    if [ $deleted -eq 0 ]; then
        echo "  ℹ️  No old backups to delete"
    else
        echo -e "${GREEN}✅ Deleted $deleted old backup(s)${NC}"
    fi
}

# Function to show backup statistics
show_statistics() {
    echo ""
    echo -e "${BLUE}Backup Statistics:${NC}"
    
    local backup_count=$(find "$BACKUP_DIR" -name "logs-*.tar.gz" 2>/dev/null | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    local oldest=$(find "$BACKUP_DIR" -name "logs-*.tar.gz" -exec ls -lt {} + 2>/dev/null | tail -1 | awk '{print $6, $7, $8}' 2>/dev/null)
    local newest=$(find "$BACKUP_DIR" -name "logs-*.tar.gz" -exec ls -lt {} + 2>/dev/null | head -1 | awk '{print $6, $7, $8}' 2>/dev/null)
    
    echo "  📦 Total backups: $backup_count"
    echo "  💾 Total size: $total_size"
    if [ -n "$newest" ]; then
        echo "  🆕 Newest backup: $newest"
    fi
    if [ -n "$oldest" ] && [ "$oldest" != "$newest" ]; then
        echo "  🆙 Oldest backup: $oldest"
    fi
}

# Main execution
if backup_logs; then
    cleanup_old_backups
    show_statistics
    
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo -e "${BLUE}========================================${NC}"
else
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${RED}❌ Backup failed${NC}"
    echo -e "${BLUE}========================================${NC}"
    exit 1
fi

echo ""
