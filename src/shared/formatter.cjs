/**
 * CommonJS wrapper for the formatter
 * This is needed because the API directory uses CommonJS modules
 */

// Import the compiled formatter from dist
const { formatGithubWebhookForGoogleChat, truncateComment } = require('../../dist/shared/formatter');

// Re-export for CommonJS
module.exports = {
  formatGithubWebhookForGoogleChat,
  truncateComment,
}; 