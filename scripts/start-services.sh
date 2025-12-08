#!/bin/bash

################################################################################
# Document Management System - Start All Services
# Script untuk mengaktifkan semua services (Backend, Nginx, Socat, Cloudflare)
# Usage: ./start-services.sh [--no-tunnel]
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/Volumes/DATA/JIMBARAN HIJAU/Project File/document-management-system"
BACKEND_DIR="${PROJECT_DIR}/backend"
SCRIPTS_DIR="${PROJECT_DIR}/scripts"
LOGS_DIR="/tmp/documan"

# Create logs directory
mkdir -p "${LOGS_DIR}"

# Parse arguments
NO_TUNNEL=false
if [[ "$1" == "--no-tunnel" ]]; then
    NO_TUNNEL=true
fi

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

check_port() {
    local port=$1
    local name=$2
    
    if lsof -i :${port} > /dev/null 2>&1; then
        print_error "${name} already running on port ${port}"
        return 1
    else
        print_status "${name} port ${port} is available"
        return 0
    fi
}

wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if lsof -i :${port} > /dev/null 2>&1; then
            print_status "${name} is running on port ${port}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    print_error "${name} failed to start on port ${port}"
    return 1
}

################################################################################
# Main Services Startup
################################################################################

print_header "Document Management System - Services Startup"

echo -e "\nStarting timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "Project directory: ${PROJECT_DIR}\n"

# 1. Start Backend
print_header "Step 1/4: Starting Backend (Node.js Express)"

if check_port 5001 "Backend"; then
    cd "${BACKEND_DIR}"
    
    print_info "Starting Node.js server..."
    npm start > "${LOGS_DIR}/backend.log" 2>&1 &
    BACKEND_PID=$!
    
    # Wait for backend to start
    if wait_for_service 5001 "Backend"; then
        print_status "Backend started (PID: ${BACKEND_PID})"
        echo "${BACKEND_PID}" > "${LOGS_DIR}/backend.pid"
    else
        print_error "Backend failed to start"
        tail -20 "${LOGS_DIR}/backend.log"
        exit 1
    fi
else
    print_info "Backend already running, skipping..."
fi

# 2. Start Nginx
print_header "Step 2/4: Starting Nginx (Reverse Proxy)"

if check_port 3000 "Nginx"; then
    print_info "Starting Nginx reverse proxy..."
    cd "${PROJECT_DIR}"
    nginx -c "$(pwd)/nginx-local.conf" > "${LOGS_DIR}/nginx.log" 2>&1 &
    
    sleep 2
    
    if wait_for_service 3000 "Nginx"; then
        NGINX_PIDS=$(pgrep nginx | head -1)
        print_status "Nginx started (PID: ${NGINX_PIDS})"
        pgrep nginx > "${LOGS_DIR}/nginx.pid"
    else
        print_error "Nginx failed to start"
        tail -20 "${LOGS_DIR}/nginx.log"
        exit 1
    fi
else
    print_info "Nginx already running, skipping..."
fi

# 3. Start Socat (Port Forwarder)
print_header "Step 3/4: Starting Socat (Port Forwarder 5173→3000)"

if ! pgrep socat > /dev/null 2>&1; then
    print_info "Starting socat TCP forwarder..."
    socat TCP-LISTEN:5173,fork,reuseaddr TCP:localhost:3000 > "${LOGS_DIR}/socat.log" 2>&1 &
    SOCAT_PID=$!
    
    sleep 1
    
    if pgrep socat > /dev/null 2>&1; then
        print_status "Socat started (PID: ${SOCAT_PID})"
        pgrep socat > "${LOGS_DIR}/socat.pid"
    else
        print_error "Socat failed to start"
        tail -20 "${LOGS_DIR}/socat.log"
        exit 1
    fi
else
    print_status "Socat already running"
fi

# 4. Start Cloudflare Tunnel
print_header "Step 4/4: Starting Cloudflare Tunnel"

if [ "$NO_TUNNEL" = true ]; then
    print_info "Skipping Cloudflare Tunnel (--no-tunnel flag)"
else
    if ! pgrep cloudflared > /dev/null 2>&1; then
        print_info "Starting Cloudflare Tunnel..."
        cloudflared tunnel --url http://localhost:5173 --protocol http2 > "${LOGS_DIR}/cloudflare-tunnel.log" 2>&1 &
        TUNNEL_PID=$!
        
        print_info "Waiting for tunnel to establish connection..."
        sleep 5
        
        if pgrep cloudflared > /dev/null 2>&1; then
            print_status "Cloudflare Tunnel started (PID: ${TUNNEL_PID})"
            pgrep cloudflared > "${LOGS_DIR}/cloudflare-tunnel.pid"
            
            # Extract and display tunnel URL
            TUNNEL_URL=$(grep "https://" "${LOGS_DIR}/cloudflare-tunnel.log" | grep "trycloudflare.com" | head -1 | sed 's/.*|\s*//' | sed 's/\s*|.*//' | xargs 2>/dev/null || echo "URL not yet available")
            if [[ ! -z "$TUNNEL_URL" && "$TUNNEL_URL" != "URL not yet available" ]]; then
                print_status "Tunnel URL: ${TUNNEL_URL}"
                echo "${TUNNEL_URL}" > "${LOGS_DIR}/tunnel-url.txt"
            else
                print_info "Tunnel URL will be available shortly..."
            fi
        else
            print_error "Cloudflare Tunnel failed to start"
            tail -20 "${LOGS_DIR}/cloudflare-tunnel.log"
            exit 1
        fi
    else
        print_status "Cloudflare Tunnel already running"
    fi
fi

################################################################################
# Verification
################################################################################

print_header "Service Verification"

echo ""
echo -e "${BLUE}Port Status:${NC}"
lsof -i :5001 2>/dev/null | tail -1 | awk '{print "  Backend (5001):", $1, "PID:", $2}'
lsof -i :3000 2>/dev/null | tail -1 | awk '{print "  Nginx (3000):", $1, "PID:", $2}'
lsof -i :5173 2>/dev/null | tail -1 | awk '{print "  Socat (5173):", $1, "PID:", $2}'

echo ""
echo -e "${BLUE}Process Status:${NC}"
ps aux | grep "node src/app.js" | grep -v grep | awk '{print "  Backend: Running"}' || echo "  Backend: Not running"
ps aux | grep "nginx" | grep -v grep | wc -l | awk '{if ($1 > 1) print "  Nginx: Running"; else print "  Nginx: Not running"}'
ps aux | grep socat | grep -v grep | wc -l | awk '{if ($1 > 0) print "  Socat: Running"; else print "  Socat: Not running"}'
ps aux | grep cloudflared | grep -v grep | wc -l | awk '{if ($1 > 0) print "  Cloudflare Tunnel: Running"; else print "  Cloudflare Tunnel: Not running"}'

echo ""
echo -e "${BLUE}API Tests:${NC}"

# Test Frontend
if curl -s http://localhost:3000/ | grep -q "DocuMan"; then
    print_status "Frontend is responding"
else
    print_error "Frontend is not responding"
fi

# Test Backend API
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q "admin"; then
    print_status "Backend API is responding"
else
    print_error "Backend API is not responding"
fi

# Test Database
DB_CHECK=$(curl -s http://localhost:3000/api/health 2>/dev/null)
if echo "$DB_CHECK" | grep -q "ok\|ok\|status"; then
    print_status "Database is connected"
else
    print_info "Database health check pending..."
fi

################################################################################
# Summary & Next Steps
################################################################################

print_header "Startup Summary"

echo ""
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo ""
echo -e "${BLUE}Service Information:${NC}"
echo "  Backend:          http://localhost:5001"
echo "  Frontend:         http://localhost:3000"
echo "  Nginx Proxy:      http://localhost:3000 (serves both frontend & API)"
echo "  Database:         PostgreSQL on localhost:5432"
echo ""

# Get tunnel URL if available
if [ -f "${LOGS_DIR}/tunnel-url.txt" ]; then
    TUNNEL_URL=$(cat "${LOGS_DIR}/tunnel-url.txt")
    echo -e "${BLUE}Public Access:${NC}"
    echo "  🌐 URL: ${TUNNEL_URL}"
    echo ""
fi

echo -e "${BLUE}Login Credentials:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
echo ""

echo -e "${BLUE}Log Files:${NC}"
echo "  Backend:           ${LOGS_DIR}/backend.log"
echo "  Nginx:             ${LOGS_DIR}/nginx.log"
echo "  Socat:             ${LOGS_DIR}/socat.log"
echo "  Cloudflare Tunnel: ${LOGS_DIR}/cloudflare-tunnel.log"
echo ""

echo -e "${BLUE}PID Files:${NC}"
echo "  Backend:           ${LOGS_DIR}/backend.pid"
echo "  Nginx:             ${LOGS_DIR}/nginx.pid"
echo "  Socat:             ${LOGS_DIR}/socat.pid"
echo "  Cloudflare Tunnel: ${LOGS_DIR}/cloudflare-tunnel.pid"
echo ""

echo -e "${YELLOW}💡 Useful Commands:${NC}"
echo "  Stop all services:     ./stop-services.sh"
echo "  Restart services:      ./restart-services.sh"
echo "  View logs:             tail -f ${LOGS_DIR}/backend.log"
echo "  Check health:          curl http://localhost:3000/api/health"
echo "  Get tunnel URL:        cat ${LOGS_DIR}/tunnel-url.txt"
echo ""

echo -e "${GREEN}Startup completed at $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""
