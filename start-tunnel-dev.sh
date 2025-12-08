#!/bin/bash

# Start Cloudflare Tunnel for Development Mode
# This script starts the tunnel for local development (without Docker)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Cloudflare Tunnel - Development Mode"
echo "=========================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}cloudflared is not installed${NC}"
    echo "Please run ./setup-cloudflare-tunnel.sh first"
    exit 1
fi

# Check if config exists
if [ ! -f ~/.cloudflared/config.yml ]; then
    echo -e "${RED}Cloudflare tunnel configuration not found${NC}"
    echo "Please run ./setup-cloudflare-tunnel.sh first"
    exit 1
fi

# Load tunnel info if available
if [ -f .cloudflare-tunnel-info ]; then
    source .cloudflare-tunnel-info
    echo -e "${BLUE}Tunnel Information:${NC}"
    echo "Name: $TUNNEL_NAME"
    echo "ID: $TUNNEL_ID"
    echo "URL: $TUNNEL_URL"
    echo ""
fi

# Check if dev servers are running
BACKEND_RUNNING=false
FRONTEND_RUNNING=false

if lsof -i:5001 > /dev/null 2>&1; then
    BACKEND_RUNNING=true
    echo -e "${GREEN}✓ Backend is running on port 5001${NC}"
else
    echo -e "${YELLOW}⚠ Backend is not running on port 5001${NC}"
fi

if lsof -i:5173 > /dev/null 2>&1; then
    FRONTEND_RUNNING=true
    echo -e "${GREEN}✓ Frontend is running on port 5173${NC}"
else
    echo -e "${YELLOW}⚠ Frontend is not running on port 5173${NC}"
fi

if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
    echo ""
    echo -e "${YELLOW}Some services are not running!${NC}"
    echo ""
    read -p "Do you want to start dev servers now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting development servers..."
        ./run-dev.sh
        echo ""
        echo "Waiting for services to start..."
        sleep 10
    else
        echo -e "${YELLOW}Please start dev servers with: ./run-dev.sh${NC}"
        echo ""
        echo "Or start manually:"
        echo "  cd backend && npm run dev"
        echo "  cd frontend && npm run dev"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}Creating temporary tunnel configuration for dev mode...${NC}"

# Create a temporary config for dev mode
cat > ~/.cloudflared/config-dev.yml <<EOF
tunnel: $(grep "^tunnel:" ~/.cloudflared/config.yml | awk '{print $2}')
credentials-file: $(grep "^credentials-file:" ~/.cloudflared/config.yml | awk '{print $2}')

ingress:
  # Route to frontend (Vite dev server)
  - hostname: "*"
    service: http://localhost:5173
  
  # Catch-all
  - service: http_status:404
EOF

echo ""
echo -e "${GREEN}Starting Cloudflare tunnel in dev mode...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the tunnel${NC}"
echo ""
echo -e "${BLUE}Your app will be accessible at: $TUNNEL_URL${NC}"
echo -e "${YELLOW}Note: API calls from frontend to backend will work via proxy${NC}"
echo ""
echo "=========================================="
echo ""

# Run tunnel with dev config
cloudflared tunnel --config ~/.cloudflared/config-dev.yml run

# This will only execute if tunnel is stopped
echo ""
echo -e "${YELLOW}Tunnel stopped${NC}"
