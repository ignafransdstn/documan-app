#!/bin/bash

API_URL="http://localhost:3000/api"

echo "Registering new test user via public signup endpoint..."

SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser'$(date +%s)'",
    "email": "testuser'$(date +%s)'@example.com",
    "password": "TestPass@123",
    "name": "Test User"
  }')

echo "Signup response: $SIGNUP_RESPONSE"

# Extract token from response
TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo ""
  echo "✓ Token obtained successfully!"
  echo "Token: $TOKEN"
  echo ""
  echo "export AUTH_TOKEN='$TOKEN'" > /tmp/auth_token.sh
  source /tmp/auth_token.sh
  cat /tmp/auth_token.sh
else
  echo "✗ Failed to obtain token"
  echo "Full response: $SIGNUP_RESPONSE"
fi
