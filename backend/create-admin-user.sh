#!/bin/bash

API_URL="http://localhost:3000/api"

# Register an admin user
echo "Creating admin test user..."

ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "adminuser'$(date +%s)'",
    "email": "admin'$(date +%s)'@example.com",
    "password": "AdminPass@123",
    "name": "Admin Test User"
  }')

echo "Response: $ADMIN_RESPONSE" | head -c 300
echo "..."

# Extract token and user ID
TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$ADMIN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo ""
echo "Token: ${TOKEN:0:50}..."
echo "User ID: $USER_ID"

# Save to file for later use
cat > /tmp/admin_token.sh << ADMIN
export ADMIN_TOKEN='$TOKEN'
export ADMIN_USER_ID='$USER_ID'
ADMIN

echo ""
echo "Admin credentials saved to /tmp/admin_token.sh"
source /tmp/admin_token.sh
echo "export ADMIN_TOKEN='$TOKEN'" 
echo "export ADMIN_USER_ID='$USER_ID'"
