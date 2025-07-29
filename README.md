# AEM Content Protection Worker

A Cloudflare Worker that implements a three-tier content protection system for Adobe Experience Manager (AEM) websites. This worker intercepts requests to AEM pages and applies content protection based on metadata, replacing protected content with teaser fragments.

## 🚀 Local Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Cloudflare account (for deployment)

### Installation & Development
```bash
# Clone the repository
git clone <repository-url>
cd aem-protection-worker

# Install dependencies
npm install

# Start local development server
npm run dev

# The worker will be available at http://localhost:8787
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Deployment
```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## 🏗️ Architecture

The worker uses a modular architecture with separate handlers for different protection types and centralized configuration:

```
aem-protection-worker/
├── src/
│   ├── index.js                 # Main worker entry point
│   ├── config.js                # Centralized configuration
│   └── handlers/
│       ├── page-protection.js   # Page-level protection logic
│       ├── section-protection.js # Section-level protection logic
│       └── block-protection.js  # Block-level protection logic
├── test/
│   └── index.spec.js            # Test suite
├── package.json                 # Dependencies and scripts
├── wrangler.jsonc              # Cloudflare Workers configuration
├── vitest.config.js            # Test configuration
└── README.md                   # This documentation
```

### Key Dependencies
- **cheerio**: HTML parsing and DOM manipulation for content analysis
- **vitest**: Testing framework with Cloudflare Workers support
- **wrangler**: Cloudflare Workers CLI for development and deployment

## 🛡️ Protection System

The worker implements a hierarchical three-tier protection system:

### 1. Page-Level Protection (Highest Priority)
- **Trigger**: `<meta name="protected" content="true">` in page head
- **Action**: Replaces entire `<main>` content with teaser fragment
- **Teaser Source**: `<meta name="teaser" content="/path/to/teaser">` or default
- **Implementation**: Uses HTMLRewriter for streaming transformation

### 2. Section-Level Protection
- **Trigger**: Section metadata with `protected: true`
- **Action**: Replaces specific sections with teaser fragments
- **Structure**: 
  ```html
  <div class="section-metadata">
    <div>
      <div>protected</div>
      <div>true</div>
    </div>
    <div>
      <div>teaser</div>
      <div>/fragments/teasers/section-teaser</div>
    </div>
  </div>
  ```

### 3. Block-Level Protection (Lowest Priority)
Two protection mechanisms for blocks:

#### A. ID-Based Block Removal
- **Trigger**: Two blocks with same `id-X` class, one with `protected`
- **Action**: Removes the protected block when normal block exists
- **Example**:
  ```html
  <div class="table id-1 protected">...</div>  <!-- Removed -->
  <div class="table id-1">...</div>            <!-- Kept -->
  ```

#### B. Fragment-Based Teaser Replacement
- **Trigger**: Protected block with teaser structure
- **Action**: Replaces with teaser fragment
- **Structure**:
  ```html
  <div class="protected">
    <div>teaser</div>
    <div>/fragments/teasers/block-teaser</div>
  </div>
  ```

## 📋 Detailed Logic Flow

### Main Request Handler (`fetch`)

The `fetch` method orchestrates the entire protection process:

1. **URL Processing**: Extracts path and constructs full AEM URL
2. **Fragment Bypass**: Skips protection for fragment requests and config endpoints
3. **Content Fetching**: Retrieves original HTML from AEM backend
4. **Content Type Check**: Only processes HTML responses
5. **Protection Analysis**: 
   - Checks page-level protection first (exclusive)
   - Falls back to section/block protection if no page protection
6. **Content Transformation**: Applies appropriate protection logic
7. **Response Delivery**: Returns transformed content with original headers

### Modular Protection Handlers

#### Page Protection Handler (`src/handlers/page-protection.js`)
- **`checkPageLevelProtection($)`**: Examines meta tags for page protection
- **`applyPageLevelProtection()`**: Uses HTMLRewriter for streaming transformation
- **`generateFragmentHtml()`**: Creates teaser HTML for page-level protection

#### Section Protection Handler (`src/handlers/section-protection.js`)
- **`checkSectionLevelProtection($)`**: Analyzes sections and coordinates with block protection
- **`applySectionLevelProtection()`**: Replaces protected sections with teasers
- **`generateFragmentHtml()`**: Creates teaser HTML for section-level protection
- **Flow Management**: Coordinates with block protection when no section protection is found

#### Block Protection Handler (`src/handlers/block-protection.js`)
- **`checkBlockProtectionInSection()`**: Implements two-priority block protection system
- **`generateBlockFragmentHtml()`**: Creates teaser HTML for block-level protection

### Protection Logic Details

#### Page-Level Protection Logic

The page protection handler examines the page's meta tags to determine if page-level protection is needed. It looks for a protected meta tag set to "true" and extracts the teaser path from a teaser meta tag or uses the default teaser path.

When page-level protection is detected, the handler uses HTMLRewriter to perform streaming transformation of the entire main element, replacing it with the generated teaser fragment.

#### Section-Level Protection Logic

The section protection handler iterates through all sections within the main content area. For each section, it examines the section metadata to determine if protection is required. If section-level protection is found, it extracts the teaser path and marks the section for replacement.

If no section-level protection is detected, the handler delegates to the block protection handler to check for block-level protection within that section.

#### Block Protection Logic

The block protection handler implements a two-priority system for block protection:

**Priority 1: Fragment-Based Teaser Replacement**
- Searches for protected divs that contain teaser structure
- Identifies blocks with both "teaser" keyword and fragment path
- Replaces these blocks with teaser fragments

**Priority 2: ID-Based Block Removal**
- Finds blocks with ID-based classes (e.g., `id-1`, `id-2`)
- Identifies pairs where one block has the "protected" class
- Removes the protected block when a normal (non-protected) block with the same ID exists

### HTML Generation

The handlers generate teaser HTML that includes links back to the AEM origin. Each handler has its own HTML generation method that includes the full AEM origin URL in the generated links.

## ⚙️ Configuration

All configuration is centralized in `src/config.js`:

```javascript
export default {
  AEM_ORIGIN: 'https://main--www--cmegroup.aem.live',
  DEFAULT_PAGE_TEASER: '/fragments/teasers/content-teaser',
  DEFAULT_SECTION_TEASER: '/fragments/teasers/content-teaser',
  DEFAULT_BLOCK_TEASER: '/fragments/teasers/block-teaser',
  
  // Bypass paths that don't need protection logic
  BYPASS_PATHS: [
    '/fragments/',
    '/nav.plain.html',
    '/footer.plain.html',
    '/eds-config/'
  ],
  
  // Content types that should be processed
  HTML_CONTENT_TYPES: ['text/html'],
};
```

## 🔄 Request Flow

1. **Request Interception**: Worker receives request to AEM site
2. **Fragment Detection**: Checks if request is for fragments/config (bypass protection)
3. **Origin Fetch**: Retrieves content from AEM backend
4. **Content Analysis**: Parses HTML with Cheerio
5. **Protection Hierarchy**:
   - Page-level protection (exclusive - replaces entire main)
   - Section-level protection (replaces specific sections)
   - Block-level protection (removes or replaces blocks)
6. **Content Transformation**: Applies appropriate protection logic
7. **Response**: Returns transformed content with original headers

## 🎯 Benefits

- **Modularity**: Separate handlers for different protection types
- **Maintainability**: Clear separation of concerns and easy debugging
- **Configuration**: Centralized config for easy environment management
- **Flexibility**: Three-tier protection system handles various use cases
- **Performance**: Efficient streaming transformation for page-level protection
- **Testability**: Modular structure allows for isolated testing

## 🧪 Testing

The test suite validates basic worker functionality:

```bash
npm test
```

Tests verify that the worker responds correctly to requests and handles the protection logic as expected. 
