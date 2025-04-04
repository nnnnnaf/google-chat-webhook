/**
 * Formats GitHub webhook payloads into Google Chat-compatible messages
 * Re-exports from the shared formatter for backward compatibility
 */
export { formatGithubWebhookForGoogleChat, truncateComment } from './shared/formatter'; 