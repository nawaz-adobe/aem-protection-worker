import config from '../config.js';

export default {
  checkPageLevelProtection($) {
    const pageTeaserMeta = $('meta[name=\'teaser\']');
    const teaserContent = pageTeaserMeta.attr('content');
    const hasTeaser = pageTeaserMeta.length > 0 && teaserContent && teaserContent.trim();
    
    return {
      isPageProtected: hasTeaser,
      teaserPath: teaserContent,
    };
  },

  generateFragmentHtml(teaserPath) {
    return `<div>
        <p><a href="${teaserPath}">${config.AEM_ORIGIN}${teaserPath}</a></p>
      </div>`;
  },

  applyPageLevelProtection(html, teaserPath, originResponse) {
    const generateFragment = this.generateFragmentHtml.bind(this);
    
    const rewrittenStream = new HTMLRewriter()
      .on('main', {
        element(el) {
          el.setInnerContent(generateFragment(teaserPath), { html: true });
        },
      })
      .transform(new Response(html, {
        status: originResponse.status,
        headers: originResponse.headers,
      }));
    
    return rewrittenStream;
  },
}; 