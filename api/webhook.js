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
    case 'workflow_job':
      const jobAction = payload.action || 'updated';
      const workflow = payload.workflow_job?.workflow_name || 'Unknown workflow';
      const jobName = payload.workflow_job?.name || 'Unknown job';
      const conclusion = payload.workflow_job?.conclusion || '';
      const status = payload.workflow_job?.status || 'unknown';
      const workflowBranch = payload.workflow_job?.head_branch || 'unknown branch';
      const runUrl = payload.workflow_job?.html_url || '';
      
      let jobEmoji = '🔄';
      if (status === 'completed') {
        jobEmoji = conclusion === 'success' ? '✅' : conclusion === 'failure' ? '❌' : conclusion === 'cancelled' ? '⚠️' : '❓';
      }
      
      // Only include conclusion if it exists and status is completed
      let workflowJobMessage = '';
      if (status === 'completed' && conclusion) {
        workflowJobMessage = `${jobEmoji} Workflow job *${jobName}* ${jobAction} with *${conclusion}*\n`;
      } else {
        workflowJobMessage = `${jobEmoji} Workflow job *${jobName}* ${jobAction}\n`;
      }
      
      message = workflowJobMessage;
      message += `*Workflow*: ${workflow}\n`;
      message += `*Branch*: ${workflowBranch}\n`;
      message += `*Status*: ${status}\n`;
      
      if (payload.workflow_job?.steps && payload.workflow_job.steps.length > 0 && status === 'completed' && conclusion !== 'success') {
        const failedSteps = payload.workflow_job.steps.filter((step) => step.conclusion !== 'success');
        if (failedSteps.length > 0) {
          message += `\nFailed steps:\n`;
          failedSteps.forEach((step) => {
            message += `• ${step.name}: ${step.conclusion}\n`;
          });
        }
      }
      
      message += `\n${runUrl}`;
      break;
    case 'check_suite':
      const checkSuiteAction = payload.action || 'updated';
      const checkSuiteStatus = payload.check_suite?.status || 'unknown';
      const checkSuiteConclusion = payload.check_suite?.conclusion || '';
      const checkSuiteUrl = payload.check_suite?.html_url || '';
      const checkSuiteBranch = payload.check_suite?.head_branch || 'unknown branch';
      
      let checkSuiteEmoji = '🔄';
      if (checkSuiteStatus === 'completed') {
        checkSuiteEmoji = checkSuiteConclusion === 'success' ? '✅' : checkSuiteConclusion === 'failure' ? '❌' : checkSuiteConclusion === 'cancelled' ? '⚠️' : '❓';
      }
      
      // Only include conclusion if it exists and status is completed
      let checkSuiteMessage = '';
      if (checkSuiteStatus === 'completed' && checkSuiteConclusion) {
        checkSuiteMessage = `${checkSuiteEmoji} Check suite ${checkSuiteAction} with *${checkSuiteConclusion}*\n`;
      } else {
        checkSuiteMessage = `${checkSuiteEmoji} Check suite ${checkSuiteAction}\n`;
      }
      
      message = checkSuiteMessage;
      message += `*Status*: ${checkSuiteStatus}\n`;
      message += `*Branch*: ${checkSuiteBranch}\n`;
      
      if (payload.check_suite?.pull_requests && payload.check_suite.pull_requests.length > 0) {
        const firstPR = payload.check_suite.pull_requests[0];
        message += `*PR*: #${firstPR.number}\n`;
      }
      
      if (checkSuiteUrl) {
        message += `\n${checkSuiteUrl}`;
      }
      break;
    case 'check_run':
      const checkRunAction = payload.action || 'updated';
      const checkRunName = payload.check_run?.name || 'Unknown check';
      const checkRunStatus = payload.check_run?.status || 'unknown';
      const checkRunConclusion = payload.check_run?.conclusion || '';
      const checkRunUrl = payload.check_run?.html_url || '';
      const checkRunBranch = payload.check_run?.check_suite?.head_branch || payload.check_run?.head_branch || 'unknown branch';
      
      let checkRunEmoji = '🔄';
      if (checkRunStatus === 'completed') {
        checkRunEmoji = checkRunConclusion === 'success' ? '✅' : checkRunConclusion === 'failure' ? '❌' : checkRunConclusion === 'cancelled' ? '⚠️' : '❓';
      }
      
      // Only include conclusion if it exists and status is completed
      let checkRunMessage = '';
      if (checkRunStatus === 'completed' && checkRunConclusion) {
        checkRunMessage = `${checkRunEmoji} Check run *${checkRunName}* ${checkRunAction} with *${checkRunConclusion}*\n`;
      } else {
        checkRunMessage = `${checkRunEmoji} Check run *${checkRunName}* ${checkRunAction}\n`;
      }
      
      message = checkRunMessage;
      message += `*Status*: ${checkRunStatus}\n`;
      message += `*Branch*: ${checkRunBranch}\n`;
      
      if (payload.check_run?.pull_requests && payload.check_run.pull_requests.length > 0) {
        const firstPR = payload.check_run.pull_requests[0];
        message += `*PR*: #${firstPR.number}\n`;
      }
      
      if (checkRunUrl) {
        message += `\n${checkRunUrl}`;
      }
      break;
    case 'workflow_run':
      const workflowRunAction = payload.action || 'updated';
      const workflowRunName = payload.workflow_run?.name || 'Unknown workflow';
      const workflowRunStatus = payload.workflow_run?.status || 'unknown';
      const workflowRunConclusion = payload.workflow_run?.conclusion || '';
      const workflowRunUrl = payload.workflow_run?.html_url || '';
      const workflowRunBranch = payload.workflow_run?.head_branch || 'unknown branch';
      
      let workflowRunEmoji = '🔄';
      if (workflowRunStatus === 'completed') {
        workflowRunEmoji = workflowRunConclusion === 'success' ? '✅' : workflowRunConclusion === 'failure' ? '❌' : workflowRunConclusion === 'cancelled' ? '⚠️' : '❓';
      }
      
      // Only include conclusion if it exists and status is completed
      let workflowRunMessage = '';
      if (workflowRunStatus === 'completed' && workflowRunConclusion) {
        workflowRunMessage = `${workflowRunEmoji} Workflow run *${workflowRunName}* ${workflowRunAction} with *${workflowRunConclusion}*\n`;
      } else {
        workflowRunMessage = `${workflowRunEmoji} Workflow run *${workflowRunName}* ${workflowRunAction}\n`;
      }
      
      message = workflowRunMessage;
      message += `*Status*: ${workflowRunStatus}\n`;
      message += `*Branch*: ${workflowRunBranch}\n`;
      message += `*Run By*: ${payload.sender?.login || 'Unknown'}\n`;
      
      if (workflowRunUrl) {
        message += `\n${workflowRunUrl}`;
      }
      break;
    case 'registry_package':
      const packageType = payload.registry_package?.package_type || 'unknown';
      const packageName = payload.registry_package?.name || 'unknown';
      const packageVersion = payload.registry_package?.package_version?.version || 'latest';
      const packageNamespace = payload.registry_package?.namespace || '';
      const packageAction = payload.action || 'updated';
      
      message = `📦 Package *${packageNamespace ? packageNamespace + '/' : ''}${packageName}* ${packageAction}\n`;
      message += `*Type*: ${packageType}\n`;
      message += `*Version*: ${packageVersion}\n`;
      message += `*Published by*: ${payload.sender?.login || 'Unknown'}\n`;
      
      if (payload.registry_package?.html_url) {
        message += `\n${payload.registry_package.html_url}`;
      }
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