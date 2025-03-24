#!/bin/bash

# Test the self-hosted-cloud-platform webhook directly
curl -X POST https://google-chat-webhook-two.vercel.app/api/index.js?project=self-hosted-cloud-platform \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": {"full_name": "theafenterprise/self-hosted-cloud-platform"},
    "pusher": {"name": "testuser"},
    "ref": "refs/heads/main",
    "commits": [
      {
        "id": "fedcba0987654321fedcba0987654321fedcba09",
        "message": "Test self-hosted-cloud-platform webhook - direct API",
        "author": {"name": "Test User"}
      }
    ]
  }'

echo "" 