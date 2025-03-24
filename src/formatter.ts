/**
 * Formats GitHub webhook payloads into Google Chat-compatible messages
 */

/**
 * Formats a GitHub webhook payload for Google Chat
 * @param payload The GitHub webhook payload
 * @param eventType The GitHub event type from the X-GitHub-Event header
 * @returns A formatted message string for Google Chat
 */
export function formatGithubWebhookForGoogleChat(payload: any, eventType: string): string {
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

/**
 * Truncates a comment to a reasonable length for display
 * @param comment The full comment text
 * @param maxLength Maximum length before truncation
 * @returns Truncated comment text
 */
function truncateComment(comment: string, maxLength: number = 100): string {
  comment = comment.replace(/\r?\n/g, ' ').trim();
  if (comment.length <= maxLength) {
    return comment;
  }
  return comment.substring(0, maxLength - 3) + '...';
} 