import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';

// Inlined configuration
const config = {
  AEM_ORIGIN: 'https://main--www--example.aem.live',
  BYPASS_PATHS: [
    '/fragments/',
    '/nav.plain.html',
    '/footer.plain.html',
    '/eds-config/',
  ],
  HTML_CONTENT_TYPES: ['text/html']
};

// Inlined authentication - exported for testing
export const auth = {
  checkAuthentication(_request) {
    return false;
  },
};

function processContent(html, isAuthenticated) {
  const gatedMetaPattern = /<meta\s+name=["']gated["']\s+content=["']true["']/i;
  if (!gatedMetaPattern.test(html)) {
    return html;
  }

  let processedHtml = html;

  // Section-level processing
  const mainMatch = processedHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    const mainContent = mainMatch[1];
    let newMainContent = mainContent;
    const divPattern = /<div[^>]*>/g;
    let divMatch;
    const sections = [];
    
    while ((divMatch = divPattern.exec(mainContent)) !== null) {
      const divStart = divMatch.index;
      let depth = 1;
      let pos = divStart + divMatch[0].length;
      
      while (pos < mainContent.length && depth > 0) {
        const nextOpenDiv = mainContent.indexOf('<div', pos);
        const nextCloseDiv = mainContent.indexOf('</div>', pos);
        
        if (nextCloseDiv === -1) {
          break;
        }
        
        if (nextOpenDiv !== -1 && nextOpenDiv < nextCloseDiv) {
          depth++;
          pos = nextOpenDiv + 4;
        } else {
          depth--;
          pos = nextCloseDiv + 6;
          
          if (depth === 0) {
            sections.push(mainContent.substring(divStart, pos));
            break;
          }
        }
      }
    }
    
    for (const section of sections) {
      if (section.includes('section-metadata')) {
        const viewMatch = section.match(/<div[^>]*>\s*<div[^>]*>\s*view\s*<\/div>\s*<div[^>]*>\s*(logged-in|logged-out)\s*<\/div>\s*<\/div>/i);
        
        if (viewMatch) {
          const viewValue = viewMatch[1];
          const shouldRemove = (isAuthenticated && viewValue === 'logged-out') ||
                             (!isAuthenticated && viewValue === 'logged-in');
          
          if (shouldRemove) {
            newMainContent = newMainContent.replace(section, '');
          }
        }
      }
    }
    
    processedHtml = processedHtml.replace(mainMatch[0], `<main${mainMatch[0].substring(5, mainMatch[0].indexOf('>'))}>${newMainContent}</main>`);
  }

  // Block-level processing with balanced div matching
  const targetClass = isAuthenticated ? 'logged-out' : 'logged-in';
  const classPattern = new RegExp(`<div[^>]*class=["'][^"']*${targetClass}[^"']*["'][^>]*>`, 'gi');
  let blockMatch;
  const blocksToRemove = [];
  
  while ((blockMatch = classPattern.exec(processedHtml)) !== null) {
    const divStart = blockMatch.index;
    let depth = 1;
    let pos = divStart + blockMatch[0].length;
    
    while (pos < processedHtml.length && depth > 0) {
      const nextOpenDiv = processedHtml.indexOf('<div', pos);
      const nextCloseDiv = processedHtml.indexOf('</div>', pos);
      
      if (nextCloseDiv === -1) {
        break;
      }
      
      if (nextOpenDiv !== -1 && nextOpenDiv < nextCloseDiv) {
        depth++;
        pos = nextOpenDiv + 4;
      } else {
        depth--;
        pos = nextCloseDiv + 6;
        
        if (depth === 0) {
          blocksToRemove.push(processedHtml.substring(divStart, pos));
          break;
        }
      }
    }
  }
  
  // Remove blocks in reverse order to avoid index shifting
  for (const block of blocksToRemove.reverse()) {
    processedHtml = processedHtml.replace(block, '');
  }

  return processedHtml;
}

async function responseProvider(request) {
  try {
    const url = request.url;
    const pathMatch = url.match(/https?:\/\/[^/]+(.*)$/);
    const fullPath = pathMatch ? pathMatch[1] : '/';
    const questionIndex = fullPath.indexOf('?');
    const path = questionIndex !== -1 ? fullPath.substring(0, questionIndex) : fullPath;
    const search = questionIndex !== -1 ? fullPath.substring(questionIndex) : '';
    
    const shouldBypass = config.BYPASS_PATHS.some(bypassPath => path.startsWith(bypassPath));
    
    if (shouldBypass) {
      return await httpRequest(config.AEM_ORIGIN + path + search);
    }

    const originResponse = await httpRequest(config.AEM_ORIGIN + path + search);
    
    const contentType = originResponse.getHeader('content-type') || '';
    if (!config.HTML_CONTENT_TYPES.some(type => contentType.includes(type))) {
      return originResponse;
    }

    const html = await originResponse.text();
    const isAuthenticated = auth.checkAuthentication(request);
    const processedHtml = processContent(html, isAuthenticated);

    return createResponse(
      originResponse.status,
      originResponse.getHeaders(),
      processedHtml,
    );

  } catch (error) {
    console.error('[EdgeWorkers Error]:', error.message);
    
    return createResponse(
      500,
      { 'content-type': 'text/plain' },
      'Content protection service temporarily unavailable',
    );
  }
}

export { responseProvider };
