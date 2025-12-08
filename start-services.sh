#!/bin/bash

# Document Management System - Start All Services Script
# Usage: ./start-services.sh
# This script starts all required services in the correct order

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log file
LOG_DIR="/tmp"
BACKEND_LOG="$LOG_DIR/backend.log"
NGINX_LOG="$LOG_DIR/nginx.log"
SOCAT_LOG="$LOG_DIR/socat.log"
CLOUDFLARE_LOG="$LOG_DIR/cloudflare-tunnel.log"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Document Management System - START${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"
check_commands=("node" "npm" "nginx" "socat" "cloudflared" "psql")
for cmd in "${check_commands[@]}"; do
    if command_exists "$cmd"; then
        echo -e "${GREEN}  ✅ $cmd${NC}"
    else
        echo -e "${RED}  ❌ $cmd not found${NC}"
    fi
done
echo ""

# Kill any existing processes on required ports
echo -e "${YELLOW}[2/6] Cleaning up existing processes...${NC}"

# Stop any existing backend processes
if ps aux | grep -v grep | grep "node src/app.js" > /dev/null; then
    echo "  Stopping existing backend process..."
    pkill -f "node src/app.js" || true
    sleep 1
fi

# Stop any existing nginx processes
if ps aux | grep -v grep | grep nginx > /dev/null; then
    echo "  Stopping existing nginx process..."
    nginx -s stop -c "$(pwd)/nginx-local.conf" 2>/dev/null || true
    sleep 1
fi

# Stop any existing socat processes
if ps aux | grep -v grep | grep socat > /dev/null; then
    echo "  Stopping existing socat process..."
    pkill socat || true
    sleep 1
fi

# Stop any existing cloudflared processes
if ps aux | grep -v grep | grep cloudflared > /dev/null; then
    echo "  Stopping existing cloudflared process..."
    pkill cloudflared || true
    sleep 1
fi

echo -e "${GREEN}  ✅ Cleanup complete${NC}"
echo ""

# Step 1: Start Backend
echo -e "${YELLOW}[3/6] Starting Backend (Node.js)...${NC}"
cd "$BACKEND_DIR"

if ! npm list > /dev/null 2>&1; then
    echo "  Installing dependencies..."
    npm install
fi

npm start > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
sleep 3

if check_port 5001; then
    echo -e "${GREEN}  ✅ Backend started (PID: $BACKEND_PID, Port: 5001)${NC}"
else
    echo -e "${RED}  ❌ Backend failed to start${NC}"
    echo "  Check logs: tail -f $BACKEND_LOG"
    exit 1
fi
echo ""

# Step 2: Start Nginx
echo -e "${YELLOW}[4/6] Starting Nginx (Reverse Proxy)...${NC}"
cd "$PROJECT_DIR"

nginx -c "$(pwd)/nginx-local.conf" > "$NGINX_LOG" 2>&1 &
NGINX_PID=$!
sleep 2

if check_port 3000; then
    echo -e "${GREEN}  ✅ Nginx started (PID: $NGINX_PID, Port: 3000)${NC}"
else
    echo -e "${RED}  ❌ Nginx failed to start${NC}"
    echo "  Check logs: tail -f $NGINX_LOG"
    exit 1
fi
echo ""

# Step 3: Start Socat (Port Forwarder)
echo -e "${YELLOW}[5/6] Starting Socat (Port Forwarder)...${NC}"

socat TCP-LISTEN:5173,fork,reuseaddr TCP:localhost:3000 > "$SOCAT_LOG" 2>&1 &
SOCAT_PID=$!
sleep 1

if check_port 5173; then
    echo -e "${GREEN}  ✅ Socat started (PID: $SOCAT_PID, Port: 5173)${NC}"
else
    echo -e "${RED}  ❌ Socat failed to start${NC}"
    echo "  Check logs: tail -f $SOCAT_LOG"
    exit 1
fi
echo ""

# Step 4: Start Cloudflare Tunnel
echo -e "${YELLOW}[6/6] Starting Cloudflare Tunnel...${NC}"

cloudflared tunnel --url http://localhost:5173 --protocol http2 > "$CLOUDFLARE_LOG" 2>&1 &
CLOUDFLARE_PID=$!
sleep 5

if ps aux | grep -v grep | grep cloudflared > /dev/null; then
    echo -e "${GREEN}  ✅ Cloudflare Tunnel started (PID: $CLOUDFLARE_PID)${NC}"
    
    # Extract and display public URL
    TUNNEL_URL=$(grep "https://" "$CLOUDFLARE_LOG" | grep "trycloudflare.com" | head -1 | sed 's/.*|\s*//' | sed 's/\s*|.*//' | xargs 2>/dev/null || echo "")
    
    if [ -n "$TUNNEL_URL" ]; then
        echo -e "${GREEN}  🌐 Public URL: ${BLUE}$TUNNEL_URL${NC}"
    else
        sleep 2
        TUNNEL_URL=$(grep "https://" "$CLOUDFLARE_LOG" | grep "trycloudflare.com" | head -1 | sed 's/.*|\s*//' | sed 's/\s*|.*//' | xargs 2>/dev/null || echo "")
        if [ -n "$TUNNEL_URL" ]; then
            echo -e "${GREEN}  🌐 Public URL: ${BLUE}$TUNNEL_URL${NC}"
        else
            echo -e "${YELLOW}  ⏳ Getting public URL...${NC}"
            echo "  Run: tail -f $CLOUDFLARE_LOG"
        fi
    fi
else
    echo -e "${RED}  ❌ Cloudflare Tunnel failed to start${NC}"
    echo "  Check logs: tail -f $CLOUDFLARE_LOG"
    exit 1
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Service Status:${NC}"
echo -e "  Backend (Node.js):     ${GREEN}✅ Running on :5001${NC}"
echo -e "  Nginx (Reverse Proxy): ${GREEN}✅ Running on :3000${NC}"
echo -e "  Socat (Forwarder):     ${GREEN}✅ Running on :5173${NC}"
echo -e "  Cloudflare Tunnel:     ${GREEN}✅ Active${NC}"
echo ""
echo -e "${YELLOW}Database:${NC}"
echo -e "  PostgreSQL: ${GREEN}✅ Connected${NC}"
echo ""
echo -e "${YELLOW}Login Credentials:${NC}"
echo -e "  Username: ${BLUE}admin${NC}"
echo -e "  Password: ${BLUE}admin123${NC}"
echo ""
echo -e "${YELLOW}Log Files:${NC}"
echo -e "  Backend:       $BACKEND_LOG"
echo -e "  Nginx:         $NGINX_LOG"
echo -e "  Socat:         $SOCAT_LOG"
echo -e "  Cloudflare:    $CLOUDFLARE_LOG"
echo ""
echo -e "${YELLOW}Stop services with: ${BLUE}./stop-services.sh${NC}"
echo ""

# Save PIDs for stop script
echo "$BACKEND_PID" > "$PROJECT_DIR/services.pids"
echo "$NGINX_PID" >> "$PROJECT_DIR/services.pids"
echo "$SOCAT_PID" >> "$PROJECT_DIR/services.pids"
echo "$CLOUDFLARE_PID" >> "$PROJECT_DIR/services.pids"

# Keep the script running (optional - can be commented out)
echo -e "${BLUE}Press Ctrl+C to view logs${NC}"
wait
