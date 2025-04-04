# Shared Libraries

This directory contains shared code that is used across both the main server and the serverless API functions.

## Files

- `types.ts` - TypeScript interfaces for GitHub webhook payloads
- `emoji.ts` - Helper functions for selecting emoji based on event status
- `formatter.ts` - Main formatter logic that converts webhook payloads to Google Chat messages
- `formatter.cjs` - CommonJS wrapper for the formatter to be used in non-TypeScript environments

## Architecture

The code is organized this way:

1. TypeScript interfaces define the expected shape of data (`types.ts`)
2. Helper functions are extracted for reuse (`emoji.ts`)
3. Main business logic is in the formatter module (`formatter.ts`)
4. A CommonJS wrapper makes the compiled TypeScript accessible to the API directory (`formatter.cjs`)

## Usage

### In TypeScript files

```typescript
import { formatGithubWebhookForGoogleChat } from './shared/formatter';

// Format a webhook payload
const message = formatGithubWebhookForGoogleChat(payload, eventType);
```

### In JavaScript files (CommonJS)

```javascript
const { formatGithubWebhookForGoogleChat } = require('../src/shared/formatter.cjs');

// Format a webhook payload
const message = formatGithubWebhookForGoogleChat(payload, eventType);
``` 