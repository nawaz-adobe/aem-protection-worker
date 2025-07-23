import { load } from 'cheerio';

export default {
  // Configuration
  AEM_ORIGIN: "https://issue-20--www--cmegroup.aem.page",
  DEFAULT_PAGE_TEASER: "/fragments/teasers/video-teaser",
  DEFAULT_SECTION_TEASER: "/fragments/teasers/section-teaser",
  DEFAULT_BLOCK_TEASER: "/fragments/teasers/block-teaser",

  async fetch(request) {
    const reqUrl = new URL(request.url);
    const aemUrl = new URL(reqUrl.pathname, this.AEM_ORIGIN);
    const path = reqUrl.pathname;

    // Bypass protection logic for all fragment requests
    if (path.startsWith('/fragments/') || path.startsWith('/nav.plain.html')) {
      return await this.handleHeaderFragment(request, aemUrl);
    }

    const originResponse = await fetch(aemUrl);
    const contentType = originResponse.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      return originResponse;
    }

    const html = await originResponse.text();
    const $ = load(html);

    // Check for page-level protection
    const pageProtectionMetadata = this.checkPageLevelProtection($, html);
    if (pageProtectionMetadata.isProtected) {
      return this.applyPageLevelProtection(html, pageProtectionMetadata.teaserPath, originResponse);
    }

    // Check for section-level protection
    const sectionProtectionMetadata = this.checkSectionLevelProtection($);
    if (sectionProtectionMetadata.isProtected) {
      return this.applySectionLevelProtection($, html, sectionProtectionMetadata, originResponse);
    }

    // Check for block-level protection
    const blockProtectionMetadata = this.checkBlockLevelProtection($);
    if (blockProtectionMetadata.isProtected) {
      return this.applyBlockLevelProtection($, html, blockProtectionMetadata, originResponse);
    }

    return new Response(html, {
      status: originResponse.status,
      headers: originResponse.headers,
    });
  },

  // Handle header fragment requests
  async handleHeaderFragment(request, aemUrl) {
    for (const [key, value] of request.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    const init = {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow',
    };
    
    const originResponse = await fetch(aemUrl, init);
    
    // Add CORS header
    const newHeaders = new Headers(originResponse.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    
    return new Response(originResponse.body, {
      status: originResponse.status,
      headers: newHeaders,
    });
  },

  checkPageLevelProtection($, html) {
    const visibilityMeta = $("meta[name='visibility']");
    const isPageProtected = visibilityMeta.length > 0 && visibilityMeta.attr('content') === 'protected';
    const pageTeaserPath = $("meta[name='teaser']").attr('content') || this.DEFAULT_PAGE_TEASER;
    
    return {
      isProtected: isPageProtected,
      teaserPath: pageTeaserPath
    };
  },

  applyPageLevelProtection(html, teaserPath, originResponse) {
    const rewrittenStream = new HTMLRewriter()
      .on('main', {
        element(el) {
          el.setInnerContent(`
            <div class="section">
              <div class="fragment">
                <div>
                  <a href="${teaserPath}">teaser</a>
                </div>
              </div>
            </div>
          `, { html: true });
        },
      })
      .transform(new Response(html, {
        status: originResponse.status,
        headers: originResponse.headers,
      }));
    
    console.log('[DEBUG] Page-level protection applied successfully');
    return rewrittenStream;
  },

  checkSectionLevelProtection($) {
    const protectedSections = [];
    let totalSections = 0;
    let sectionsWithMetadata = 0;
    let sectionsWithVisibility = 0;
    let protectedSectionsFound = 0;
    
    $('main div').each((_, el) => {
      totalSections++;
      const $section = $(el);
      const sectionMetadata = $section.find('.section-metadata');
      
      if (sectionMetadata.length > 0) {
        sectionsWithMetadata++;
        
        const visibilityDiv = sectionMetadata.find('div').filter((_, element) => {
          return $(element).text().trim() === 'visibility';
        });
        
        if (visibilityDiv.length > 0) {
          sectionsWithVisibility++;
          const visibilityValue = visibilityDiv.next().length > 0 ? visibilityDiv.next().text().trim() : '';
          
          if (visibilityValue === 'protected') {
            protectedSectionsFound++;
            
            const teaserDiv = sectionMetadata.find('div').filter((_, element) => {
              return $(element).text().trim() === 'teaser';
            });
            
            let teaserPath = this.DEFAULT_SECTION_TEASER;
            if (teaserDiv.length > 0) {
              const teaserText = teaserDiv.next().length > 0 ? teaserDiv.next().text().trim() : '';
              if (teaserText && teaserText.trim()) {
                teaserPath = teaserText.trim();
              }
            }
            
            // Store the element's outerHTML for later replacement
            const elementHtml = $(el).prop('outerHTML');
            protectedSections.push({
              elementHtml: elementHtml,
              teaserPath: teaserPath
            });
          }
        }
      }
    });

    return {
      isProtected: protectedSections.length > 0,
      sections: protectedSections
    };
  },

  applySectionLevelProtection($, html, protectionMetadata, originResponse) {
    let modifiedHtml = html;
    
    // Replace each protected section with its teaser
    protectionMetadata.sections.forEach((section, index) => {
      const teaserHtml = `
        <div class="fragment">
          <div>
            <a href="${section.teaserPath}">teaser</a>
          </div>
        </div>
      `;
      
      // Extract the opening div tag to preserve the section structure
      const sectionStartMatch = section.elementHtml.match(/<div[^>]*>/);
      if (sectionStartMatch) {
        const sectionStartTag = sectionStartMatch[0];
        const sectionWithFragment = sectionStartTag + 
          '<div class="section-wrapper">' + teaserHtml + '</div>' + 
          '</div>';
        modifiedHtml = modifiedHtml.replace(section.elementHtml, sectionWithFragment);
      }
    }); 

    console.log('[DEBUG] Section-level protection applied successfully');
    
    return new Response(modifiedHtml, {
      status: originResponse.status,
      headers: originResponse.headers,
    });
  },

  // Check for block-level protection
  checkBlockLevelProtection($) {
    const teaserPaths = [];
    
    $("div[class*='protected']").each((i, el) => {
      const lastDiv = $(el).find('div').last();
      teaserPaths.push(lastDiv.text().trim());
    });
    
    return {
      isProtected: teaserPaths.length > 0,
      teaserPaths: teaserPaths
    };
  },

  // Apply block-level protection
  applyBlockLevelProtection($, html, protectionMetadata, originResponse) {
    let blockIndex = 0;
    
    const rewrittenStream = new HTMLRewriter()
      .on("div[class*='protected']", {
        element(el) {
          const path = protectionMetadata.teaserPaths[blockIndex] || this.DEFAULT_BLOCK_TEASER;
          blockIndex++;
          el.replace(`
            <div class="fragment">
              <div>
                <a href="${path}">teaser</a>
              </div>
            </div>
          `, { html: true });
        }
      })
      .transform(new Response(html, {
        status: originResponse.status,
        headers: originResponse.headers,
      }));
    
    console.log('[DEBUG] Block-level protection applied successfully');
    return rewrittenStream;
  }
};
