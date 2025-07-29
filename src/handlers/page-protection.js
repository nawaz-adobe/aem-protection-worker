import config from '../config.js';

export default {
  checkPageLevelProtection($) {
    const protectedMeta = $('meta[name=\'protected\']');
    const isPageProtected = protectedMeta.length > 0 && protectedMeta.attr('content') === 'true';
    const pageTeaserPath = $('meta[name=\'teaser\']').attr('content') || config.DEFAULT_PAGE_TEASER;
    
    return {
      isProtected: isPageProtected,
      teaserPath: pageTeaserPath,
    };
  },

  generateFragmentHtml(teaserPath, aemOrigin) {
    return `<div>
        <p><a href="${teaserPath}">${aemOrigin}${teaserPath}</a></p>
      </div>`;
  },

  applyPageLevelProtection(html, teaserPath, originResponse, aemOrigin) {
    const generateFragment = this.generateFragmentHtml.bind(this);
    
    const rewrittenStream = new HTMLRewriter()
      .on('main', {
        element(el) {
          el.setInnerContent(generateFragment(teaserPath, aemOrigin), { html: true });
        },
      })
      .transform(new Response(html, {
        status: originResponse.status,
        headers: originResponse.headers,
      }));
    
    return rewrittenStream;
  },
}; 