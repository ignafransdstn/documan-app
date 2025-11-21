#!/bin/bash

###############################################################################
# DocuMan Deployment Script
# Description: Automated deployment to UpCloud VM
# Usage: ./deploy.sh
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         DocuMan Deployment Script               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production file not found!${NC}"
    echo -e "${YELLOW}Please create .env.production with your configuration.${NC}"
    exit 1
fi

# Load environment variables
echo -e "${YELLOW}Loading environment variables...${NC}"
cp .env.production .env
echo -e "${GREEN}✓ Environment loaded${NC}"
echo ""

# Check Docker installation
echo -e "${YELLOW}Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed!${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"
echo ""

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

# Remove old images (optional, uncomment if needed)
# echo -e "${YELLOW}Removing old images...${NC}"
# docker-compose down --rmi all 2>/dev/null || true

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✓ Images built successfully${NC}"
echo ""

# Start containers
echo -e "${YELLOW}Starting containers...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Containers started${NC}"
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check container status
echo -e "${YELLOW}Checking container status...${NC}"
docker-compose ps
echo ""

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
until docker exec documan-postgres pg_isready -U documan_user > /dev/null 2>&1; do
    echo -e "${YELLOW}  Waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
echo ""

# Wait for Backend to be ready
echo -e "${YELLOW}Waiting for Backend API to be ready...${NC}"
until curl -s -f http://localhost:5001/health > /dev/null 2>&1; do
    echo -e "${YELLOW}  Waiting for Backend API...${NC}"
    sleep 2
done
echo -e "${GREEN}✓ Backend API is ready${NC}"
echo ""

# Check if admin user exists, create if not
echo -e "${YELLOW}Checking admin user...${NC}"
docker exec documan-backend node src/scripts/createAdmin.js 2>/dev/null || true
echo -e "${GREEN}✓ Admin user configured${NC}"
echo ""

# Run health checks
echo -e "${YELLOW}Running health checks...${NC}"
./monitor.sh
echo ""

# Display access information
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Deployment Completed Successfully!        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Access Information:${NC}"
echo -e "${YELLOW}  Frontend:     ${NC}http://localhost:3000"
echo -e "${YELLOW}  Backend API:  ${NC}http://localhost:5001/api"
echo -e "${YELLOW}  API Docs:     ${NC}http://localhost:5001/api-docs"
echo -e "${YELLOW}  PostgreSQL:   ${NC}localhost:5432"
echo ""
echo -e "${BLUE}Default Admin Credentials:${NC}"
echo -e "${YELLOW}  Username:     ${NC}admin"
echo -e "${YELLOW}  Password:     ${NC}admin123"
echo ""
echo -e "${RED}⚠ IMPORTANT: Change the default admin password immediately!${NC}"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "${YELLOW}  View logs:        ${NC}docker-compose logs -f"
echo -e "${YELLOW}  Stop services:    ${NC}docker-compose down"
echo -e "${YELLOW}  Restart services: ${NC}docker-compose restart"
echo -e "${YELLOW}  Monitor system:   ${NC}./monitor.sh"
echo -e "${YELLOW}  Backup database:  ${NC}./backup-db.sh"
echo ""
