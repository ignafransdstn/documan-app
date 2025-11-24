#!/bin/bash

###############################################################################
# SSL Setup Script using Let's Encrypt
# Run this AFTER domain DNS is configured
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}Usage: ./setup-ssl.sh YOUR_DOMAIN${NC}"
    echo "Example: ./setup-ssl.sh documan.com"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@${DOMAIN}"

echo "=================================================="
echo "SSL Certificate Setup"
echo "=================================================="
echo ""
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Check if domain points to this server
echo -e "${YELLOW}Checking DNS...${NC}"
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | head -n1)

echo "Server IP: $SERVER_IP"
echo "Domain IP: $DOMAIN_IP"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo -e "${RED}⚠️  Warning: Domain does not point to this server!${NC}"
    echo "Please update your DNS A record to point to: $SERVER_IP"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}[1/4] Updating nginx configuration...${NC}"
# Update domain in nginx config
sed -i "s/your-domain.com/$DOMAIN/g" nginx/sites-available/documan.conf

echo -e "${GREEN}[2/4] Reloading nginx...${NC}"
docker compose restart nginx

echo -e "${GREEN}[3/4] Obtaining SSL certificate...${NC}"
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

echo -e "${GREEN}[4/4] Enabling HTTPS in nginx...${NC}"
# Uncomment HTTPS server block
sed -i 's/# server {/server {/g' nginx/sites-available/documan.conf
sed -i 's/#     /    /g' nginx/sites-available/documan.conf
sed -i 's/# }/}/g' nginx/sites-available/documan.conf

# Comment out HTTP redirect
sed -i 's/^    # return 301/    return 301/g' nginx/sites-available/documan.conf

# Reload nginx
docker compose restart nginx

echo ""
echo -e "${GREEN}=================================================="
echo "SSL Setup Complete!"
echo "==================================================${NC}"
echo ""
echo -e "${GREEN}✅ HTTPS is now enabled!${NC}"
echo ""
echo "Access your application:"
echo "  🔒 https://$DOMAIN"
echo "  🔒 https://www.$DOMAIN"
echo ""
echo "Certificate will auto-renew via certbot container."
echo ""
