/**
 * Helper functions for emoji selection
 */

/**
 * Gets the appropriate emoji for a workflow/job/check status
 * @param status The status (completed, in_progress, etc)
 * @param conclusion The conclusion (success, failure, etc) - only relevant for completed status
 * @returns The appropriate emoji
 */
export function getStatusEmoji(status: string, conclusion?: string): string {
  // Default to in-progress
  let emoji = '🔄';
  
  if (status === 'completed') {
    if (conclusion === 'success') {
      emoji = '✅';
    } else if (conclusion === 'failure') {
      emoji = '❌';
    } else if (conclusion === 'cancelled') {
      emoji = '⚠️';
    } else {
      emoji = '❓';
    }
  }
  
  return emoji;
}

/**
 * Gets the appropriate emoji for an issue action
 * @param action The issue action (opened, closed, etc)
 * @returns The appropriate emoji
 */
export function getIssueEmoji(action: string): string {
  let emoji = '🐛'; // default
  
  if (action === 'closed') {
    emoji = '✅';
  } else if (action === 'opened') {
    emoji = '🔍';
  } else if (action === 'reopened') {
    emoji = '🔄';
  }
  
  return emoji;
} 