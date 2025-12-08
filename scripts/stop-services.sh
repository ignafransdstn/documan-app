#!/bin/bash

################################################################################
# Document Management System - Stop All Services
# Script untuk menonaktifkan semua services
# Usage: ./stop-services.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOGS_DIR="/tmp/documan"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

stop_process() {
    local name=$1
    local pid_file=$2
    local pid=""
    
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file" 2>/dev/null)
        if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null
            fi
            print_status "$name stopped (PID: $pid)"
            rm -f "$pid_file"
            return 0
        fi
    fi
    
    # Fallback: Try to kill by process name
    local pgrep_result=$(pgrep -f "$name" | head -1 2>/dev/null || echo "")
    if [ ! -z "$pgrep_result" ]; then
        kill "$pgrep_result" 2>/dev/null || true
        sleep 1
        kill -9 "$pgrep_result" 2>/dev/null || true
        print_status "$name stopped"
        return 0
    fi
    
    print_info "$name not running"
    return 0
}

################################################################################
# Main Services Shutdown
################################################################################

print_header "Document Management System - Services Shutdown"

echo -e "\nStopping timestamp: $(date '+%Y-%m-%d %H:%M:%S')\n"

# 1. Stop Cloudflare Tunnel
print_info "Stopping Cloudflare Tunnel..."
pkill cloudflared 2>/dev/null || true
sleep 1
if ! pgrep cloudflared > /dev/null 2>&1; then
    print_status "Cloudflare Tunnel stopped"
else
    print_error "Failed to stop Cloudflare Tunnel, forcing..."
    pkill -9 cloudflared 2>/dev/null || true
fi
rm -f "${LOGS_DIR}/cloudflare-tunnel.pid"

# 2. Stop Socat
print_info "Stopping Socat (Port Forwarder)..."
pkill socat 2>/dev/null || true
sleep 1
if ! pgrep socat > /dev/null 2>&1; then
    print_status "Socat stopped"
else
    print_error "Failed to stop Socat, forcing..."
    pkill -9 socat 2>/dev/null || true
fi
rm -f "${LOGS_DIR}/socat.pid"

# 3. Stop Nginx
print_info "Stopping Nginx..."
if lsof -i :3000 > /dev/null 2>&1; then
    nginx -s stop 2>/dev/null || true
    sleep 2
    # Force kill if still running
    pkill nginx 2>/dev/null || true
    print_status "Nginx stopped"
else
    print_info "Nginx not running"
fi
rm -f "${LOGS_DIR}/nginx.pid"

# 4. Stop Backend
print_info "Stopping Backend (Node.js)..."
pkill -f "node src/app.js" 2>/dev/null || true
sleep 1
if ! pgrep -f "node src/app.js" > /dev/null 2>&1; then
    print_status "Backend stopped"
else
    print_error "Failed to stop Backend, forcing..."
    pkill -9 -f "node src/app.js" 2>/dev/null || true
fi
rm -f "${LOGS_DIR}/backend.pid"

################################################################################
# Verification
################################################################################

print_header "Service Verification"

echo ""
echo -e "${BLUE}Port Status:${NC}"
lsof -i :5001 > /dev/null 2>&1 && echo "  Backend (5001): Still running" || echo "  Backend (5001): Stopped"
lsof -i :3000 > /dev/null 2>&1 && echo "  Nginx (3000): Still running" || echo "  Nginx (3000): Stopped"
lsof -i :5173 > /dev/null 2>&1 && echo "  Socat (5173): Still running" || echo "  Socat (5173): Stopped"

echo ""
echo -e "${BLUE}Process Status:${NC}"
pgrep -f "node src/app.js" > /dev/null 2>&1 && echo "  Backend: Still running" || echo "  Backend: Stopped"
pgrep nginx > /dev/null 2>&1 && echo "  Nginx: Still running" || echo "  Nginx: Stopped"
pgrep socat > /dev/null 2>&1 && echo "  Socat: Still running" || echo "  Socat: Stopped"
pgrep cloudflared > /dev/null 2>&1 && echo "  Cloudflare: Still running" || echo "  Cloudflare: Stopped"

################################################################################
# Summary
################################################################################

print_header "Shutdown Summary"

echo ""
echo -e "${GREEN}✅ All services have been stopped${NC}"
echo ""

echo -e "${BLUE}Remaining Resources:${NC}"
echo "  Log files:        ${LOGS_DIR}/"
echo "  Backend PID:      ${LOGS_DIR}/backend.pid"
echo "  Nginx PID:        ${LOGS_DIR}/nginx.pid"
echo "  Socat PID:        ${LOGS_DIR}/socat.pid"
echo "  Tunnel PID:       ${LOGS_DIR}/cloudflare-tunnel.pid"
echo ""

echo -e "${YELLOW}💡 Useful Commands:${NC}"
echo "  Start services:    ./start-services.sh"
echo "  View logs:         tail -f ${LOGS_DIR}/backend.log"
echo "  Clear logs:        rm ${LOGS_DIR}/*.log"
echo ""

echo -e "${GREEN}Shutdown completed at $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""
