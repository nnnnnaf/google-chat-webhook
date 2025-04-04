/**
 * Shared formatting logic for GitHub webhooks
 */
import { GitHubWebhookPayload } from './types';
import { getStatusEmoji, getIssueEmoji } from './emoji';

/**
 * Formats a GitHub webhook payload for Google Chat
 * @param payload The GitHub webhook payload
 * @param eventType The GitHub event type from the X-GitHub-Event header
 * @returns A formatted message string for Google Chat
 */
export function formatGithubWebhookForGoogleChat(payload: GitHubWebhookPayload, eventType: string): string {
  // Validate that we have a valid payload
  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
    return `⚠️ Received empty or invalid payload for GitHub ${eventType} event`;
  }
  
  let message = '';
  const repoName = payload.repository?.full_name || 'unknown repository';
  
  switch (eventType) {
    case 'ping':
      message = `🔔 GitHub webhook successfully connected for *${repoName}*`;
      break;
    case 'push':
      // Validate payload for push event
      if (!payload.ref || !payload.commits) {
        return `⚠️ Invalid push event payload: missing required fields`;
      }
      
      const branch = payload.ref?.replace('refs/heads/', '') || 'unknown branch';
      const commitCount = payload.commits?.length || 0;
      const committer = payload.pusher?.name || 'Someone';
      
      message = `🚀 *${committer}* pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''} to *${branch}* in *${repoName}*`;
      
      // Add commit details (limited to first 3)
      if (payload.commits && payload.commits.length > 0) {
        message += '\n\n';
        payload.commits.slice(0, 3).forEach((commit: any) => {
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
      // Validate payload for issues event
      if (!payload.issue || !payload.action) {
        return `⚠️ Invalid issues event payload: missing required fields`;
      }
      
      const issueAction = payload.action || 'updated';
      const issueNum = payload.issue?.number || '';
      const issueTitleText = payload.issue?.title || '';
      const issueUrl = payload.issue?.html_url || '';
      
      const emoji = getIssueEmoji(issueAction);
      
      message = `${emoji} Issue #${issueNum} ${issueAction}: *${issueTitleText}*\n`;
      
      if (issueAction === 'closed') {
        message += `Closed by *${payload.sender?.login || 'Someone'}*\n`;
      }
      
      message += `${issueUrl}`;
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
    case 'workflow_job':
      // Validate payload for workflow_job event
      if (!payload.workflow_job) {
        return `⚠️ Invalid workflow_job event payload: missing workflow_job data`;
      }
      
      const jobAction = payload.action || 'updated';
      const workflow = payload.workflow_job?.workflow_name || 'Unknown workflow';
      const jobName = payload.workflow_job?.name || 'Unknown job';
      const conclusion = payload.workflow_job?.conclusion || '';
      const status = payload.workflow_job?.status || 'unknown';
      const workflowBranch = payload.workflow_job?.head_branch || 'unknown branch';
      const runUrl = payload.workflow_job?.html_url || '';
      const runId = payload.workflow_job?.run_id || '';
      const headSha = payload.workflow_job?.head_sha?.substring(0, 7) || '';
      
      const jobEmoji = getStatusEmoji(status, conclusion);
      
      // Only include conclusion if it exists and status is completed
      let workflowJobMessage = '';
      if (status === 'completed' && conclusion) {
        workflowJobMessage = `${jobEmoji} Workflow job *${jobName}* ${jobAction} with *${conclusion}*\n`;
      } else {
        workflowJobMessage = `${jobEmoji} Workflow job *${jobName}* ${jobAction}\n`;
      }
      
      message = workflowJobMessage;
      message += `*Workflow*: ${workflow}\n`;
      if (headSha) {
        message += `*Commit*: ${headSha}\n`;
      }
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
    case 'check_run':
      // Validate payload for check_run event
      if (!payload.check_run) {
        return `⚠️ Invalid check_run event payload: missing check_run data`;
      }
      
      const checkRunAction = payload.action || 'updated';
      const checkRunName = payload.check_run?.name || 'Unknown check';
      const checkRunStatus = payload.check_run?.status || 'unknown';
      const checkRunConclusion = payload.check_run?.conclusion || '';
      const checkRunUrl = payload.check_run?.html_url || '';
      const checkRunBranch = payload.check_run?.check_suite?.head_branch || payload.check_run?.head_branch || 'unknown branch';
      const checkRunSha = payload.check_run?.head_sha?.substring(0, 7) || '';
      
      const checkRunEmoji = getStatusEmoji(checkRunStatus, checkRunConclusion);
      
      // Only include conclusion if it exists and status is completed
      let checkRunMessage = '';
      if (checkRunStatus === 'completed' && checkRunConclusion) {
        checkRunMessage = `${checkRunEmoji} Check run *${checkRunName}* ${checkRunAction} with *${checkRunConclusion}*\n`;
      } else {
        checkRunMessage = `${checkRunEmoji} Check run *${checkRunName}* ${checkRunAction}\n`;
      }
      
      message = checkRunMessage;
      message += `*Status*: ${checkRunStatus}\n`;
      if (checkRunSha) {
        message += `*Commit*: ${checkRunSha}\n`;
      }
      message += `*Branch*: ${checkRunBranch}\n`;
      
      if (payload.check_run?.pull_requests && payload.check_run.pull_requests.length > 0) {
        const firstPR = payload.check_run.pull_requests[0];
        message += `*PR*: #${firstPR.number}\n`;
      }
      
      if (checkRunUrl) {
        message += `\n${checkRunUrl}`;
      }
      break;
    case 'check_suite':
      // Validate payload for check_suite event
      if (!payload.check_suite) {
        return `⚠️ Invalid check_suite event payload: missing check_suite data`;
      }
      
      const checkSuiteAction = payload.action || 'updated';
      const checkSuiteStatus = payload.check_suite?.status || 'unknown';
      const checkSuiteConclusion = payload.check_suite?.conclusion || '';
      const checkSuiteUrl = payload.check_suite?.html_url || '';
      const checkSuiteBranch = payload.check_suite?.head_branch || 'unknown branch';
      const checkSuiteSha = payload.check_suite?.head_sha?.substring(0, 7) || '';
      
      const checkSuiteEmoji = getStatusEmoji(checkSuiteStatus, checkSuiteConclusion);
      
      // Only include conclusion if it exists and status is completed
      let checkSuiteMessage = '';
      if (checkSuiteStatus === 'completed' && checkSuiteConclusion) {
        checkSuiteMessage = `${checkSuiteEmoji} Check suite ${checkSuiteAction} with *${checkSuiteConclusion}*\n`;
      } else {
        checkSuiteMessage = `${checkSuiteEmoji} Check suite ${checkSuiteAction}\n`;
      }
      
      message = checkSuiteMessage;
      message += `*Status*: ${checkSuiteStatus}\n`;
      if (checkSuiteSha) {
        message += `*Commit*: ${checkSuiteSha}\n`;
      }
      message += `*Branch*: ${checkSuiteBranch}\n`;
      
      if (payload.check_suite?.pull_requests && payload.check_suite.pull_requests.length > 0) {
        const firstPR = payload.check_suite.pull_requests[0];
        message += `*PR*: #${firstPR.number}\n`;
      }
      
      if (checkSuiteUrl) {
        message += `\n${checkSuiteUrl}`;
      }
      break;
    case 'workflow_run':
      // Validate payload for workflow_run event
      if (!payload.workflow_run) {
        return `⚠️ Invalid workflow_run event payload: missing workflow_run data`;
      }
      
      const workflowRunAction = payload.action || 'updated';
      const workflowRunName = payload.workflow_run?.name || 'Unknown workflow';
      const workflowRunStatus = payload.workflow_run?.status || 'unknown';
      const workflowRunConclusion = payload.workflow_run?.conclusion || '';
      const workflowRunUrl = payload.workflow_run?.html_url || '';
      const workflowRunBranch = payload.workflow_run?.head_branch || 'unknown branch';
      const workflowRunTitle = payload.workflow_run?.display_title || '';
      const workflowRunEvent = payload.workflow_run?.event || '';
      
      const workflowRunEmoji = getStatusEmoji(workflowRunStatus, workflowRunConclusion);
      
      // Only include conclusion if it exists and status is completed
      let workflowRunMessage = '';
      if (workflowRunStatus === 'completed' && workflowRunConclusion) {
        workflowRunMessage = `${workflowRunEmoji} Workflow run *${workflowRunName}* ${workflowRunAction} with *${workflowRunConclusion}*\n`;
      } else {
        workflowRunMessage = `${workflowRunEmoji} Workflow run *${workflowRunName}* ${workflowRunAction}\n`;
      }
      
      message = workflowRunMessage;
      if (workflowRunTitle) {
        message += `*Title*: ${workflowRunTitle}\n`;
      }
      if (workflowRunEvent) {
        message += `*Event*: ${workflowRunEvent}\n`;
      }
      message += `*Status*: ${workflowRunStatus}\n`;
      message += `*Branch*: ${workflowRunBranch}\n`;
      message += `*Run By*: ${payload.sender?.login || 'Unknown'}\n`;
      
      if (workflowRunUrl) {
        message += `\n${workflowRunUrl}`;
      }
      break;
    case 'registry_package':
      // Validate payload for registry_package event
      if (!payload.registry_package) {
        return `⚠️ Invalid registry_package event payload: missing registry_package data`;
      }
      
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
    default:
      message = `📢 GitHub ${eventType} event received from *${repoName}*`;
  }
  
  return message;
}

/**
 * Truncates a comment to a reasonable length for display
 * @param comment The full comment text
 * @param maxLength Maximum length before truncation
 * @returns Truncated comment text
 */
export function truncateComment(comment: string, maxLength: number = 100): string {
  if (!comment) return '';
  
  comment = comment.replace(/\r?\n/g, ' ').trim();
  if (comment.length <= maxLength) {
    return comment;
  }
  return comment.substring(0, maxLength - 3) + '...';
} 