export default {
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

  generateBlockFragmentHtml(teaserPath, aemOrigin) {
    return `<p><a href="${teaserPath}">${aemOrigin}${teaserPath}</a></p>`;
  },
}; 