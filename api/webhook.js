// Dedicated webhook handler for Vercel serverless
const axios = require('axios');
const dotenv = require('dotenv');
const { formatGithubWebhookForGoogleChat, truncateComment } = require('../src/shared/formatter.cjs');

// Load environment variables
dotenv.config();

// Parse the webhooks configuration from environment
let googleChatWebhooks = {};
try {
  googleChatWebhooks = JSON.parse(process.env.GOOGLE_CHAT_WEBHOOKS || '{}');
  console.log("Available webhook keys:", Object.keys(googleChatWebhooks));
} catch (err) {
  console.error('Error parsing GOOGLE_CHAT_WEBHOOKS:', err);
  googleChatWebhooks = {};
}

const defaultWebhookKey = process.env.DEFAULT_WEBHOOK_KEY || 'default';
console.log("Default webhook key:", defaultWebhookKey);

// Webhook handler function
module.exports = async (req, res) => {
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  console.log("Request path:", req.url.split('?')[0]);
  console.log("Request query:", req.query);
  console.log("GitHub Event Type:", req.headers['x-github-event']);
  console.log("GitHub Delivery ID:", req.headers['x-github-delivery']);
  
  // Only process POST requests
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  
  try {
    // 1. Extract the project name from the URL path
    let project = null;
    const pathParts = req.url.split('?')[0].split('/').filter(Boolean);
    
    console.log("Path parts:", pathParts);
    
    // Extract project from path
    if (pathParts.length > 0) {
      project = pathParts[pathParts.length - 1];
    }
    
    // If no project in path, check query parameter
    if (!project && req.query.project) {
      project = req.query.project;
    }
    
    // Fall back to default
    if (!project) {
      project = defaultWebhookKey;
    }
    
    console.log("Extracted project:", project);
    
    const eventType = req.headers['x-github-event'];
    const payload = req.body;
    
    console.log(`Received GitHub ${eventType} event for project: ${project}`);
    
    if (!eventType) {
      return res.status(400).send('Missing X-GitHub-Event header');
    }
    
    // Validate payload
    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      console.error(`Empty or invalid payload received for event type: ${eventType}`);
      return res.status(400).send('Empty or invalid payload');
    }
    
    // 2. Get the webhook URL for the specified project
    const webhookUrl = googleChatWebhooks[project];
    
    if (!webhookUrl) {
      console.error(`No webhook URL configured for project: ${project}`);
      return res.status(404).send(`No webhook configured for project: ${project}`);
    }
    
    // 3. Format the message for Google Chat
    console.log(`Formatting message for event type: ${eventType}`);
    const message = formatGithubWebhookForGoogleChat(payload, eventType);
    console.log(`Formatted message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
    
    // 4. Send to Google Chat
    try {
      const response = await axios.post(webhookUrl, { text: message });
      console.log(`Message successfully sent to Google Chat for project: ${project}`);
      console.log("Response status:", response.status);
      return res.status(200).send('Webhook processed successfully');
    } catch (error) {
      console.error(`Error sending to Google Chat for project ${project}:`, error.message);
      return res.status(500).send('Error sending to Google Chat');
    }
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    return res.status(500).send('Error processing webhook');
  }
}; 