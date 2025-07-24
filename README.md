# AEM Content Protection Worker

A Cloudflare Worker that implements a three-tier content protection system for Adobe Experience Manager (AEM) websites.

## 🏗️ Architecture

The codebase uses a monolithic structure with all functionality contained in a single `src/index.js` file for simplicity and ease of deployment:

```
src/
├── index.js                     # Main entry point with all protection logic
└── README.md                    # Documentation

test/
├── index.spec.js               # Test files
└── ...

package.json, wrangler.jsonc, etc.
```

## 🛡️ Protection Levels

### 1. Page-Level Protection
- **Trigger**: `<meta name="visibility" content="protected">`
- **Action**: Replaces entire `<main>` content with teaser
- **Teaser**: `<meta name="teaser" content="/path/to/teaser">`

### 2. Section-Level Protection
- **Trigger**: Section metadata with `visibility: protected`
- **Action**: Replaces specific sections with teasers
- **Structure**: 
  ```html
  <div class="section-metadata">
    <div>visibility</div>
    <div>protected</div>
    <div>teaser</div>
    <div>/fragments/teasers/section-teaser</div>
  </div>
  ```

### 3. Block-Level Protection
Two approaches for protecting content blocks:

#### Approach 1: ID-Based Removal
- **Trigger**: Two blocks with same `id-X` class, one with `protected`
- **Action**: Removes the protected block when normal block exists
- **Example**:
  ```html
  <div class="table id-1 protected">...</div>  <!-- Removed -->
  <div class="table id-1">...</div>            <!-- Kept -->
  ```

#### Approach 2: Fragment-Based Teaser
- **Trigger**: Protected block with teaser structure
- **Action**: Replaces with teaser fragment
- **Structure**:
  ```html
  <div class="protected">
    <div>teaser</div>
    <div>/fragments/teasers/block-teaser</div>
  </div>
  ```

## 🚀 Usage

### Development
```bash
npm install
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

## 📁 Code Structure

The `src/index.js` file contains all the protection logic organized into logical methods:

### Configuration
- `AEM_ORIGIN`: Target AEM site URL
- `DEFAULT_PAGE_TEASER`: Default teaser for page-level protection
- `DEFAULT_SECTION_TEASER`: Default teaser for section-level protection
- `DEFAULT_BLOCK_TEASER`: Default teaser for block-level protection

### HTML Generation
- `generateFragmentHtml(teaserPath)`: Generates section/page teaser HTML
- `generateBlockFragmentHtml(teaserPath)`: Generates block teaser HTML

### Protection Logic
- `checkPageLevelProtection($)`: Detects page-level protection
- `applyPageLevelProtection(html, teaserPath, originResponse)`: Applies page-level protection
- `checkSectionLevelProtection($)`: Detects section and block protection
- `applySectionLevelProtection($, html, protectionMetadata, originResponse)`: Applies section/block protection
- `checkBlockProtectionInSection($section, teaserBlocks, $)`: Handles block protection within sections

### Request Handling
- `handleHeaderFragment(request, aemUrl)`: Handles fragment requests with CORS
- `fetch(request)`: Main request handler and protection orchestrator

## 🔧 Configuration

All configuration is centralized at the top of `src/index.js`:

```javascript
export default {
  AEM_ORIGIN: "https://main--www--cmegroup.aem.page",
  DEFAULT_PAGE_TEASER: "/fragments/teasers/content-teaser",
  DEFAULT_SECTION_TEASER: "/fragments/teasers/content-teaser",
  DEFAULT_BLOCK_TEASER: "/fragments/teasers/block-teaser",
  // ... rest of the code
};
```

## 🎯 Benefits of Monolithic Structure

- **Simplicity**: Single file deployment and maintenance
- **Performance**: No module loading overhead
- **Reliability**: No import/export complexity
- **Debugging**: All code in one place for easier troubleshooting
- **Cloudflare Workers**: Optimized for single-file workers

## 🔄 Protection Flow

1. **Request Interception**: Worker intercepts requests to AEM site
2. **Fragment Bypass**: Fragment requests bypass protection logic
3. **Content Fetching**: Fetches original content from AEM backend
4. **Protection Detection**: 
   - Checks page-level protection via meta tags
   - Scans sections for section-level protection
   - Identifies block protection within sections
5. **Content Transformation**: 
   - Page-level: Uses HTMLRewriter for streaming transformation
   - Section/Block: Uses Cheerio for DOM manipulation and string replacement
6. **Response Delivery**: Returns transformed content with appropriate headers

## 🛠️ Dependencies

- `cheerio`: HTML parsing and DOM manipulation
- `vitest`: Testing framework
- `wrangler`: Cloudflare Workers deployment tool 