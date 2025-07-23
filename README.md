# Protected Worker

A Cloudflare Worker that acts as a proxy/protection layer for Adobe Experience Manager (AEM) websites. This worker fetches content from an AEM site and applies protection logic to hide certain content from users, showing teaser fragments instead.

## Features

- **Header Fragment Bypass**: Special handling for navigation fragments
- **Page-Level Protection**: Replaces entire page content with teaser fragments when protected
- **Block-Level Protection**: Replaces individual protected blocks with teaser fragments
- **CORS Support**: Adds necessary CORS headers for cross-origin requests
- **Content Type Filtering**: Only processes HTML content, passes through other content types

## How It Works

1. **Request Processing**: The worker intercepts requests to the AEM site
2. **Content Fetching**: Fetches the original content from the AEM backend
3. **Protection Detection**: 
   - Checks for page-level protection via meta tags
   - Scans for block-level protection via CSS classes
4. **Content Transformation**: Uses HTMLRewriter to replace protected content with teaser fragments
5. **Response Delivery**: Returns the transformed content with appropriate headers

## Protection Types

### Page-Level Protection
- Detected by: `<meta name="visibility" content="protected">`
- Action: Replaces entire `<main>` content with a teaser fragment
- Fragment path: Extracted from `<meta name="teaser">` or defaults to `/fragments/teasers/video-teaser`

### Block-Level Protection
- Detected by: `div` elements with "protected" in their class names
- Action: Replaces each protected block with individual teaser fragments
- Fragment paths: Extracted from the last child div of each protected block

## Development

### Prerequisites
- Node.js
- Wrangler CLI

### Setup
```bash
npm install
```

### Local Development
```bash
npm run dev
```

### Testing
```bash
npm test
```

### Deployment
```bash
npm run deploy
```

## Configuration

The worker is configured via `wrangler.jsonc` and targets the AEM site at `https://issue-20--www--cmegroup.aem.page`.

## Dependencies

- `cheerio`: HTML parsing and manipulation
- `vitest`: Testing framework

## License

[Add your license here] 