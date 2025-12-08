#!/bin/bash

# Start Cloudflare Tunnel
# This script starts the Cloudflare tunnel to expose your application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Starting Cloudflare Tunnel"
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

# Check if Docker containers are running
if ! docker ps | grep -q "documan-nginx"; then
    echo -e "${YELLOW}Warning: Docker containers are not running${NC}"
    echo ""
    read -p "Do you want to start Docker containers now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting Docker containers..."
        docker compose up -d
        echo ""
        echo "Waiting for services to be ready..."
        sleep 10
    else
        echo -e "${YELLOW}Please start Docker containers with: docker compose up -d${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}Starting Cloudflare tunnel...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the tunnel${NC}"
echo ""
echo "=========================================="
echo ""

# Run tunnel
cloudflared tunnel run

# This will only execute if tunnel is stopped
echo ""
echo -e "${YELLOW}Tunnel stopped${NC}"
