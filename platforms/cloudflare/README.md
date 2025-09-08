# AEM Gated Content Protection Worker - Cloudflare

Server-side content filtering for AEM websites based on user authentication state.

## Overview

- **Authenticated users**: See premium content
- **Anonymous users**: See public content and teasers
- **Two-state system**: Simple authenticated vs anonymous logic
- **Three-level filtering**: Page, section, and block level protection

## Core Files

- `src/index.js` - Main EdgeWorker entry point
- `src/config.js` - Configuration settings  
- `src/handlers/auth.js` - Authentication handler (mock)
- `test/index.spec.js` - Test suite

## How It Works

1. **Check gating**: Skip processing if no `<meta name="gated" content="true">`
2. **Filter sections**: Remove sections with wrong `view` metadata
3. **Filter blocks**: Remove elements with wrong CSS classes

## Supported Content Structures

**Section-level**: Uses `section-metadata` with `view: logged-in/logged-out`  
**Block-level**: Uses CSS classes `.logged-in` and `.logged-out`

## Configuration

**AEM_ORIGIN**: Origin server URL  
**BYPASS_PATHS**: Paths that skip protection (fragments, nav, etc.)  
**HTML_CONTENT_TYPES**: Content types to process  

**Authentication**: Currently mocked - implement real auth logic in `auth.js`

## Features

- **Performance**: Early exits, bypass paths, minimal DOM processing
- **Security**: Server-side only, fail-safe error handling
- **Compatibility**: Works with existing AEM content structures

## Development

```bash
npm install     # Setup
npm test        # Run tests  
npm run dev     # Local development
npm run deploy  # Deploy to Cloudflare
```

## Deployment

### Setup
1. Login to Cloudflare: `npx wrangler login`
2. Update `wrangler.jsonc` with your domain routes
3. Update `AEM_ORIGIN` in `src/config.js` 
4. Deploy: `npm run deploy`

### Configuration
```jsonc
// wrangler.jsonc
{
  "routes": [
    { "pattern": "your-domain.com/*", "zone_name": "your-domain.com" }
  ]
}
```

```javascript
// src/config.js
export default {
  AEM_ORIGIN: 'https://main--your-site--your-org.aem.live',
  // ... other config
};
```

### Authentication
Update `src/handlers/auth.js` with your authentication logic:
```javascript
checkAuthentication(request) {
  // Check headers, cookies, tokens, etc.
  return false; // Currently mocked
}
```

### Monitoring
```bash
npx wrangler tail              # View logs
npx wrangler deployments list # Check deployments
```

## Dependencies

- **cheerio** - HTML parsing
- **vitest** - Testing
- **wrangler** - Cloudflare deployment
