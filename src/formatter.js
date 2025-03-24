"use strict";
/**
 * Formats GitHub webhook payloads into Google Chat-compatible messages
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatGithubWebhookForGoogleChat = formatGithubWebhookForGoogleChat;
/**
 * Formats a GitHub webhook payload for Google Chat
 * @param payload The GitHub webhook payload
 * @param eventType The GitHub event type from the X-GitHub-Event header
 * @returns A formatted message string for Google Chat
 */
function formatGithubWebhookForGoogleChat(payload, eventType) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let message = '';
    const repoName = ((_a = payload.repository) === null || _a === void 0 ? void 0 : _a.full_name) || 'unknown repository';
    switch (eventType) {
        case 'ping':
            message = `🔔 GitHub webhook successfully connected for *${repoName}*`;
            break;
        case 'push':
            const branch = ((_b = payload.ref) === null || _b === void 0 ? void 0 : _b.replace('refs/heads/', '')) || 'unknown branch';
            const commitCount = ((_c = payload.commits) === null || _c === void 0 ? void 0 : _c.length) || 0;
            const committer = ((_d = payload.pusher) === null || _d === void 0 ? void 0 : _d.name) || 'Someone';
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
            message = `🌱 New ${refType} *${payload.ref}* created in *${repoName}* by *${(_e = payload.sender) === null || _e === void 0 ? void 0 : _e.login}*`;
            break;
        case 'pull_request':
            const prAction = payload.action || 'updated';
            const prTitle = ((_f = payload.pull_request) === null || _f === void 0 ? void 0 : _f.title) || '';
            const prNumber = ((_g = payload.pull_request) === null || _g === void 0 ? void 0 : _g.number) || '';
            const prUrl = ((_h = payload.pull_request) === null || _h === void 0 ? void 0 : _h.html_url) || '';
            message = `📌 Pull Request #${prNumber} ${prAction}: *${prTitle}*\n${prUrl}`;
            break;
        default:
            message = `📢 GitHub ${eventType} event received from *${repoName}*`;
    }
    return message;
}
