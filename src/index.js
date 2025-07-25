import { load } from 'cheerio';

export default {
  AEM_ORIGIN: 'https://main--www--cmegroup.aem.page',
  DEFAULT_PAGE_TEASER: '/fragments/teasers/content-teaser',
  DEFAULT_SECTION_TEASER: '/fragments/teasers/content-teaser',
  DEFAULT_BLOCK_TEASER: '/fragments/teasers/block-teaser',

  generateFragmentHtml(teaserPath) {
    return `<div>
        <p><a href="${teaserPath}">${this.AEM_ORIGIN}${teaserPath}</a></p>
      </div>`;
  },

  generateBlockFragmentHtml(teaserPath) {
    return `<p><a href="${teaserPath}">${this.AEM_ORIGIN}${teaserPath}</a></p>`;
  },

  checkBlockProtectionInSection($section, teaserBlocks, $) {
    // First, check for teaser blocks (higher priority)
    const protectedDivsWithTeasers = $section.find('div[class*="protected"]').filter((_, el) => {
      const $el = $(el);
      const divs = $el.find('div');
      
      let hasTeaserKeyword = false;
      let hasFragmentPath = false;
      
      divs.each((_, divEl) => {
        const $div = $(divEl);
        const text = $div.text().trim();
        if (text === 'teaser') {
          hasTeaserKeyword = true;
        }
        if (text.includes('/fragments/') || text.includes('/teasers/') || (text.startsWith('/') && text.length > 1)) {
          hasFragmentPath = true;
        }
      });
      
      return hasTeaserKeyword && hasFragmentPath;
    });
    
    if (protectedDivsWithTeasers.length > 0) {
      protectedDivsWithTeasers.each((_, el) => {
        const $el = $(el);
        const lastDiv = $el.find('div').last();
        const teaserText = lastDiv.text().trim();
        teaserBlocks.push({
          elementHtml: $el.prop('outerHTML'),
          teaserPath: teaserText,
        });
      });

      return;
    }
    
    const blocks = {};
    $section.find('div[class*="id-"]').each((_, blockEl) => {
      const $block = $(blockEl);
      const classAttr = $block.attr('class') || '';
      const idMatch = classAttr.match(/id-([^\s]+)/);
      const isProtected = classAttr.includes('protected');
      
      if (!idMatch) {return;}
      const blockId = idMatch[1];
      if (!blocks[blockId]) {
        blocks[blockId] = { normal: null, protected: null };
      }
      
      if (isProtected) {
        blocks[blockId].protected = $block;
      } else {
        blocks[blockId].normal = $block;
      }
    });
    
    if (Object.keys(blocks).length > 0) {
      Object.entries(blocks).forEach(([_, blockPair]) => {
        if (blockPair.normal && blockPair.protected) {
          blockPair.protected.remove();
        }
      });
    }
  },

  checkPageLevelProtection($) {
    const visibilityMeta = $('meta[name=\'visibility\']');
    const isPageProtected = visibilityMeta.length > 0 && visibilityMeta.attr('content') === 'protected';
    const pageTeaserPath = $('meta[name=\'teaser\']').attr('content') || this.DEFAULT_PAGE_TEASER;
    
    return {
      isProtected: isPageProtected,
      teaserPath: pageTeaserPath,
    };
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

  checkSectionLevelProtection($) {
    const protectedSections = [];
    const teaserBlocks = [];
    
    $('main > div').each((_, el) => {
      const $section = $(el);
      const sectionMetadata = $section.find('.section-metadata');
      
      if (sectionMetadata.length > 0) {
        const visibilityDiv = sectionMetadata.find('div').filter((_, div) => 
          $(div).text().trim() === 'visibility',
        );

        if (visibilityDiv.length > 0 && visibilityDiv.next().text().trim() === 'protected') {
          const teaserDiv = sectionMetadata.find('div').filter((_, div) => 
            $(div).text().trim() === 'teaser',
          );
          const teaserPath = teaserDiv.length > 0 ? teaserDiv.next().text().trim() : this.DEFAULT_SECTION_TEASER;
          
          protectedSections.push({
            elementHtml: $(el).prop('outerHTML'),
            teaserPath: teaserPath,
          });
        } else {
          this.checkBlockProtectionInSection($section, teaserBlocks, $);
        }
      } else {
        this.checkBlockProtectionInSection($section, teaserBlocks, $);
      }
    });

    return {
      isProtected: protectedSections.length > 0 || teaserBlocks.length > 0,
      sections: protectedSections,
      teaserBlocks: teaserBlocks,
    };
  },

  applySectionLevelProtection($, protectionMetadata) {
    let finalHtml = $.html();    
    protectionMetadata.sections.forEach((section) => {
      finalHtml = finalHtml.replace(section.elementHtml, this.generateFragmentHtml(section.teaserPath));
    }); 

    if (protectionMetadata.teaserBlocks) {
      protectionMetadata.teaserBlocks.forEach((block) => {
        finalHtml = finalHtml.replace(block.elementHtml, this.generateBlockFragmentHtml(block.teaserPath));
      }); 
    }
    
    return finalHtml;
  },

  // Entry point for edge worker
  async fetch(request) {
    try {
      const reqUrl = new URL(request.url);
      const path = reqUrl.pathname;
      const fullUrl = new URL(reqUrl.pathname + reqUrl.search, this.AEM_ORIGIN);
      const originResponse = await fetch(fullUrl, request);

      // Bypass protection logic for all fragment requests and config endpoints
      if (path.startsWith('/fragments/') 
        || path.startsWith('/nav.plain.html') 
        || path.startsWith('/footer.plain.html') 
        || path.startsWith('/eds-config/')) {
        return originResponse;
      }

      const contentType = originResponse.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        return originResponse;
      }

      const html = await originResponse.text();
      const $ = load(html);
      let modifiedHtml = html;
      let protectionApplied = false;

      // Check for page-level protection (exclusive - replaces entire main content)
      const pageProtectionMetadata = this.checkPageLevelProtection($);
      if (pageProtectionMetadata.isProtected) {
        return this.applyPageLevelProtection(html, pageProtectionMetadata.teaserPath, originResponse);
      }

      // Check for section-level protection (includes block protection)
      const sectionProtectionMetadata = this.checkSectionLevelProtection($);
      if (sectionProtectionMetadata.isProtected) {
        modifiedHtml = this.applySectionLevelProtection($, sectionProtectionMetadata);
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
