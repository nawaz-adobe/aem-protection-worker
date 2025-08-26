import { load } from 'cheerio';
import config from './config.js';
import pageProtection from './handlers/page-protection.js';
import sectionProtection from './handlers/section-protection.js';
import auth from './handlers/auth.js';

export default {
  // Entry point for edge worker
  async fetch(request) {
    try {
      const reqUrl = new URL(request.url);
      const path = reqUrl.pathname;
      const fullUrl = new URL(reqUrl.pathname + reqUrl.search, config.AEM_ORIGIN);
      const originResponse = await fetch(fullUrl, request);

      // Bypass protection logic for all fragment requests and config endpoints
      const shouldBypass = config.BYPASS_PATHS.some(bypassPath => path.startsWith(bypassPath));
      if (shouldBypass) {
        return originResponse;
      }

      const contentType = originResponse.headers.get('content-type') || '';
      if (!config.HTML_CONTENT_TYPES.some(type => contentType.includes(type))) {
        return originResponse;
      }

      const html = await originResponse.text();
      const $ = load(html);

      // Early performance optimization: check if any protection is needed
      const protectedMeta = $('meta[name=\'protected\']');
      const isProtected = protectedMeta.length > 0 && protectedMeta.attr('content') === 'true';
      
      if (!isProtected) {
        return new Response(html, {
          status: originResponse.status,
          headers: originResponse.headers,
        });
      }

      // Content is protected - check if user is authenticated
      const isAuthenticated = auth.checkAuthentication(request);

      // Check if it's page-level protection (has teaser)
      const pageProtectionMetadata = pageProtection.checkPageLevelProtection($);
      if (pageProtectionMetadata.isPageProtected) {
        // Page protection exists - handle based on authentication
        if (isAuthenticated) {
          return new Response(html, {
            status: originResponse.status,
            headers: originResponse.headers,
          });
        } else {
          return pageProtection.applyPageLevelProtection(html, pageProtectionMetadata.teaserPath, originResponse);
        }
      }

      // No page protection - continue to section/block protection
      let modifiedHtml = html;
      let protectionApplied = false;

      // Check for section-level protection (includes block protection)
      const sectionProtectionMetadata = sectionProtection.checkSectionLevelProtection($, isAuthenticated);
      if (sectionProtectionMetadata.isProtected) {
        modifiedHtml = sectionProtection.applySectionLevelProtection($, sectionProtectionMetadata);
        protectionApplied = true;
      }

      if (protectionApplied) {
        return new Response(modifiedHtml, {
          status: originResponse.status,
          headers: originResponse.headers,
        });
      }

      // For authenticated users, always return DOM state in case blocks were removed
      // even if no teaser replacements were applied
      if (isAuthenticated) {
        return new Response($.html(), {
          status: originResponse.status,
          headers: originResponse.headers,
        });
      }

      return new Response(html, {
        status: originResponse.status,
        headers: originResponse.headers,
      });
    } catch (error) {
      console.error('[ERROR] Protection worker failed:', error);
      return new Response('Internal server error', { status: 500 });
    }
  },
};
