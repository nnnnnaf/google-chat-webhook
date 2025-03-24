// Serverless Express app for Vercel deployment
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Parse the webhooks configuration from environment
let googleChatWebhooks = {};
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

// Direct webhook endpoint for Vercel routing
app.post('/', (req, res) => {
  try {
    const eventType = req.headers['x-github-event'];
    const payload = req.body;
    // Use the project from query parameter or fall back to default
    const project = req.query.project || defaultWebhookKey;
    
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

// Format GitHub webhook payloads into Google Chat-compatible messages
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
    case 'create':
      const refType = payload.ref_type || 'reference';
      message = `🌱 New ${refType} *${payload.ref}* created in *${repoName}* by *${payload.sender?.login}*`;
      break;
    case 'pull_request':
      const prAction = payload.action || 'updated';
      const prTitle = payload.pull_request?.title || '';
      const prNumber = payload.pull_request?.number || '';
      const prUrl = payload.pull_request?.html_url || '';
      
      message = `📌 Pull Request #${prNumber} ${prAction}: *${prTitle}*\n${prUrl}`;
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
    case 'pull_request_review_comment':
      const prReviewNumber = payload.pull_request?.number || '';
      const prReviewTitle = payload.pull_request?.title || '';
      const reviewCommentAuthor = payload.comment?.user?.login || 'Someone';
      const reviewCommentBody = payload.comment?.body || '';
      const reviewCommentUrl = payload.comment?.html_url || '';
      
      message = `💭 New review comment on PR #${prReviewNumber}: *${prReviewTitle}*\n*${reviewCommentAuthor}* commented: _"${truncateComment(reviewCommentBody)}"_\n${reviewCommentUrl}`;
      break;
    case 'commit_comment':
      const commitId = payload.comment?.commit_id?.substring(0, 7) || '';
      const commitCommentAuthor = payload.comment?.user?.login || 'Someone';
      const commitCommentBody = payload.comment?.body || '';
      const commitCommentUrl = payload.comment?.html_url || '';
      
      message = `🔍 New comment on commit \`${commitId}\` in *${repoName}*\n*${commitCommentAuthor}* commented: _"${truncateComment(commitCommentBody)}"_\n${commitCommentUrl}`;
      break;
    default:
      message = `📢 GitHub ${eventType} event received from *${repoName}*`;
  }
  
  return message;
}

// Truncates a comment to a reasonable length for display
function truncateComment(comment, maxLength = 100) {
  comment = comment.replace(/\r?\n/g, ' ').trim();
  if (comment.length <= maxLength) {
    return comment;
  }
  return comment.substring(0, maxLength - 3) + '...';
}

// Export the Express app for Vercel
module.exports = app; 