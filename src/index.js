import { load } from 'cheerio';
import config from './config.js';
import pageProtection from './handlers/page-protection.js';
import sectionProtection from './handlers/section-protection.js';

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
      let modifiedHtml = html;
      let protectionApplied = false;

      // Check for page-level protection (exclusive - replaces entire main content)
      const pageProtectionMetadata = pageProtection.checkPageLevelProtection($);
      if (pageProtectionMetadata.isProtected) {
        return pageProtection.applyPageLevelProtection(html, pageProtectionMetadata.teaserPath, originResponse, config.AEM_ORIGIN);
      }

      // Check for section-level protection (includes block protection)
      const sectionProtectionMetadata = sectionProtection.checkSectionLevelProtection($);
      if (sectionProtectionMetadata.isProtected) {
        modifiedHtml = sectionProtection.applySectionLevelProtection($, sectionProtectionMetadata, config.AEM_ORIGIN);
        protectionApplied = true;
      }

      if (protectionApplied) {
        return new Response(modifiedHtml, {
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
