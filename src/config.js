export default {
  AEM_ORIGIN: 'https://main--www--cmegroup.aem.live',
  DEFAULT_PAGE_TEASER: '/fragments/teasers/content-teaser',
  DEFAULT_SECTION_TEASER: '/fragments/teasers/content-teaser',
  DEFAULT_BLOCK_TEASER: '/fragments/teasers/block-teaser',
  
  // Bypass paths that don't need protection logic
  BYPASS_PATHS: [
    '/fragments/',
    '/nav.plain.html',
    '/footer.plain.html',
    '/eds-config/'
  ],
  
  // Content types that should be processed
  HTML_CONTENT_TYPES: ['text/html'],
}; 