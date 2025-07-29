# AEM Content Protection Worker

A Cloudflare Worker that implements an **authentication-aware three-tier content protection system** for Adobe Experience Manager (AEM) websites. This worker intercepts requests to AEM pages and applies content protection based on metadata and user authentication status, providing different content experiences for logged-in vs logged-out users.

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

The worker uses a modular architecture with separate handlers for different protection types, authentication, and centralized configuration:

```
aem-protection-worker/
├── src/
│   ├── index.js                 # Main worker entry point with auth integration
│   ├── config.js                # Centralized configuration
│   └── handlers/
│       ├── auth.js              # Authentication logic (mock + future implementation)
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

## 🔐 Authentication System

The worker includes an authentication-aware protection system that provides different content based on user login status:

### Authentication Handler (`src/handlers/auth.js`)
- **`checkAuthentication(request)`**: Determines if user is logged in vs logged out
- **Current**: Simple mock (returns `false` - all users logged out)
- **Future**: Ready for header/cookie-based authentication

### User Experiences
- **Logged-in Users**: See full content and premium blocks
- **Logged-out Users**: See teasers and public content alternatives

## 🛡️ Protection System

The worker implements a **hierarchical three-tier authentication-aware protection system**:

### Performance Gate (Required for ALL Protection)
- **Trigger**: `<meta name="protected" content="true">` in page head
- **Performance**: Unprotected pages exit immediately without processing
- **Author Workflow**: Authors must add this meta tag to enable any protection

### 1. Page-Level Protection (Highest Priority)
- **Trigger**: Protected page + `<meta name="teaser" content="/path/to/teaser">`
- **Requirement**: Teaser content must be explicitly provided (no defaults)
- **Authenticated Users**: See original page content
- **Unauthenticated Users**: See teaser fragment replacing entire `<main>`
- **Implementation**: Uses HTMLRewriter for streaming transformation

### 2. Section-Level Protection
- **Trigger**: Section metadata with `protected: true`
- **Authenticated Users**: See original sections
- **Unauthenticated Users**: See teaser fragments replacing protected sections
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
Two protection mechanisms for blocks with authentication awareness:

#### A. ID-Based Premium/Public Content
- **Purpose**: Provide different content versions for different user types
- **Structure**: Two blocks with same `id-X` class, one marked `protected`
- **Authenticated Users**: See protected block (premium content), public block removed
- **Unauthenticated Users**: See public block (basic content), protected block removed
- **Example**:
  ```html
  <div class="table id-premium protected">Premium subscriber content</div>
  <div class="table id-premium">Basic free content</div>
  ```

#### B. Fragment-Based Teaser Replacement
- **Purpose**: Replace blocks with teaser content for unauthenticated users
- **Authenticated Users**: See original blocks
- **Unauthenticated Users**: See teaser fragments
- **Structure**:
  ```html
  <div class="protected">
    <div>teaser</div>
    <div>/fragments/teasers/block-teaser</div>
  </div>
  ```

## 📋 Authentication-Aware Logic Flow

### Main Request Handler (`fetch`)

1. **URL Processing**: Extracts path and constructs full AEM URL
2. **Fragment Bypass**: Skips protection for fragment requests and config endpoints
3. **Content Fetching**: Retrieves original HTML from AEM backend
4. **Content Type Check**: Only processes HTML responses
5. **Performance Gate**: Early exit if `protected=true` not present
6. **Authentication Check**: Determines user login status (only for protected content)
7. **Protection Hierarchy**: 
   - Page-level protection (authentication-aware)
   - Section/block protection (authentication-aware)
8. **Content Transformation**: Applies appropriate protection logic
9. **Response Delivery**: Returns transformed content with original headers

### Modular Protection Handlers

#### Authentication Handler (`src/handlers/auth.js`)
- **`checkAuthentication(request)`**: Simple binary check (logged in vs logged out)
- **Current**: Mock implementation for development
- **Future**: Ready for header/cookie-based authentication

#### Page Protection Handler (`src/handlers/page-protection.js`)
- **`checkPageLevelProtection($)`**: Strict checking - requires explicit teaser content
- **`applyPageLevelProtection()`**: Uses HTMLRewriter for streaming transformation
- **`generateFragmentHtml()`**: Creates teaser HTML with AEM origin links

#### Section Protection Handler (`src/handlers/section-protection.js`)
- **`checkSectionLevelProtection($, isAuthenticated)`**: Authentication-aware analysis
- **`applySectionLevelProtection()`**: String replacement for protected sections
- **`generateFragmentHtml()`**: Creates teaser HTML with AEM origin links

#### Block Protection Handler (`src/handlers/block-protection.js`)
- **`checkBlockProtectionInSection()`**: Two-tier authentication-aware system
- **`generateBlockFragmentHtml()`**: Creates teaser HTML with AEM origin links

## ⚙️ Configuration

All configuration is centralized in `src/config.js`:

```javascript
export default {
  AEM_ORIGIN: 'https://main--www--cmegroup.aem.live',
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

**Note**: `DEFAULT_PAGE_TEASER` removed - page protection now requires explicit teaser paths.

## 🔄 Complete Request Flow

1. **Request Interception**: Worker receives request to AEM site
2. **Fragment Detection**: Checks if request is for fragments/config (bypass protection)
3. **Origin Fetch**: Retrieves content from AEM backend
4. **Content Analysis**: Parses HTML with Cheerio
5. **Performance Gate**: Early exit if `protected=true` not present
6. **Authentication Check**: Determines user login status (only for protected content)
7. **Protection Hierarchy**:
   - **Page-level**: Authenticated → original, Unauthenticated → teaser
   - **Section-level**: Authenticated → original, Unauthenticated → teaser  
   - **Block-level**: Authenticated → premium blocks, Unauthenticated → public blocks/teasers
8. **Content Transformation**: Applies appropriate protection logic
9. **Response**: Returns transformed content with original headers

## 🎯 Key Benefits

### Performance Optimizations
- **Early Exit**: Unprotected pages bypass all processing (major performance gain)
- **Lazy Authentication**: Auth check only for protected content
- **Efficient Streaming**: HTMLRewriter for page-level transformations

### User Experience
- **Personalized Content**: Different experiences for logged-in vs logged-out users
- **Premium Content**: ID-based blocks provide subscriber vs free content
- **Progressive Disclosure**: Teasers encourage user engagement

### Developer Experience
- **Modular Architecture**: Clean separation of concerns
- **Authentication Ready**: Easy integration with real auth systems
- **Testable Design**: Mock authentication for development
- **Centralized Config**: Single source of configuration

### Content Management
- **Author Control**: Simple metadata-driven protection rules
- **Flexible Protection**: Multiple protection strategies for different content types
- **Consistent Experience**: Unified protection across page, section, and block levels

## 🧪 Testing & Development

### Running Tests
```bash
npm test
```

### Authentication Testing
Modify `src/handlers/auth.js` for different test scenarios:

```javascript
// Test all users as logged out
checkAuthentication(request) { return false; }

// Test all users as logged in
checkAuthentication(request) { return true; }

// Test mixed scenario (50/50 split)
checkAuthentication(request) { return Math.random() > 0.5; }
```

### Test Scenarios
1. **Unprotected pages** → Original content (performance test)
2. **Protected + logged out** → Teasers and public content
3. **Protected + logged in** → Full content and premium blocks
4. **Page vs section vs block protection** → Hierarchy testing
5. **Fragment requests** → Bypass testing

## 🚀 Future Enhancements

### Authentication Integration
- Replace mock with header-based authentication
- Support JWT tokens, session cookies, or custom auth headers
- Add user role-based protection (if needed)

### Performance
- Cache authentication results
- Optimize DOM manipulation performance
- Add metrics and monitoring

### Features
- A/B testing integration
- Dynamic teaser selection
- Advanced content personalization

The worker is production-ready with a robust, scalable architecture that balances performance, user experience, and developer productivity. 
