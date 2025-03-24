"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const formatter_1 = require("./formatter");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const googleChatWebhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;
// Middleware
app.use(express_1.default.json());
// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('GitHub to Google Chat Webhook Service is running');
});
// GitHub webhook endpoint
app.post('/webhook', (req, res) => {
    try {
        const eventType = req.headers['x-github-event'];
        const payload = req.body;
        console.log(`Received GitHub ${eventType} event`);
        if (!eventType) {
            return res.status(400).send('Missing X-GitHub-Event header');
        }
        if (!googleChatWebhookUrl) {
            console.error('GOOGLE_CHAT_WEBHOOK_URL not configured');
            return res.status(500).send('Webhook URL not configured');
        }
        // Format the message for Google Chat
        const message = (0, formatter_1.formatGithubWebhookForGoogleChat)(payload, eventType);
        // Send to Google Chat
        axios_1.default.post(googleChatWebhookUrl, { text: message })
            .then(() => {
            console.log('Message successfully sent to Google Chat');
            res.status(200).send('Webhook processed successfully');
        })
            .catch((error) => {
            console.error('Error sending to Google Chat:', error);
            res.status(500).send('Error sending to Google Chat');
        });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Error processing webhook');
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (!googleChatWebhookUrl) {
        console.warn('WARNING: GOOGLE_CHAT_WEBHOOK_URL not set. The service will not forward messages to Google Chat.');
    }
});
