#!/bin/bash

# Document Management System - Restart Services Script
# Usage: ./restart-services.sh [service]
# Options: backend, nginx, socat, cloudflare, all (default: all)

SERVICE=${1:-all}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Document Management System - RESTART${NC}"
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

# Restart Backend
restart_backend() {
    echo -e "${YELLOW}Restarting Backend...${NC}"
    
    if ps aux | grep -v grep | grep "node src/app.js" > /dev/null; then
        echo "  Stopping existing backend..."
        pkill -f "node src/app.js" || true
        sleep 2
    fi
    
    echo "  Starting backend..."
    cd "$PROJECT_DIR/backend"
    npm start > /tmp/backend.log 2>&1 &
    sleep 3
    
    if check_port 5001; then
        echo -e "${GREEN}  ✅ Backend restarted${NC}"
    else
        echo -e "${RED}  ❌ Backend restart failed${NC}"
        return 1
    fi
}

# Restart Nginx
restart_nginx() {
    echo -e "${YELLOW}Restarting Nginx...${NC}"
    
    if ps aux | grep -v grep | grep nginx > /dev/null; then
        echo "  Stopping existing nginx..."
        nginx -s stop -c "$PROJECT_DIR/nginx-local.conf" 2>/dev/null || true
        sleep 1
    fi
    
    echo "  Starting nginx..."
    cd "$PROJECT_DIR"
    nginx -c "$(pwd)/nginx-local.conf" > /tmp/nginx.log 2>&1 &
    sleep 2
    
    if check_port 3000; then
        echo -e "${GREEN}  ✅ Nginx restarted${NC}"
    else
        echo -e "${RED}  ❌ Nginx restart failed${NC}"
        return 1
    fi
}

# Restart Socat
restart_socat() {
    echo -e "${YELLOW}Restarting Socat...${NC}"
    
    if ps aux | grep -v grep | grep socat > /dev/null; then
        echo "  Stopping existing socat..."
        pkill socat || true
        sleep 1
    fi
    
    echo "  Starting socat..."
    socat TCP-LISTEN:5173,fork,reuseaddr TCP:localhost:3000 > /tmp/socat.log 2>&1 &
    sleep 1
    
    if check_port 5173; then
        echo -e "${GREEN}  ✅ Socat restarted${NC}"
    else
        echo -e "${RED}  ❌ Socat restart failed${NC}"
        return 1
    fi
}

# Restart Cloudflare
restart_cloudflare() {
    echo -e "${YELLOW}Restarting Cloudflare Tunnel...${NC}"
    
    if ps aux | grep -v grep | grep cloudflared > /dev/null; then
        echo "  Stopping existing cloudflare..."
        pkill cloudflared || true
        sleep 2
    fi
    
    echo "  Starting cloudflare..."
    cloudflared tunnel --url http://localhost:5173 --protocol http2 > /tmp/cloudflare-tunnel.log 2>&1 &
    sleep 5
    
    if ps aux | grep -v grep | grep cloudflared > /dev/null; then
        echo -e "${GREEN}  ✅ Cloudflare Tunnel restarted${NC}"
        
        # Show public URL
        TUNNEL_URL=$(grep "https://" /tmp/cloudflare-tunnel.log 2>/dev/null | grep "trycloudflare.com" | head -1 | sed 's/.*|\s*//' | sed 's/\s*|.*//' | xargs 2>/dev/null)
        if [ -n "$TUNNEL_URL" ]; then
            echo -e "${GREEN}  🌐 Public URL: $TUNNEL_URL${NC}"
        fi
    else
        echo -e "${RED}  ❌ Cloudflare Tunnel restart failed${NC}"
        return 1
    fi
}

case "$SERVICE" in
    backend)
        restart_backend
        ;;
    nginx)
        restart_nginx
        ;;
    socat)
        restart_socat
        ;;
    cloudflare)
        restart_cloudflare
        ;;
    all)
        restart_backend && \
        restart_nginx && \
        restart_socat && \
        restart_cloudflare
        ;;
    *)
        echo -e "${YELLOW}Usage: ./restart-services.sh [service]${NC}"
        echo ""
        echo "Options:"
        echo "  backend    - Restart backend only"
        echo "  nginx      - Restart nginx only"
        echo "  socat      - Restart socat only"
        echo "  cloudflare - Restart cloudflare tunnel only"
        echo "  all        - Restart all services (default)"
        echo ""
        exit 1
        ;;
esac

echo ""

if [ $? -eq 0 ]; then
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}✅ Restart completed successfully!${NC}"
    echo -e "${BLUE}========================================${NC}"
else
    echo -e "${BLUE}========================================${NC}"
    echo -e "${RED}❌ Restart encountered errors${NC}"
    echo -e "${BLUE}========================================${NC}"
    exit 1
fi

echo ""
