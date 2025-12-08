#!/bin/bash

# Document Management System - Stop All Services Script
# Usage: ./stop-services.sh
# This script stops all running services gracefully

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Document Management System - STOP${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to kill process by name
kill_process() {
    local name=$1
    local pattern=$2
    
    if ps aux | grep -v grep | grep "$pattern" > /dev/null; then
        echo -e "${YELLOW}  Stopping $name...${NC}"
        if [ "$pattern" = "nginx" ]; then
            nginx -s stop -c "$PROJECT_DIR/nginx-local.conf" 2>/dev/null || pkill -f "$pattern" || true
        else
            pkill -f "$pattern" || true
        fi
        sleep 1
        echo -e "${GREEN}    ✅ $name stopped${NC}"
    else
        echo -e "${YELLOW}    ⏸️  $name not running${NC}"
    fi
}

echo -e "${YELLOW}Stopping services...${NC}"
echo ""

# Stop Cloudflare Tunnel
kill_process "Cloudflare Tunnel" "cloudflared"

# Stop Socat
kill_process "Socat (Port Forwarder)" "socat"

# Stop Nginx
kill_process "Nginx (Reverse Proxy)" "nginx"

# Stop Backend
kill_process "Backend (Node.js)" "node src/app.js"

echo ""

# Verify all services are stopped
echo -e "${YELLOW}Verifying services are stopped...${NC}"
echo ""

services_running=0

if ps aux | grep -v grep | grep "node src/app.js" > /dev/null; then
    echo -e "${RED}  ❌ Backend still running${NC}"
    services_running=1
else
    echo -e "${GREEN}  ✅ Backend stopped${NC}"
fi

if ps aux | grep -v grep | grep nginx > /dev/null; then
    echo -e "${RED}  ❌ Nginx still running${NC}"
    services_running=1
else
    echo -e "${GREEN}  ✅ Nginx stopped${NC}"
fi

if ps aux | grep -v grep | grep socat > /dev/null; then
    echo -e "${RED}  ❌ Socat still running${NC}"
    services_running=1
else
    echo -e "${GREEN}  ✅ Socat stopped${NC}"
fi

if ps aux | grep -v grep | grep cloudflared > /dev/null; then
    echo -e "${RED}  ❌ Cloudflare Tunnel still running${NC}"
    services_running=1
else
    echo -e "${GREEN}  ✅ Cloudflare Tunnel stopped${NC}"
fi

echo ""

if [ $services_running -eq 0 ]; then
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}✅ All services stopped successfully!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}To restart services, run: ${BLUE}./start-services.sh${NC}"
    echo ""
    exit 0
else
    echo -e "${BLUE}========================================${NC}"
    echo -e "${YELLOW}⚠️  Some services may still be running${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Try force kill:${NC}"
    echo -e "  ${BLUE}pkill -9 -f 'node src/app.js'${NC}"
    echo -e "  ${BLUE}pkill -9 -f 'nginx'${NC}"
    echo -e "  ${BLUE}pkill -9 socat${NC}"
    echo -e "  ${BLUE}pkill -9 cloudflared${NC}"
    echo ""
    exit 1
fi
