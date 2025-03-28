#!/bin/bash

# This script tests the formatter directly without sending to Google Chat
# Usage: 
#   ./test-formatter.sh <event_type> [payload_file]
#   echo '{"key":"value"}' | ./test-formatter.sh <event_type> -
#
# Examples:
#   ./test-formatter.sh issues                    # Use default issues payload
#   ./test-formatter.sh issues my-payload.json    # Use payload from file
#   cat my-payload.json | ./test-formatter.sh issues -  # Use payload from stdin

# Default event type if not provided
EVENT_TYPE=${1:-"issue_comment"}
PAYLOAD_FILE=${2:-""}

# Start the local dev server if not already running
# (Comment this out if you're running the server separately)
echo "Starting the server in the background..."
npm run dev &
SERVER_PID=$!

# Give the server time to start
sleep 2

echo "Testing formatter with ${EVENT_TYPE} event..."

# Determine the payload source
if [ -n "$PAYLOAD_FILE" ] && [ "$PAYLOAD_FILE" != "-" ]; then
  # Load payload from file
  if [ -f "$PAYLOAD_FILE" ]; then
    echo "Using payload from file: $PAYLOAD_FILE"
    PAYLOAD=$(cat "$PAYLOAD_FILE")
  else
    echo "Error: Payload file not found: $PAYLOAD_FILE"
    exit 1
  fi
elif [ "$PAYLOAD_FILE" = "-" ]; then
  # Read payload from stdin
  echo "Reading payload from stdin..."
  PAYLOAD=$(cat)
else
  # Use example payloads based on event type
  echo "Using default payload for $EVENT_TYPE event"
  if [ "$EVENT_TYPE" == "issues" ]; then
    PAYLOAD='{
      "action": "closed",
      "issue": {
        "url": "https://api.github.com/repos/theafenterprise/x-hawk-be/issues/14",
        "number": 14,
        "title": "[ADD-AUTHOR-011] Add Cron Job Functionality",
        "html_url": "https://github.com/theafenterprise/x-hawk-be/issues/14"
      },
      "repository": {
        "full_name": "theafenterprise/x-hawk-be"
      },
      "sender": {
        "login": "ryan-j-cooke"
      }
    }'
  elif [ "$EVENT_TYPE" == "issue_comment" ]; then
    PAYLOAD='{
      "action": "created",
      "issue": {
        "url": "https://api.github.com/repos/theafenterprise/self-hosted-cloud-platform/issues/4",
        "number": 4,
        "title": "[SIMPLE-002] Docker Swarm and Service Deployment",
        "html_url": "https://github.com/theafenterprise/self-hosted-cloud-platform/issues/4"
      },
      "comment": {
        "url": "https://api.github.com/repos/theafenterprise/self-hosted-cloud-platform/issues/comments/2760119246",
        "html_url": "https://github.com/theafenterprise/self-hosted-cloud-platform/issues/4#issuecomment-2760119246",
        "user": {
          "login": "fadidevv"
        },
        "body": "### Update:\n\n### The last tasks is done:\n\n9. Basic Node.js test service deployed and accessible via configured domain\n10. Test service deployment with a simple hello-world Node.js application before proceeding to actual services."
      },
      "repository": {
        "full_name": "theafenterprise/self-hosted-cloud-platform"
      },
      "sender": {
        "login": "fadidevv"
      }
    }'
  else
    PAYLOAD='{
      "repository": {"full_name": "theafenterprise/test-repo"},
      "sender": {"login": "testuser"}
    }'
  fi
fi

# Use curl with -s (silent) flag to avoid progress info, but keep errors visible
# Add --dry-run flag to not actually send the message to Google Chat
curl -s -X POST "http://localhost:3001/webhook/test?dry-run=true" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ${EVENT_TYPE}" \
  -d "${PAYLOAD}" | jq .

# Kill the server if we started it
if [ -n "$SERVER_PID" ]; then
  echo "Stopping the server..."
  kill $SERVER_PID
fi

echo "Test complete." 