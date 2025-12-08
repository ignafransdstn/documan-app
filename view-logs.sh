#!/bin/bash

# Document Management System - View Logs Script
# Usage: ./view-logs.sh [service]
# Options: backend, nginx, socat, cloudflare, all

SERVICE=${1:-all}

# Color output
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Document Management System - LOGS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

case "$SERVICE" in
    backend)
        echo -e "${YELLOW}Backend Logs (/tmp/backend.log):${NC}"
        echo ""
        if [ -f /tmp/backend.log ]; then
            tail -100 /tmp/backend.log
        else
            echo "No logs found. Start services with: ./start-services.sh"
        fi
        ;;
    nginx)
        echo -e "${YELLOW}Nginx Logs (/tmp/nginx.log):${NC}"
        echo ""
        if [ -f /tmp/nginx.log ]; then
            tail -100 /tmp/nginx.log
        else
            echo "No logs found. Start services with: ./start-services.sh"
        fi
        ;;
    socat)
        echo -e "${YELLOW}Socat Logs (/tmp/socat.log):${NC}"
        echo ""
        if [ -f /tmp/socat.log ]; then
            tail -50 /tmp/socat.log
        else
            echo "No logs found. Start services with: ./start-services.sh"
        fi
        ;;
    cloudflare)
        echo -e "${YELLOW}Cloudflare Tunnel Logs (/tmp/cloudflare-tunnel.log):${NC}"
        echo ""
        if [ -f /tmp/cloudflare-tunnel.log ]; then
            tail -50 /tmp/cloudflare-tunnel.log | grep -E "(trycloudflare|Registered|INF)"
        else
            echo "No logs found. Start services with: ./start-services.sh"
        fi
        echo ""
        echo -e "${YELLOW}Public URL:${NC}"
        grep "https://" /tmp/cloudflare-tunnel.log 2>/dev/null | grep "trycloudflare.com" | tail -1 | sed 's/.*|\s*//' | sed 's/\s*|.*//'
        ;;
    all)
        echo -e "${YELLOW}Backend Logs (last 20 lines):${NC}"
        if [ -f /tmp/backend.log ]; then
            tail -20 /tmp/backend.log | head -20
        else
            echo "  No logs found"
        fi
        echo ""
        
        echo -e "${YELLOW}Nginx Logs (last 20 lines):${NC}"
        if [ -f /tmp/nginx.log ]; then
            tail -20 /tmp/nginx.log | head -20
        else
            echo "  No logs found"
        fi
        echo ""
        
        echo -e "${YELLOW}Socat Logs (last 10 lines):${NC}"
        if [ -f /tmp/socat.log ]; then
            tail -10 /tmp/socat.log
        else
            echo "  No logs found"
        fi
        echo ""
        
        echo -e "${YELLOW}Cloudflare Tunnel Public URL:${NC}"
        TUNNEL_URL=$(grep "https://" /tmp/cloudflare-tunnel.log 2>/dev/null | grep "trycloudflare.com" | head -1 | sed 's/.*|\s*//' | sed 's/\s*|.*//' | xargs 2>/dev/null)
        if [ -n "$TUNNEL_URL" ]; then
            echo "  $TUNNEL_URL"
        else
            echo "  Getting URL..."
        fi
        echo ""
        ;;
    *)
        echo -e "${YELLOW}Usage: ./view-logs.sh [service]${NC}"
        echo ""
        echo "Options:"
        echo "  backend    - Show backend logs"
        echo "  nginx      - Show nginx logs"
        echo "  socat      - Show socat logs"
        echo "  cloudflare - Show cloudflare tunnel logs & public URL"
        echo "  all        - Show all logs (default)"
        echo ""
        ;;
esac

echo ""
