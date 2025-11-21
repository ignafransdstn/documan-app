#!/bin/bash

###############################################################################
# DocuMan Database Backup Script
# Description: Automated PostgreSQL backup with compression and rotation
# Usage: ./backup-db.sh
###############################################################################

set -e

# Configuration
BACKUP_DIR="/home/documan/documan-app/backup"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="documan_backup_${DATE}.sql"
RETENTION_DAYS=30

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        DocuMan Database Backup Script           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Create backup directory if not exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}Creating backup directory: $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Check if Docker container is running
if ! docker ps | grep -q documan-postgres; then
    echo -e "${RED}Error: PostgreSQL container is not running!${NC}"
    exit 1
fi

# Perform backup
echo -e "${YELLOW}Starting database backup...${NC}"
docker exec documan-postgres pg_dump \
    -U documan_user \
    -d document_management_prod \
    --no-owner \
    --no-acl \
    > "${BACKUP_DIR}/${FILENAME}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database exported successfully${NC}"
else
    echo -e "${RED}✗ Database export failed!${NC}"
    exit 1
fi

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
gzip "${BACKUP_DIR}/${FILENAME}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup compressed: ${FILENAME}.gz${NC}"
else
    echo -e "${RED}✗ Compression failed!${NC}"
    exit 1
fi

# Get file size
FILE_SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}.gz" | cut -f1)
echo -e "${GREEN}✓ Backup size: ${FILE_SIZE}${NC}"

# Delete old backups
echo -e "${YELLOW}Removing backups older than ${RETENTION_DAYS} days...${NC}"
DELETED_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)

if [ $DELETED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Deleted ${DELETED_COUNT} old backup(s)${NC}"
else
    echo -e "${YELLOW}No old backups to delete${NC}"
fi

# List current backups
echo ""
echo -e "${GREEN}Current backups:${NC}"
ls -lh "$BACKUP_DIR" | grep ".sql.gz" | awk '{print "  " $9 " (" $5 ")"}'

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Backup completed successfully!         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo -e "${YELLOW}Backup file: ${BACKUP_DIR}/${FILENAME}.gz${NC}"
echo ""
