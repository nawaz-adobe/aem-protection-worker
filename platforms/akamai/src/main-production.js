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
  
  // Match sections with section-metadata div
  const sectionPattern = /<div[^>]*>[\s\S]*?<div[^>]*class=["'][^"']*section-metadata[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>/gi;
  // Check for protected=true in metadata
  const protectedPattern = /<div[^>]*>\s*<div[^>]*>\s*protected\s*<\/div>\s*<div[^>]*>\s*true\s*<\/div>\s*<\/div>/i;
  
  modifiedHtml = modifiedHtml.replace(sectionPattern, (match) => {
    if (!protectedPattern.test(match)) {
      return match;
    }
    
    modified = true;
    
    // Extract teaser path from metadata
    const teaserMatch = match.match(/<div[^>]*>\s*<div[^>]*>\s*teaser\s*<\/div>\s*<div[^>]*>\s*([^<]+?)\s*<\/div>\s*<\/div>/i);
    let teaserPath = CONFIG.DEFAULT_SECTION_TEASER;
    
    if (teaserMatch) {
      const extractedPath = teaserMatch[1].trim();
      if (extractedPath && extractedPath.length > 0 && extractedPath !== 'true' && extractedPath !== 'false') {
        teaserPath = extractedPath;
      }
    }
    
    console.log(`[EdgeWorkers] Section protection applied with teaser: ${teaserPath}`);
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
    
    // Parse request URL manually (EdgeWorkers doesn't have URL constructor)
    const url = request.url;
    const pathMatch = url.match(/https?:\/\/[^\/]+(.*)$/);
    const fullPath = pathMatch ? pathMatch[1] : '/';
    const questionIndex = fullPath.indexOf('?');
    const path = questionIndex !== -1 ? fullPath.substring(0, questionIndex) : fullPath;
    const search = questionIndex !== -1 ? fullPath.substring(questionIndex) : '';
    
    // Quick bypass check for performance
    const shouldBypass = CONFIG.BYPASS_PATHS.some(bypassPath => 
      path.startsWith(bypassPath),
    );
    
    if (shouldBypass) {
      // Fetch and return origin response directly
      const fullUrl = CONFIG.AEM_ORIGIN + path + search;
      return await httpRequest(fullUrl);
    }

    // Fetch origin content
    const fullUrl = CONFIG.AEM_ORIGIN + path + search;
    const originResponse = await httpRequest(fullUrl);
    
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
