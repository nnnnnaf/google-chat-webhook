// Dedicated webhook handler for Vercel serverless
const axios = require('axios');
const dotenv = require('dotenv');

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

/**
 * Formats GitHub webhook payloads into Google Chat-compatible messages
 */
function formatGithubWebhookForGoogleChat(payload, eventType) {
  let message = '';
  const repoName = payload.repository?.full_name || 'unknown repository';
  
  switch (eventType) {
    case 'ping':
      message = `🔔 GitHub webhook successfully connected for *${repoName}*`;
      break;
    case 'push':
      const branch = payload.ref?.replace('refs/heads/', '') || 'unknown branch';
      const commitCount = payload.commits?.length || 0;
      const committer = payload.pusher?.name || 'Someone';
      
      message = `🚀 *${committer}* pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''} to *${branch}* in *${repoName}*`;
      
      // Add commit details (limited to first 3)
      if (payload.commits && payload.commits.length > 0) {
        message += '\n\n';
        payload.commits.slice(0, 3).forEach((commit) => {
          const shortHash = commit.id.substring(0, 7);
          const commitMsg = commit.message.split('\n')[0]; // First line only
          message += `• \`${shortHash}\`: ${commitMsg}\n`;
        });
        
        if (payload.commits.length > 3) {
          message += `_...and ${payload.commits.length - 3} more commits_`;
        }
      }
      break;
    case 'issues':
      const issueAction = payload.action || 'updated';
      const issueNum = payload.issue?.number || '';
      const issueTitleText = payload.issue?.title || '';
      const issueUrl = payload.issue?.html_url || '';
      
      let emoji = '🐛';
      if (issueAction === 'closed') emoji = '✅';
      else if (issueAction === 'opened') emoji = '🔍';
      else if (issueAction === 'reopened') emoji = '🔄';
      
      message = `${emoji} Issue #${issueNum} ${issueAction}: *${issueTitleText}*\n`;
      
      if (issueAction === 'closed') {
        message += `Closed by *${payload.sender?.login || 'Someone'}*\n`;
      }
      
      message += `${issueUrl}`;
      break;
    case 'issue_comment':
      const issueNumber = payload.issue?.number || '';
      const issueTitle = payload.issue?.title || '';
      const commentAuthor = payload.comment?.user?.login || 'Someone';
      const commentBody = payload.comment?.body || '';
      const commentUrl = payload.comment?.html_url || '';
      const isPR = payload.issue?.pull_request ? 'PR' : 'Issue';
      
      message = `💬 New comment on ${isPR} #${issueNumber}: *${issueTitle}*\n*${commentAuthor}* commented: _"${truncateComment(commentBody)}"_\n${commentUrl}`;
      break;
    // Other event types handling...
    default:
      message = `📢 GitHub ${eventType} event received from *${repoName}*`;
  }
  
  return message;
}

/**
 * Truncates a comment to a reasonable length for display
 */
function truncateComment(comment, maxLength = 100) {
  comment = comment.replace(/\r?\n/g, ' ').trim();
  if (comment.length <= maxLength) {
    return comment;
  }
  return comment.substring(0, maxLength - 3) + '...';
}

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