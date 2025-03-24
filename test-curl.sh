#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Use the VERCEL_APP_URL environment variable, or fall back to default if not set
WEBHOOK_BASE_URL="${VERCEL_APP_URL:-https://google-chat-webhook-two.vercel.app}"

echo "Testing x-hawk-be webhook..."
# Test x-hawk-be webhook
curl -X POST "${WEBHOOK_BASE_URL}/webhook/x-hawk-be" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": {"full_name": "theafenterprise/x-hawk-be"},
    "pusher": {"name": "testuser"},
    "ref": "refs/heads/main",
    "commits": [
      {
        "id": "abcdef1234567890abcdef1234567890abcdef12",
        "message": "Test x-hawk-be webhook",
        "author": {"name": "Test User"}
      }
    ]
  }'

# Output a blank line for readability
echo -e "\n\nTesting self-hosted-cloud-platform webhook..."
# Test self-hosted-cloud-platform webhook
curl -X POST "${WEBHOOK_BASE_URL}/webhook/self-hosted-cloud-platform" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": {"full_name": "theafenterprise/self-hosted-cloud-platform"},
    "pusher": {"name": "testuser"},
    "ref": "refs/heads/main",
    "commits": [
      {
        "id": "fedcba0987654321fedcba0987654321fedcba09",
        "message": "Test self-hosted-cloud-platform webhook",
        "author": {"name": "Test User"}
      }
    ]
  }'

echo "" 