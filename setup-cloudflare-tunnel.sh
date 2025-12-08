#!/bin/bash

# Cloudflare Tunnel Setup Script
# This script will install cloudflared and help you setup a tunnel

set -e

echo "=========================================="
echo "  Cloudflare Tunnel Setup for Documan"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}This script is designed for macOS${NC}"
    echo "For other OS, please visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
    exit 1
fi

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${RED}Homebrew is not installed${NC}"
    echo "Please install Homebrew first: https://brew.sh/"
    exit 1
fi

# Install cloudflared if not already installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}Installing cloudflared...${NC}"
    brew install cloudflared
    echo -e "${GREEN}✓ cloudflared installed successfully${NC}"
else
    echo -e "${GREEN}✓ cloudflared is already installed${NC}"
    echo "Current version: $(cloudflared --version)"
fi

echo ""
echo "=========================================="
echo "  Authentication Required"
echo "=========================================="
echo ""
echo "You need to authenticate with Cloudflare."
echo "This will open your browser for login."
echo ""
echo -e "${YELLOW}Important: If the cert.pem downloads to your Downloads folder,"
echo "you'll need to move it manually to ~/.cloudflared/cert.pem${NC}"
echo ""
read -p "Press Enter to continue..."

# Create cloudflared directory if not exists
mkdir -p ~/.cloudflared

# Authenticate with Cloudflare
echo "Opening browser for authentication..."
cloudflared tunnel login

# Check if authentication was successful
if [ ! -f ~/.cloudflared/cert.pem ]; then
    echo ""
    echo -e "${YELLOW}Certificate not found in ~/.cloudflared/cert.pem${NC}"
    echo "Checking Downloads folder..."
    
    # Try to find cert in Downloads
    CERT_FILE=$(find ~/Downloads -name "cert.pem" -o -name "*cloudflare*.pem" 2>/dev/null | head -1)
    
    if [ -n "$CERT_FILE" ]; then
        echo "Found certificate: $CERT_FILE"
        read -p "Move this file to ~/.cloudflared/cert.pem? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            mv "$CERT_FILE" ~/.cloudflared/cert.pem
            echo -e "${GREEN}✓ Certificate moved successfully${NC}"
        fi
    else
        echo ""
        echo -e "${RED}Certificate not found!${NC}"
        echo ""
        echo "Please manually:"
        echo "1. Find the cert.pem file in your Downloads folder"
        echo "2. Move it to: ~/.cloudflared/cert.pem"
        echo "3. Run this script again"
        exit 1
    fi
fi

# Verify cert exists
if [ ! -f ~/.cloudflared/cert.pem ]; then
    echo -e "${RED}Authentication failed - cert.pem not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Authentication successful${NC}"
echo ""
echo "=========================================="
echo "  Creating Tunnel"
echo "=========================================="
echo ""

# Create tunnel
TUNNEL_NAME="documan-tunnel-$(date +%s)"
echo "Creating tunnel: $TUNNEL_NAME"
cloudflared tunnel create $TUNNEL_NAME

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')

if [ -z "$TUNNEL_ID" ]; then
    echo -e "${RED}Failed to create tunnel${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Tunnel created successfully${NC}"
echo "Tunnel ID: $TUNNEL_ID"
echo "Tunnel Name: $TUNNEL_NAME"

# Create config directory
mkdir -p ~/.cloudflared

# Create tunnel configuration
cat > ~/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  # Route all traffic to nginx (which handles routing to frontend/backend)
  - hostname: "*"
    service: http://localhost:80
  
  # This is required as a catch-all rule
  - service: http_status:404
EOF

echo ""
echo -e "${GREEN}✓ Configuration file created at ~/.cloudflared/config.yml${NC}"
echo ""
echo "=========================================="
echo "  DNS Configuration"
echo "=========================================="
echo ""
echo "You need to create a DNS record to route traffic to your tunnel."
echo ""
echo "Option 1: Use Cloudflare's auto-generated domain (easier)"
read -p "Enter a subdomain name (e.g., 'documan-demo'): " SUBDOMAIN

# Route DNS to tunnel
cloudflared tunnel route dns $TUNNEL_NAME $SUBDOMAIN.trycloudflare.com

echo ""
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo ""
echo "=========================================="
echo "  Summary"
echo "=========================================="
echo "Tunnel ID: $TUNNEL_ID"
echo "Tunnel Name: $TUNNEL_NAME"
echo "Your app will be available at: https://$SUBDOMAIN.trycloudflare.com"
echo ""
echo "=========================================="
echo "  Next Steps"
echo "=========================================="
echo "1. Start your Docker containers:"
echo "   docker compose up -d"
echo ""
echo "2. Start the Cloudflare tunnel:"
echo "   ./start-cloudflare-tunnel.sh"
echo ""
echo "3. Access your app at:"
echo "   https://$SUBDOMAIN.trycloudflare.com"
echo ""
echo "=========================================="

# Save tunnel info for later use
cat > .cloudflare-tunnel-info <<EOF
TUNNEL_ID=$TUNNEL_ID
TUNNEL_NAME=$TUNNEL_NAME
TUNNEL_URL=https://$SUBDOMAIN.trycloudflare.com
EOF

echo ""
echo -e "${YELLOW}Note: Keep the tunnel running to maintain access${NC}"
echo -e "${YELLOW}To stop: Press Ctrl+C in the tunnel terminal${NC}"
