#!/bin/bash

# Document Management System - Service Status Check Script
# Usage: ./status-services.sh
# This script checks the status of all services

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Document Management System - STATUS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check port
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to get process info
get_process_info() {
    local pattern=$1
    ps aux | grep -v grep | grep "$pattern" | awk '{print $2, $6, $7}' | head -1
}

echo -e "${YELLOW}Service Status:${NC}"
echo ""

# Check Backend
if check_port 5001; then
    echo -e "${GREEN}  ✅ Backend (Node.js)${NC}"
    echo "     Port: 5001"
    echo "     Process: $(get_process_info 'node src/app.js')"
else
    echo -e "${RED}  ❌ Backend (Node.js)${NC}"
    echo "     Port: 5001 (NOT LISTENING)"
fi
echo ""

# Check Nginx
if check_port 3000; then
    echo -e "${GREEN}  ✅ Nginx (Reverse Proxy)${NC}"
    echo "     Port: 3000"
    echo "     Process: $(get_process_info 'nginx')"
else
    echo -e "${RED}  ❌ Nginx (Reverse Proxy)${NC}"
    echo "     Port: 3000 (NOT LISTENING)"
fi
echo ""

# Check Socat
if check_port 5173; then
    echo -e "${GREEN}  ✅ Socat (Port Forwarder)${NC}"
    echo "     Port: 5173"
    echo "     Process: $(get_process_info 'socat')"
else
    echo -e "${RED}  ❌ Socat (Port Forwarder)${NC}"
    echo "     Port: 5173 (NOT LISTENING)"
fi
echo ""

# Check Cloudflare Tunnel
if ps aux | grep -v grep | grep cloudflared > /dev/null; then
    echo -e "${GREEN}  ✅ Cloudflare Tunnel${NC}"
    TUNNEL_URL=$(grep "https://" /tmp/cloudflare-tunnel.log 2>/dev/null | grep "trycloudflare.com" | head -1 | sed 's/.*|\s*//' | sed 's/\s*|.*//' | xargs 2>/dev/null || echo "Getting URL...")
    echo "     URL: $TUNNEL_URL"
    echo "     Process: $(get_process_info 'cloudflared')"
else
    echo -e "${RED}  ❌ Cloudflare Tunnel${NC}"
    echo "     Status: NOT RUNNING"
fi
echo ""

# Check Database
echo -e "${YELLOW}Database Status:${NC}"
echo ""

if psql -U postgres -d documan_db -c "SELECT 1" > /dev/null 2>&1; then
    USERS=$(psql -U postgres -d documan_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null)
    DOCS=$(psql -U postgres -d documan_db -t -c "SELECT COUNT(*) FROM documents;" 2>/dev/null)
    echo -e "${GREEN}  ✅ PostgreSQL${NC}"
    echo "     Database: documan_db"
    echo "     Users: $USERS"
    echo "     Documents: $DOCS"
else
    echo -e "${RED}  ❌ PostgreSQL${NC}"
    echo "     Status: NOT CONNECTED"
fi
echo ""

# Test API
echo -e "${YELLOW}API Test:${NC}"
echo ""

API_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/health 2>/dev/null)
HTTP_CODE=$(echo "$API_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$API_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}  ✅ Frontend API${NC}"
    echo "     Response Code: $HTTP_CODE"
else
    echo -e "${RED}  ❌ Frontend API${NC}"
    echo "     Response Code: $HTTP_CODE"
fi
echo ""

# Authentication Test
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' 2>/dev/null)

if echo "$AUTH_RESPONSE" | jq -e '.username' > /dev/null 2>&1; then
    USERNAME=$(echo "$AUTH_RESPONSE" | jq -r '.username')
    echo -e "${GREEN}  ✅ Backend API${NC}"
    echo "     Login: Successful"
    echo "     User: $USERNAME"
else
    echo -e "${RED}  ❌ Backend API${NC}"
    echo "     Login: Failed"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"

all_running=true
if ! check_port 5001; then all_running=false; fi
if ! check_port 3000; then all_running=false; fi
if ! check_port 5173; then all_running=false; fi
if ! ps aux | grep -v grep | grep cloudflared > /dev/null; then all_running=false; fi

if [ "$all_running" = true ]; then
    echo -e "${GREEN}✅ All services running${NC}"
else
    echo -e "${RED}❌ Some services not running${NC}"
    echo -e "Start with: ${BLUE}./start-services.sh${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo ""

# Log file locations
echo -e "${YELLOW}Log Files:${NC}"
echo -e "  Backend:       ${BLUE}/tmp/backend.log${NC}"
echo -e "  Nginx:         ${BLUE}/tmp/nginx.log${NC}"
echo -e "  Socat:         ${BLUE}/tmp/socat.log${NC}"
echo -e "  Cloudflare:    ${BLUE}/tmp/cloudflare-tunnel.log${NC}"
echo ""
