import config from '../config.js';
import blockProtection from './block-protection.js';

export default {
  checkSectionLevelProtection($) {
    const protectedSections = [];
    const teaserBlocks = [];
    
    $('main > div').each((_, el) => {
      const $section = $(el);
      const sectionMetadata = $section.find('.section-metadata');
      
      if (sectionMetadata.length > 0) {
        const protectedDiv = sectionMetadata.find('div').filter((_, div) => 
          $(div).text().trim() === 'protected',
        );

        if (protectedDiv.length > 0 && protectedDiv.next().text().trim() === 'true') {
          const teaserDiv = sectionMetadata.find('div').filter((_, div) => 
            $(div).text().trim() === 'teaser',
          );
          const teaserPath = teaserDiv.length > 0 ? teaserDiv.next().text().trim() : config.DEFAULT_SECTION_TEASER;
          
          protectedSections.push({
            elementHtml: $(el).prop('outerHTML'),
            teaserPath: teaserPath,
          });
        } else {
          // Delegate block protection logic to block-protection module
          blockProtection.checkBlockProtectionInSection($section, teaserBlocks, $);
        }
      } else {
        // Delegate block protection logic to block-protection module
        blockProtection.checkBlockProtectionInSection($section, teaserBlocks, $);
      }
    });

    return {
      isProtected: protectedSections.length > 0 || teaserBlocks.length > 0,
      sections: protectedSections,
      teaserBlocks: teaserBlocks,
    };
  },

  generateFragmentHtml(teaserPath, aemOrigin) {
    return `<div>
        <p><a href="${teaserPath}">${aemOrigin}${teaserPath}</a></p>
      </div>`;
  },

  applySectionLevelProtection($, protectionMetadata, aemOrigin) {
    let finalHtml = $.html();    
    protectionMetadata.sections.forEach((section) => {
      finalHtml = finalHtml.replace(section.elementHtml, this.generateFragmentHtml(section.teaserPath, aemOrigin));
    }); 

    if (protectionMetadata.teaserBlocks) {
      protectionMetadata.teaserBlocks.forEach((block) => {
        finalHtml = finalHtml.replace(block.elementHtml, blockProtection.generateBlockFragmentHtml(block.teaserPath, aemOrigin));
      }); 
    }
    
    return finalHtml;
  },
}; 