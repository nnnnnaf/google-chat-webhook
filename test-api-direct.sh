#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Use the VERCEL_APP_URL environment variable, or fall back to default if not set
WEBHOOK_BASE_URL="${VERCEL_APP_URL:-https://google-chat-webhook-two.vercel.app}"

echo "Testing x-hawk-be webhook direct API access..."
curl -v -X POST "${WEBHOOK_BASE_URL}/api/x-hawk-be.js" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": {"full_name": "theafenterprise/x-hawk-be"},
    "pusher": {"name": "testuser"},
    "ref": "refs/heads/main",
    "commits": [
      {
        "id": "abcdef1234567890abcdef1234567890abcdef12",
        "message": "Test x-hawk-be webhook direct API",
        "author": {"name": "Test User"}
      }
    ]
  }'

echo -e "\n\nTesting self-hosted-cloud-platform webhook direct API access..."
curl -v -X POST "${WEBHOOK_BASE_URL}/api/self-hosted-cloud-platform.js" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": {"full_name": "theafenterprise/self-hosted-cloud-platform"},
    "pusher": {"name": "testuser"},
    "ref": "refs/heads/main",
    "commits": [
      {
        "id": "fedcba0987654321fedcba0987654321fedcba09",
        "message": "Test self-hosted-cloud-platform webhook direct API",
        "author": {"name": "Test User"}
      }
    ]
  }'

echo "" 