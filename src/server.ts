import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { formatGithubWebhookForGoogleChat } from './formatter';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Parse the webhooks configuration from environment
let googleChatWebhooks: Record<string, string> = {};
try {
  googleChatWebhooks = JSON.parse(process.env.GOOGLE_CHAT_WEBHOOKS || '{}');
} catch (err) {
  console.error('Error parsing GOOGLE_CHAT_WEBHOOKS:', err);
  googleChatWebhooks = {};
}

const defaultWebhookKey = process.env.DEFAULT_WEBHOOK_KEY || 'default';

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('GitHub to Google Chat Webhook Service is running');
});

// GitHub webhook endpoint
app.post('/webhook/:project?', (req, res) => {
  try {
    const eventType = req.headers['x-github-event'] as string;
    const payload = req.body;
    const project = req.params.project || defaultWebhookKey;
    
    console.log(`Received GitHub ${eventType} event for project: ${project}`);
    
    if (!eventType) {
      return res.status(400).send('Missing X-GitHub-Event header');
    }
    
    // Get the webhook URL for the specified project
    const webhookUrl = googleChatWebhooks[project];
    
    if (!webhookUrl) {
      console.error(`No webhook URL configured for project: ${project}`);
      return res.status(404).send(`No webhook configured for project: ${project}`);
    }
    
    // Format the message for Google Chat
    const message = formatGithubWebhookForGoogleChat(payload, eventType);
    
    // Send to Google Chat
    axios.post(webhookUrl, { text: message })
      .then(() => {
        console.log(`Message successfully sent to Google Chat for project: ${project}`);
        res.status(200).send('Webhook processed successfully');
      })
      .catch((error) => {
        console.error(`Error sending to Google Chat for project ${project}:`, error);
        res.status(500).send('Error sending to Google Chat');
      });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Only start the server when running directly (not when imported)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    
    // Check webhook configuration
    const webhookCount = Object.keys(googleChatWebhooks).length;
    if (webhookCount === 0) {
      console.warn('WARNING: No Google Chat webhooks configured. The service will not forward messages.');
    } else {
      console.log(`Configured with ${webhookCount} webhook destinations: ${Object.keys(googleChatWebhooks).join(', ')}`);
      
      if (!googleChatWebhooks[defaultWebhookKey]) {
        console.warn(`WARNING: Default webhook key "${defaultWebhookKey}" not found in configuration.`);
      }
    }
  });
}

// Export the Express app for serverless environments
export { app }; 