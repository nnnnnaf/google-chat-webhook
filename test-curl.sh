#!/bin/bash

# Test with curl
curl -X POST https://google-chat-webhook-two.vercel.app/webhook/x-hawk-be \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": {"full_name": "theafenterprise/x-hawk-be"},
    "pusher": {"name": "testuser"},
    "ref": "refs/heads/monitoring",
    "commits": [
      {
        "id": "c64e88805f8026efec92afe11f855d42522165a3",
        "message": "Test commit from curl",
        "author": {"name": "Test User"}
      }
    ]
  }'

# Output a blank line for readability
echo "" 