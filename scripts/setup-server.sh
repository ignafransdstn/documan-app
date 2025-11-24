#!/bin/bash

###############################################################################
# UpCloud Server Setup Script for DocuMan
# This script installs all required dependencies on Ubuntu 22.04
###############################################################################

set -e  # Exit on error

echo "=================================================="
echo "DocuMan - UpCloud Server Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Please run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${GREEN}[1/7] Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

echo -e "${GREEN}[2/7] Installing essential tools...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

echo -e "${GREEN}[3/7] Installing Docker...${NC}"
# Remove old Docker versions
apt-get remove -y docker docker-engine docker.io containerd runc || true

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
systemctl start docker
systemctl enable docker

echo -e "${GREEN}[4/7] Installing Docker Compose...${NC}"
# Docker Compose v2 is installed with docker-compose-plugin
# Create alias for backward compatibility
echo 'alias docker-compose="docker compose"' >> /root/.bashrc

# Test Docker
docker --version
docker compose version

echo -e "${GREEN}[5/7] Setting up firewall (UFW)...${NC}"
apt-get install -y ufw

# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

echo -e "${GREEN}[6/7] Installing monitoring tools...${NC}"
apt-get install -y htop ncdu net-tools

echo -e "${GREEN}[7/7] Creating deployment directory...${NC}"
mkdir -p /opt/documan
cd /opt/documan

echo ""
echo -e "${GREEN}=================================================="
echo "Setup Complete!"
echo "==================================================${NC}"
echo ""
echo "Installed:"
echo "  ✅ Docker $(docker --version | cut -d' ' -f3)"
echo "  ✅ Docker Compose $(docker compose version | cut -d' ' -f4)"
echo "  ✅ UFW Firewall"
echo "  ✅ Monitoring tools"
echo ""
echo "Firewall rules:"
echo "  ✅ Port 22 (SSH) - OPEN"
echo "  ✅ Port 80 (HTTP) - OPEN"
echo "  ✅ Port 443 (HTTPS) - OPEN"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Clone your repository to /opt/documan"
echo "  2. Configure .env file"
echo "  3. Run ./deploy.sh"
echo ""
