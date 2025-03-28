# GitHub to Google Chat Webhook Proxy

A simple webhook proxy service that transforms GitHub webhook payloads into Google Chat-compatible messages.

## Problem Solved

GitHub webhooks send complex JSON payloads that Google Chat cannot process directly. This service:

1. Receives GitHub webhook payloads
2. Transforms them into simple text messages
3. Forwards them to Google Chat

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```
4. Edit `.env` and add your Google Chat webhook URLs:
   ```
   GOOGLE_CHAT_WEBHOOKS={"default":"https://chat.googleapis.com/v1/spaces/YOUR_SPACE_ID/messages?key=YOUR_KEY&token=YOUR_TOKEN","project1":"https://chat.googleapis.com/v1/spaces/ANOTHER_SPACE/messages?key=YOUR_KEY&token=ANOTHER_TOKEN"}
   
   # If you're deploying to Vercel, set your app URL
   VERCEL_APP_URL=https://your-app-name.vercel.app
   ```

## Usage

### Development Mode

```
npm run dev
```

### Production Mode

```
npm run build
npm start
```

## Configure GitHub Webhook

1. Go to your GitHub repository
2. Navigate to Settings > Webhooks
3. Click "Add webhook"
4. Set the Payload URL to your deployed service URL + "/webhook" or "/webhook/projectName" (e.g., `https://your-service.com/webhook/project1`)
5. Set Content type to `application/json`
6. Select which events you want notifications for:
   - **Push** - for commits
   - **Pull requests** - for PR events
   - **Issue comments** - for comments on issues and PRs
   - **Pull request review comments** - for review comments
   - **Commit comments** - for comments on commits
7. Click "Add webhook"

## Multiple Projects/Repositories Support

This service supports routing webhooks to different Google Chat spaces based on project/repository:

1. Configure multiple webhook URLs in your `.env` file:
   ```
   GOOGLE_CHAT_WEBHOOKS={"default":"URL1","frontend":"URL2","backend":"URL3"}
   ```

2. Use the project name in the webhook URL:
   ```
   https://your-service.com/webhook/frontend
   ```

3. If no project is specified, the `DEFAULT_WEBHOOK_KEY` will be used (default is "default")

## Testing

### Formatter Testing

Test webhook formatting without sending messages to Google Chat:

```bash
# Test with built-in examples
./test-formatter.sh issues                   # Test issues event
./test-formatter.sh issue_comment            # Test issue comment event

# Test with a custom JSON file
./test-formatter.sh issue_comment example-payload.json

# Test with piped payload
cat example-payload.json | ./test-formatter.sh issue_comment -
```

The script will:
1. Start the local server (if not running)
2. Process the webhook payload
3. Show exactly what would be sent to Google Chat 
4. Stop the server when done

## Supported GitHub Events

This service provides formatted messages for:

- Repository creation
- Commits/pushes
- Branch/tag creation
- Pull requests
- Issue comments
- Pull request review comments
- Commit comments
- And more!

## Customizing Notifications

To customize how notifications appear, edit the `src/formatter.ts` file.