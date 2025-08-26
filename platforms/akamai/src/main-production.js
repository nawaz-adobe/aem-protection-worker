/**
 * AEM Content Protection Worker - Production Akamai EdgeWorkers Version
 * Optimized for EdgeWorkers constraints: 50ms execution, 32MB memory, ES modules
 * Uses lightweight string operations instead of DOM manipulation
 */

// EdgeWorkers imports (available at runtime)
import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';

// Configuration - inlined for performance
const CONFIG = {
  AEM_ORIGIN: 'https://main--www--cmegroup.aem.live',
  DEFAULT_SECTION_TEASER: '/fragments/teasers/content-teaser',
  DEFAULT_BLOCK_TEASER: '/fragments/teasers/block-teaser',
  
  // Bypass paths that don't need protection logic
  BYPASS_PATHS: [
    '/fragments/',
    '/nav.plain.html',
    '/footer.plain.html',
    '/eds-config/',
  ],
  
  // Content types that should be processed
  HTML_CONTENT_TYPES: ['text/html'],
};

/**
 * Simple authentication check
 * @param {Request} request - The incoming request
 * @returns {boolean} - True if user is logged in, false if logged out
 */
function checkAuthentication(_request) {
  // Simple mock - always return false for now (all users logged out)
  // TODO: Implement actual authentication logic checking headers/cookies
  return false;
}

/**
 * Fast string-based performance gate
 * @param {string} html - HTML content
 * @returns {boolean} - True if protection is needed
 */
function needsProtection(html) {
  // Ultra-fast check without regex
  return html.includes('name="protected"') && html.includes('content="true"');
}

/**
 * Generate teaser HTML
 * @param {string} teaserPath - Path to teaser content
 * @returns {string} - Teaser HTML
 */
function generateTeaserHtml(teaserPath) {
  return `<div><p><a href="${teaserPath}">${CONFIG.AEM_ORIGIN}${teaserPath}</a></p></div>`;
}

/**
 * Apply page-level protection using string replacement
 * @param {string} html - Original HTML
 * @returns {object} - {modified: boolean, html: string}
 */
function applyPageProtection(html) {
  // Look for page-level teaser meta tag
  const teaserMatch = html.match(/<meta\s+name=["']teaser["']\s+content=["']([^"']+)["']/i);
  
  if (teaserMatch) {
    const teaserPath = teaserMatch[1];
    const teaserHtml = generateTeaserHtml(teaserPath);
    
    // Replace main content with teaser
    const modifiedHtml = html.replace(
      /<main[^>]*>[\s\S]*?<\/main>/i,
      `<main>${teaserHtml}</main>`,
    );
    
    return { modified: true, html: modifiedHtml };
  }
  
  return { modified: false, html };
}

/**
 * Apply section-level protection using string replacement
 * @param {string} html - Original HTML
 * @returns {object} - {modified: boolean, html: string}
 */
function applySectionProtection(html) {
  let modifiedHtml = html;
  let modified = false;
  
  // Find sections with protection metadata
  // Pattern: <div>...<div class="section-metadata">...<div>protected</div><div>true</div>...
  const sectionPattern = /<div[^>]*>\s*<div[^>]*class=["'][^"']*section-metadata[^"']*["'][^>]*>[\s\S]*?<div[^>]*>\s*protected\s*<\/div>\s*<div[^>]*>\s*true\s*<\/div>[\s\S]*?<\/div>\s*<\/div>/gi;
  
  modifiedHtml = modifiedHtml.replace(sectionPattern, (match) => {
    modified = true;
    
    // Try to extract teaser path from the section metadata
    const teaserMatch = match.match(/<div[^>]*>\s*teaser\s*<\/div>\s*<div[^>]*>\s*([^<\s]+)\s*<\/div>/i);
    const teaserPath = teaserMatch ? teaserMatch[1].trim() : CONFIG.DEFAULT_SECTION_TEASER;
    
    return generateTeaserHtml(teaserPath);
  });
  
  return { modified, html: modifiedHtml };
}

/**
 * Apply block-level protection using string replacement
 * @param {string} html - Original HTML
 * @returns {object} - {modified: boolean, html: string}
 */
function applyBlockProtection(html) {
  let modifiedHtml = html;
  let modified = false;
  
  // 1. Remove teaser blocks with protected class (for unauthenticated users)
  const teaserBlockPattern = /<div[^>]*class=["'][^"']*protected[^"']*["'][^>]*>[\s\S]*?<div[^>]*>\s*teaser\s*<\/div>[\s\S]*?<\/div>/gi;
  
  modifiedHtml = modifiedHtml.replace(teaserBlockPattern, (match) => {
    modified = true;
    
    // Extract teaser path from the block
    const teaserMatch = match.match(/<div[^>]*>\s*([^<]*(?:\/fragments\/|\/teasers\/)[^<]*)\s*<\/div>/i);
    const teaserPath = teaserMatch ? teaserMatch[1].trim() : CONFIG.DEFAULT_BLOCK_TEASER;
    
    return `<p><a href="${teaserPath}">${CONFIG.AEM_ORIGIN}${teaserPath}</a></p>`;
  });
  
  // 2. Handle ID-based block protection
  // Remove protected blocks for unauthenticated users
  const protectedIdPattern = /<div[^>]*class=["'][^"']*id-[^"']*protected[^"']*["'][^>]*>[\s\S]*?<\/div>/gi;
  
  const beforeIdRemoval = modifiedHtml;
  modifiedHtml = modifiedHtml.replace(protectedIdPattern, '');
  
  if (beforeIdRemoval !== modifiedHtml) {
    modified = true;
  }
  
  return { modified, html: modifiedHtml };
}

/**
 * Main EdgeWorkers response handler
 * @param {Request} request - EdgeWorkers request object
 * @returns {Response} - EdgeWorkers response object
 */
export async function responseProvider(request) {
  try {
    const startTime = Date.now();
    
    // Parse request URL
    const reqUrl = new URL(request.url);
    const path = reqUrl.pathname;
    
    // Quick bypass check for performance
    const shouldBypass = CONFIG.BYPASS_PATHS.some(bypassPath => 
      path.startsWith(bypassPath),
    );
    
    if (shouldBypass) {
      // Fetch and return origin response directly
      const fullUrl = new URL(reqUrl.pathname + reqUrl.search, CONFIG.AEM_ORIGIN);
      return await httpRequest(fullUrl.toString());
    }

    // Fetch origin content
    const fullUrl = new URL(reqUrl.pathname + reqUrl.search, CONFIG.AEM_ORIGIN);
    const originResponse = await httpRequest(fullUrl.toString());
    
    // Only process HTML content
    const contentType = originResponse.getHeader('content-type') || '';
    if (!CONFIG.HTML_CONTENT_TYPES.some(type => contentType.includes(type))) {
      return originResponse;
    }

    const html = await originResponse.text();
    
    // Performance gate: Early exit if no protection needed
    if (!needsProtection(html)) {
      console.log(`[EdgeWorkers] No protection needed for ${path}`);
      return createResponse(
        originResponse.status,
        originResponse.getHeaders(),
        html,
      );
    }

    // Check authentication
    const isAuthenticated = checkAuthentication(request);
    
    // For authenticated users, return original content
    if (isAuthenticated) {
      console.log('[EdgeWorkers] Authenticated user, returning original content');
      return createResponse(
        originResponse.status,
        originResponse.getHeaders(),
        html,
      );
    }

    // Apply protection hierarchy for unauthenticated users
    console.log(`[EdgeWorkers] Applying protection for ${path}`);
    
    // 1. Try page-level protection first
    let result = applyPageProtection(html);
    if (result.modified) {
      const executionTime = Date.now() - startTime;
      console.log(`[EdgeWorkers] Page protection applied in ${executionTime}ms`);
      
      return createResponse(
        originResponse.status,
        originResponse.getHeaders(),
        result.html,
      );
    }
    
    // 2. Try section-level protection
    result = applySectionProtection(html);
    if (result.modified) {
      const executionTime = Date.now() - startTime;
      console.log(`[EdgeWorkers] Section protection applied in ${executionTime}ms`);
      
      return createResponse(
        originResponse.status,
        originResponse.getHeaders(),
        result.html,
      );
    }
    
    // 3. Try block-level protection
    result = applyBlockProtection(html);
    if (result.modified) {
      const executionTime = Date.now() - startTime;
      console.log(`[EdgeWorkers] Block protection applied in ${executionTime}ms`);
      
      return createResponse(
        originResponse.status,
        originResponse.getHeaders(),
        result.html,
      );
    }
    
    // No protection applied, return original
    const executionTime = Date.now() - startTime;
    console.log(`[EdgeWorkers] No protection applied for ${path} in ${executionTime}ms`);
    
    return createResponse(
      originResponse.status,
      originResponse.getHeaders(),
      html,
    );

  } catch (error) {
    console.error('[EdgeWorkers Error]:', error.message);
    
    // Return a graceful error response
    return createResponse(
      500,
      { 'content-type': 'text/plain' },
      'Content protection service temporarily unavailable',
    );
  }
}

/**
 * Optional: Handle client requests for preprocessing
 * @param {Request} request - EdgeWorkers request object
 */
export async function onClientRequest(request) {
  // Add request preprocessing if needed
  console.log(`[EdgeWorkers] Processing request: ${request.url}`);
  return request;
}
