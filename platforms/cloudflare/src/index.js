import { load } from 'cheerio';
import config from './config.js';
import auth from './handlers/auth.js';

function processContent(html, isAuthenticated) {
  const $ = load(html);
  
  const gatedMeta = $('meta[name="gated"]');
  const isGated = gatedMeta.length > 0 && gatedMeta.attr('content') === 'true';
  
  if (!isGated) {
    return html;
  }

  const sectionsToRemove = [];
  
  $('main > div').each((_, sectionEl) => {
    const $section = $(sectionEl);
    const sectionMetadata = $section.find('.section-metadata');
    
    if (sectionMetadata.length > 0) {
      const viewDiv = sectionMetadata.find('div').filter((_, div) => 
        $(div).text().trim() === 'view'
      );
      
      if (viewDiv.length > 0) {
        const viewValue = viewDiv.next().text().trim();
        const shouldRemove = (isAuthenticated && viewValue === 'logged-out') || 
                           (!isAuthenticated && viewValue === 'logged-in');
        
        if (shouldRemove) {
          sectionsToRemove.push($section);
        }
      }
    }
    
    const willBeRemoved = sectionsToRemove.includes($section);
    if (!willBeRemoved) {
      if (isAuthenticated) {
        $section.find('[class*="logged-out"]').remove();
      } else {
        $section.find('[class*="logged-in"]').remove();
      }
    }
  });
  
  sectionsToRemove.forEach($section => {
    $section.remove();
  });

  return $.html();
}

export default {
  async fetch(request) {
    try {
      const reqUrl = new URL(request.url);
      const path = reqUrl.pathname;
      const fullUrl = new URL(reqUrl.pathname + reqUrl.search, config.AEM_ORIGIN);
      const originResponse = await fetch(fullUrl, request);

      const shouldBypass = config.BYPASS_PATHS.some(bypassPath => path.startsWith(bypassPath));
      if (shouldBypass) {
        return originResponse;
      }

      const contentType = originResponse.headers.get('content-type') || '';
      if (!config.HTML_CONTENT_TYPES.some(type => contentType.includes(type))) {
        return originResponse;
      }

      const html = await originResponse.text();
      const isAuthenticated = auth.checkAuthentication(request);
      const processedHtml = processContent(html, isAuthenticated);
      
      return new Response(processedHtml, {
        status: originResponse.status,
        headers: originResponse.headers,
      });
    } catch (error) {
      console.error('[ERROR] Protection worker failed:', error);
      return new Response('Internal server error', { status: 500 });
    }
  },
};
