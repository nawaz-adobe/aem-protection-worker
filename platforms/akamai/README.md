# AEM Protection Worker - Akamai EdgeWorkers

Two-state content gating system for AEM sites.

## Overview

- **Anonymous users**: See logged-out content only
- **Authenticated users**: See logged-in content only

## Core Files

- `src/main-standalone.js` - Main EdgeWorker logic (standalone, no dependencies)
- `bundle-production.json` - EdgeWorkers manifest

## Processing Flow

1. **Page Check**: Skip if no `<meta name="gated" content="true">`
2. **Section Filter**: Remove sections based on `section-metadata` view property
3. **Block Filter**: Remove blocks with `.logged-in/.logged-out` classes

## Supported Content Structures

### Section-Level Protection
```html
<div>
  <h2>Premium Content</h2>
  <div class="section-metadata">
    <div><div>view</div><div>logged-in</div></div>
  </div>
</div>
```

### Block-Level Protection
```html
<div class="brightcove logged-in">Premium Video</div>
<div class="fragment logged-out">Upgrade Teaser</div>
```

## Configuration

Update configuration in `src/main-standalone.js`:
```javascript
export default {
  AEM_ORIGIN: 'https://main--your-site--your-org.aem.live',
  BYPASS_PATHS: ['/fragments/', '/nav.plain.html'],
  HTML_CONTENT_TYPES: ['text/html'],
};
```

## Features

- Performance optimized for Akamai constraints (50ms execution, 32MB memory, 20MB bundle)
- Server-side only content protection
- Compatible with existing AEM content structures
- String-based HTML processing (no webpack overhead)

## Development

```bash
npm install           # Setup
npm test              # Run tests
npm run build:production  # Build for EdgeWorkers
npm run validate      # Validate constraints
npm run deploy        # Deploy to Akamai
```

## Deployment

### Setup
1. Build: `npm run build:production`
2. Validate: `npm run validate` 
3. Update `bundle-production.json` with your EdgeWorker ID
4. Deploy: `npm run deploy`

### Configuration
```javascript
// In src/main-standalone.js
export default {
  AEM_ORIGIN: 'https://main--your-site--your-org.aem.live',
  // ... other config
};
```

### Authentication
Update authentication in `src/main-standalone.js`:
```javascript
checkAuthentication(request) {
  // Check headers, cookies, tokens, etc.
  return false; // Currently mocked
}
```

### EdgeWorker Constraints
- **Bundle Size**: 20MB limit
- **Memory**: 32MB limit 
- **Execution**: 50ms limit

## Dependencies

- **vitest** - Testing
- **eslint** - Code quality
