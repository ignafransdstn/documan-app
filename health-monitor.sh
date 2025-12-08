#!/bin/bash

# Document Management System - Health Monitor Script
# Continuously monitors services and auto-restarts if failed
# Usage: ./health-monitor.sh [interval]
# interval: Check interval in seconds (default: 30)

INTERVAL=${1:-30}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/health-monitor.log"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] $1" | tee -a "$LOG_FILE"
}

# Function to check port
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check backend
check_backend() {
    if check_port 5001; then
        # Test API
        local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/users 2>/dev/null)
        if [ "$response" = "401" ] || [ "$response" = "200" ]; then
            return 0
        fi
    fi
    return 1
}

# Function to check nginx
check_nginx() {
    if check_port 3000; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
        if [ "$response" = "200" ]; then
            return 0
        fi
    fi
    return 1
}

# Function to check socat
check_socat() {
    if check_port 5173; then
        return 0
    fi
    return 1
}

# Function to check cloudflare
check_cloudflare() {
    if ps aux | grep -v grep | grep cloudflared > /dev/null; then
        return 0
    fi
    return 1
}

# Function to restart service
restart_service() {
    local service=$1
    log "⚠️  ${YELLOW}$service failed - attempting restart${NC}"
    
    case "$service" in
        backend)
            if ps aux | grep -v grep | grep "node src/app.js" > /dev/null; then
                pkill -f "node src/app.js" || true
                sleep 2
            fi
            cd "$PROJECT_DIR/backend"
            npm start > /tmp/backend.log 2>&1 &
            sleep 3
            ;;
        nginx)
            if ps aux | grep -v grep | grep nginx > /dev/null; then
                nginx -s stop -c "$PROJECT_DIR/nginx-local.conf" 2>/dev/null || true
                sleep 1
            fi
            cd "$PROJECT_DIR"
            nginx -c "$(pwd)/nginx-local.conf" > /tmp/nginx.log 2>&1 &
            sleep 2
            ;;
        socat)
            if ps aux | grep -v grep | grep socat > /dev/null; then
                pkill socat || true
                sleep 1
            fi
            socat TCP-LISTEN:5173,fork,reuseaddr TCP:localhost:3000 > /tmp/socat.log 2>&1 &
            sleep 1
            ;;
        cloudflare)
            if ps aux | grep -v grep | grep cloudflared > /dev/null; then
                pkill cloudflared || true
                sleep 2
            fi
            cloudflared tunnel --url http://localhost:5173 --protocol http2 > /tmp/cloudflare-tunnel.log 2>&1 &
            sleep 5
            ;;
    esac
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Health Monitor Started${NC}"
echo -e "${BLUE}Check Interval: ${INTERVAL}s${NC}"
echo -e "${BLUE}Log File: ${LOG_FILE}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

log "🚀 Health monitor started (interval: ${INTERVAL}s)"

# Counter for tracking
backend_failures=0
nginx_failures=0
socat_failures=0
cloudflare_failures=0

while true; do
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check Backend
    if check_backend; then
        if [ $backend_failures -gt 0 ]; then
            log "✅ Backend restored"
        fi
        backend_failures=0
    else
        backend_failures=$((backend_failures + 1))
        if [ $backend_failures -eq 1 ]; then
            log "❌ Backend check failed"
        fi
        if [ $backend_failures -ge 2 ]; then
            restart_service "backend"
            backend_failures=0
        fi
    fi
    
    # Check Nginx
    if check_nginx; then
        if [ $nginx_failures -gt 0 ]; then
            log "✅ Nginx restored"
        fi
        nginx_failures=0
    else
        nginx_failures=$((nginx_failures + 1))
        if [ $nginx_failures -eq 1 ]; then
            log "❌ Nginx check failed"
        fi
        if [ $nginx_failures -ge 2 ]; then
            restart_service "nginx"
            nginx_failures=0
        fi
    fi
    
    # Check Socat
    if check_socat; then
        if [ $socat_failures -gt 0 ]; then
            log "✅ Socat restored"
        fi
        socat_failures=0
    else
        socat_failures=$((socat_failures + 1))
        if [ $socat_failures -eq 1 ]; then
            log "❌ Socat check failed"
        fi
        if [ $socat_failures -ge 2 ]; then
            restart_service "socat"
            socat_failures=0
        fi
    fi
    
    # Check Cloudflare
    if check_cloudflare; then
        if [ $cloudflare_failures -gt 0 ]; then
            log "✅ Cloudflare restored"
        fi
        cloudflare_failures=0
    else
        cloudflare_failures=$((cloudflare_failures + 1))
        if [ $cloudflare_failures -eq 1 ]; then
            log "❌ Cloudflare check failed"
        fi
        if [ $cloudflare_failures -ge 2 ]; then
            restart_service "cloudflare"
            cloudflare_failures=0
        fi
    fi
    
    sleep $INTERVAL
done
