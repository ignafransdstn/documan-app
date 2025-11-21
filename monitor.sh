#!/bin/bash

###############################################################################
# DocuMan System Monitor
# Description: Health check for all system components
# Usage: ./monitor.sh
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          DocuMan System Health Check            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo -e "${YELLOW}Timestamp: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Function to check service status
check_service() {
    local service=$1
    local container=$2
    
    if docker ps | grep -q "$container"; then
        echo -e "${GREEN}✓ $service is running${NC}"
        return 0
    else
        echo -e "${RED}✗ $service is NOT running${NC}"
        return 1
    fi
}

# Function to check health
check_health() {
    local container=$1
    local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null)
    
    if [ "$health" = "healthy" ]; then
        echo -e "${GREEN}  Health: healthy${NC}"
    elif [ "$health" = "unhealthy" ]; then
        echo -e "${RED}  Health: unhealthy${NC}"
    else
        echo -e "${YELLOW}  Health: $health${NC}"
    fi
}

# Check Docker Containers
echo -e "${BLUE}═══ Docker Containers ═══${NC}"
check_service "PostgreSQL" "documan-postgres"
check_health "documan-postgres"
echo ""

check_service "Backend API" "documan-backend"
check_health "documan-backend"
echo ""

check_service "Frontend" "documan-frontend"
check_health "documan-frontend"
echo ""

# Check Nginx
echo -e "${BLUE}═══ Nginx Status ═══${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx is NOT running${NC}"
fi
echo ""

# Check Disk Space
echo -e "${BLUE}═══ Disk Usage ═══${NC}"
df -h | grep -E '^/dev/' | while read line; do
    usage=$(echo $line | awk '{print $5}' | sed 's/%//')
    if [ "$usage" -gt 80 ]; then
        echo -e "${RED}$line${NC}"
    elif [ "$usage" -gt 60 ]; then
        echo -e "${YELLOW}$line${NC}"
    else
        echo -e "${GREEN}$line${NC}"
    fi
done
echo ""

# Check Memory
echo -e "${BLUE}═══ Memory Usage ═══${NC}"
free -h | grep -E 'Mem|Swap'
echo ""

# Check API Health
echo -e "${BLUE}═══ API Health Check ═══${NC}"
if curl -s -f http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
else
    echo -e "${RED}✗ Backend API is NOT responding${NC}"
fi

if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${RED}✗ Frontend is NOT responding${NC}"
fi
echo ""

# Check Database Connections
echo -e "${BLUE}═══ Database Info ═══${NC}"
DB_SIZE=$(docker exec documan-postgres psql -U documan_user -d document_management_prod -t -c "SELECT pg_size_pretty(pg_database_size('document_management_prod'));" 2>/dev/null | xargs)
DB_CONNECTIONS=$(docker exec documan-postgres psql -U documan_user -d document_management_prod -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='document_management_prod';" 2>/dev/null | xargs)

if [ -n "$DB_SIZE" ]; then
    echo -e "${GREEN}Database Size: $DB_SIZE${NC}"
    echo -e "${GREEN}Active Connections: $DB_CONNECTIONS${NC}"
else
    echo -e "${RED}Unable to retrieve database info${NC}"
fi
echo ""

# Check Container Resource Usage
echo -e "${BLUE}═══ Container Resources ═══${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" \
    documan-postgres documan-backend documan-frontend 2>/dev/null
echo ""

# Check Recent Logs for Errors
echo -e "${BLUE}═══ Recent Errors (Last 10) ═══${NC}"
ERROR_COUNT=$(docker-compose -f ~/documan-app/docker-compose.yml logs --tail=100 2>/dev/null | grep -i "error" | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${RED}Found $ERROR_COUNT error(s) in recent logs${NC}"
    docker-compose -f ~/documan-app/docker-compose.yml logs --tail=100 2>/dev/null | grep -i "error" | tail -10
else
    echo -e "${GREEN}No recent errors found${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            Health Check Complete                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""
