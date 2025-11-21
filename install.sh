#!/bin/bash

###############################################################################
# DocuMan Quick Start Script for UpCloud VM
# Description: One-command setup for new server
# Usage: curl -fsSL https://raw.githubusercontent.com/your-repo/install.sh | bash
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════╗
║                                                  ║
║              DocuMan Installation                ║
║       Document Management System Setup           ║
║                                                  ║
╚══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}[1/6] Updating system...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

# Install Docker
echo -e "${YELLOW}[2/6] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi
echo ""

# Install Docker Compose
echo -e "${YELLOW}[3/6] Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi
echo ""

# Install Nginx
echo -e "${YELLOW}[4/6] Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi
echo ""

# Configure Firewall
echo -e "${YELLOW}[5/6] Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

# Create application directory
echo -e "${YELLOW}[6/6] Setting up application directory...${NC}"
APP_DIR="/opt/documan"
mkdir -p "$APP_DIR"
cd "$APP_DIR"
echo -e "${GREEN}✓ Application directory created: $APP_DIR${NC}"
echo ""

# Display next steps
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Initial Setup Completed Successfully!      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Upload your project files to: ${NC}$APP_DIR"
echo -e "   ${GREEN}scp -r document-management-system root@your-server-ip:$APP_DIR/${NC}"
echo ""
echo -e "${YELLOW}2. Navigate to the project directory:${NC}"
echo -e "   ${GREEN}cd $APP_DIR/document-management-system${NC}"
echo ""
echo -e "${YELLOW}3. Configure environment variables:${NC}"
echo -e "   ${GREEN}cp .env.production .env${NC}"
echo -e "   ${GREEN}nano .env${NC}"
echo ""
echo -e "${YELLOW}4. Deploy the application:${NC}"
echo -e "   ${GREEN}chmod +x deploy.sh${NC}"
echo -e "   ${GREEN}./deploy.sh${NC}"
echo ""
echo -e "${YELLOW}5. Configure Nginx reverse proxy (see DEPLOYMENT-UPCLOUD.md)${NC}"
echo ""
echo -e "${BLUE}Installed Versions:${NC}"
docker --version
docker-compose --version
nginx -v
echo ""
