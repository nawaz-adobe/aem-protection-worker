import { load } from 'cheerio';

export default {
  async fetch(request) {
    const reqUrl = new URL(request.url);
    const aemUrl = new URL(reqUrl.pathname, "https://issue-20--www--cmegroup.aem.page");
    const path = reqUrl.pathname;
    // Bypass protection logic for header fragment
    if (path.startsWith('/nav.plain.html')) {
      console.log('[DEBUG] Bypassing protection logic for header fragment');
      console.log('[DEBUG] Fetching original response');
      // Log all headers being forwarded
      console.log('[DEBUG] Forwarding headers:');
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
      console.log('[DEBUG] Original response:', originResponse);
      // Add CORS header
      const newHeaders = new Headers(originResponse.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      return new Response(originResponse.body, {
        status: originResponse.status,
        headers: newHeaders,
      });
    }

    const originResponse = await fetch(aemUrl);
    const contentType = originResponse.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      return originResponse;
    }

    // Clone response body for sniffing (as a string)
    const html = await originResponse.text();
    // console.log('[DEBUG] Original HTML:', html);

    // Log the entire original HTML
    // console.log('[DEBUG] Original HTML (full):\n' + html);

    // Check for page-level protection
    const isPageProtected = /<meta[^>]+name=["']visibility["'][^>]+content=["']protected["'][^>]*>/i.test(html);

    // Use cheerio to extract fragment path for page-level protection
    const $ = load(html);
    const pageFragmentPath = $("meta[name='teaser']").attr('content') || '/fragments/teasers/video-teaser';

    if (isPageProtected) {
      // Use HTMLRewriter to replace the content of <main> only, using the extracted fragment path
      const rewrittenStream = new HTMLRewriter()
        .on('main', {
          element(el) {
            el.setInnerContent(`
              <div class=\"section\">
                <div class=\"fragment\">
                  <div>
                    <a href=\"${pageFragmentPath}\">teaser</a>
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
      // Buffer the rewritten stream for logging
      const afterHtml = await rewrittenStream.clone().text();
      console.log('[DEBUG] After HTML (page-level, full):\n' + afterHtml);
      return rewrittenStream;
    }

    // Only transform if ".protected" is present (block-level protection)
    if (!html.includes('protected')) {
      return new Response(html, {
        status: originResponse.status,
        headers: originResponse.headers,
      });
    }

    // Use cheerio to extract fragment paths from the last child div of each protected block
    const fragmentPaths = [];
    $("div[class*='protected']").each((i, el) => {
      const lastDiv = $(el).find('div').last();
      fragmentPaths.push(lastDiv.text().trim());
    });

    // Use HTMLRewriter to replace each protected block with the correct fragment
    let blockIndex = 0;
    const blockRewrittenStream = new HTMLRewriter()
      .on("div[class*='protected']", {
        element(el) {
          console.log(fragmentPaths[blockIndex]);
          const path = fragmentPaths[blockIndex] || '/fragments/teasers/video-teaser';
          blockIndex++;
          el.replace(`
            <div class=\"fragment\">
              <div>
                <a href=\"${path}\">teaser</a>
              </div>
            </div>
          `, { html: true });
        }
      })
      .transform(new Response(html, {
        status: originResponse.status,
        headers: originResponse.headers,
      }));
    // Buffer the rewritten stream for logging
    const afterBlockHtml = await blockRewrittenStream.clone().text();
    // console.log('[DEBUG] After HTML (block-level, full):\n' + afterBlockHtml);
    return blockRewrittenStream;
  },
};
