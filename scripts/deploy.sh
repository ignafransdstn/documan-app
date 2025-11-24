#!/bin/bash

###############################################################################
# DocuMan Deployment Script
# Deploys the application using Docker Compose
###############################################################################

set -e

echo "=================================================="
echo "DocuMan - Deployment Script"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating from template...${NC}"
    
    if [ -f .env.production ]; then
        cp .env.production .env
        echo -e "${YELLOW}⚠️  Please edit .env file and update:${NC}"
        echo "   - DB_PASSWORD"
        echo "   - JWT_SECRET"
        echo "   - ALLOWED_ORIGINS"
        echo "   - VITE_API_URL"
        echo ""
        read -p "Press Enter after editing .env file..."
    else
        echo -e "${RED}Error: .env.production template not found${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}[1/6] Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Please run setup-server.sh first${NC}"
    exit 1
fi

echo -e "${GREEN}[2/6] Stopping existing containers...${NC}"
docker compose down || true

echo -e "${GREEN}[3/6] Pulling latest code from GitHub...${NC}"
if [ -d .git ]; then
    git pull origin master
else
    echo -e "${YELLOW}Not a git repository. Skipping pull.${NC}"
fi

echo -e "${GREEN}[4/6] Building Docker images...${NC}"
docker compose build --no-cache

echo -e "${GREEN}[5/6] Starting containers...${NC}"
docker compose up -d

echo -e "${GREEN}[6/6] Waiting for services to be healthy...${NC}"
echo "This may take up to 2 minutes..."

# Wait for services
sleep 10

# Check health
for i in {1..30}; do
    if docker compose ps | grep -q "unhealthy"; then
        echo -e "${YELLOW}Services still starting... ($i/30)${NC}"
        sleep 5
    else
        echo -e "${GREEN}All services are healthy!${NC}"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}Services failed to start properly${NC}"
        docker compose ps
        docker compose logs --tail=50
        exit 1
    fi
done

echo ""
echo -e "${GREEN}=================================================="
echo "Deployment Complete!"
echo "==================================================${NC}"
echo ""
echo "Services status:"
docker compose ps
echo ""
echo -e "${BLUE}Access your application:${NC}"
echo "  🌐 Frontend: http://YOUR_SERVER_IP"
echo "  🔌 Backend API: http://YOUR_SERVER_IP/api"
echo "  📚 API Docs: http://YOUR_SERVER_IP/api-docs"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:        docker compose logs -f"
echo "  View logs (backend): docker compose logs -f backend"
echo "  Restart:          docker compose restart"
echo "  Stop:             docker compose down"
echo "  Status:           docker compose ps"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test the application"
echo "  2. Setup domain DNS (point A record to this server)"
echo "  3. Run ./setup-ssl.sh DOMAIN_NAME (after DNS propagation)"
echo ""
