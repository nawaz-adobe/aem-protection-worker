import { load } from 'cheerio';

export default {
  AEM_ORIGIN: "https://main--www--cmegroup.aem.page",
  DEFAULT_PAGE_TEASER: "/fragments/teasers/content-teaser",
  DEFAULT_SECTION_TEASER: "/fragments/teasers/content-teaser",
  DEFAULT_BLOCK_TEASER: "/fragments/teasers/block-teaser",

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
    const protectedDivsWithTeasers = $section.find("div[class*='protected']").filter((_, el) => {
      const $el = $(el);
      const divs = $el.find('div');
      
      // Check if this has the teaser structure: <div>teaser</div> and <div>/fragments/...</div>
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
      // Use teaser approach for this section
      protectedDivsWithTeasers.each((_, el) => {
        const $el = $(el);
        const lastDiv = $el.find('div').last();
        const teaserText = lastDiv.text().trim();
        teaserBlocks.push({
          elementHtml: $el.prop('outerHTML'),
          teaserPath: teaserText
        });
      });

      return; // Exit early - teaser protection takes priority
    }
    
    // If no teaser blocks found, check for ID-based blocks
    const blocks = {};
    
    $section.find('div[class*="id-"]').each((_, blockEl) => {
      const $block = $(blockEl);
      const classAttr = $block.attr('class') || '';
      const idMatch = classAttr.match(/id-([^\s]+)/);
      const isProtected = classAttr.includes('protected');
      
      if (!idMatch) return;
      
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
      Object.entries(blocks).forEach(([blockId, blockPair]) => {
        if (blockPair.normal && blockPair.protected) {
          blockPair.protected.remove();
        }
      });
    }
  },

  async handleHeaderFragment(request, aemUrl) {
    try {
      for (const [key, value] of request.headers.entries()) {
        // console.log(`${key}: ${value}`);
      }
      
      const originResponse = await fetch(aemUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'follow',
      });
      
      if (!originResponse.ok) {
        // Don't include body for status codes that don't allow it
        if ([101, 204, 205, 304].includes(originResponse.status)) {
          return new Response(null, {
            status: originResponse.status
          });
        }
        return new Response(`Fragment server error: ${originResponse.status}`, {
          status: originResponse.status
        });
      }
      
      const newHeaders = new Headers(originResponse.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      
      // Handle null body for certain status codes
      if ([101, 204, 205, 304].includes(originResponse.status)) {
        return new Response(null, {
          status: originResponse.status,
          headers: newHeaders,
        });
      }
      
      return new Response(originResponse.body, {
        status: originResponse.status,
        headers: newHeaders,
      });
    } catch (error) {
      console.error('[ERROR] Fragment handling failed:', error);
      return new Response('Fragment server error', { status: 500 });
    }
  },

  checkPageLevelProtection($) {
    const visibilityMeta = $("meta[name='visibility']");
    const isPageProtected = visibilityMeta.length > 0 && visibilityMeta.attr('content') === 'protected';
    const pageTeaserPath = $("meta[name='teaser']").attr('content') || this.DEFAULT_PAGE_TEASER;
    
    return {
      isProtected: isPageProtected,
      teaserPath: pageTeaserPath
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
    
    $('main > div').each((index, el) => {
      const $section = $(el);
      const sectionMetadata = $section.find('.section-metadata');
      
      if (sectionMetadata.length > 0) {
        // Check for section-level protection
        const visibilityDiv = sectionMetadata.find('div').filter((_, div) => 
          $(div).text().trim() === 'visibility'
        );
        if (visibilityDiv.length > 0 && visibilityDiv.next().text().trim() === 'protected') {
          const teaserDiv = sectionMetadata.find('div').filter((_, div) => 
            $(div).text().trim() === 'teaser'
          );
          const teaserPath = teaserDiv.length > 0 ? teaserDiv.next().text().trim() : this.DEFAULT_SECTION_TEASER;
          
          protectedSections.push({
            elementHtml: $(el).prop('outerHTML'),
            teaserPath: teaserPath
          });
        } else {
          // Section not protected, check for block protection
          this.checkBlockProtectionInSection($section, teaserBlocks, $);
        }
      } else {
        // No section metadata, check for block protection
        this.checkBlockProtectionInSection($section, teaserBlocks, $);
      }
    });

    return {
      isProtected: protectedSections.length > 0 || teaserBlocks.length > 0,
      sections: protectedSections,
      teaserBlocks: teaserBlocks
    };
  },

  applySectionLevelProtection($, html, protectionMetadata, originResponse) {
    // Get the modified HTML from Cheerio (this includes the ID-based removals)
    let finalHtml = $.html();
    
    // Apply section-level protection to the Cheerio HTML
    protectionMetadata.sections.forEach((section) => {
      finalHtml = finalHtml.replace(section.elementHtml, this.generateFragmentHtml(section.teaserPath));
    }); 

    // Apply block-level protection to the Cheerio HTML
    if (protectionMetadata.teaserBlocks) {
      protectionMetadata.teaserBlocks.forEach((block) => {
        finalHtml = finalHtml.replace(block.elementHtml, this.generateBlockFragmentHtml(block.teaserPath));
      }); 
    }
    
    return finalHtml;
  },

  // Main driver function
  async fetch(request) {
    try {
      const reqUrl = new URL(request.url);
      const aemUrl = new URL(reqUrl.pathname, this.AEM_ORIGIN);
      const path = reqUrl.pathname;

      // Bypass protection logic for all fragment requests
      if (path.startsWith('/fragments/') || path.startsWith('/nav.plain.html')) {
        return await this.handleHeaderFragment(request, aemUrl);
      }

      const originResponse = await fetch(aemUrl);
      
      if (!originResponse.ok) {
        return new Response(`Origin server error: ${originResponse.status}`, {
          status: originResponse.status
        });
      }

      const contentType = originResponse.headers.get("content-type") || "";

      if (!contentType.includes("text/html")) {
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
        modifiedHtml = this.applySectionLevelProtection($, modifiedHtml, sectionProtectionMetadata, originResponse);
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
  }
};
