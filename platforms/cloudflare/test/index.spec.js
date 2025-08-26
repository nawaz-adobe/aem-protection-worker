import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('Hello World worker', () => {
  it('responds with Hello World! (unit style)', async () => {
    const request = new Request('http://example.com');
    // Create an empty context to pass to `worker.fetch()`.
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    // Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
    await waitOnExecutionContext(ctx);
    expect(await response.text()).toMatchInlineSnapshot(`
      "<!DOCTYPE html>
      <html>
        <head>
          <title>Education - CME Group</title>
          <link rel="canonical" href="https://main--www--cmegroup.aem.live/education">
          <meta name="description" content="Resources Trading Simulator Course Catalog Glossary Research &#x26; Reports Trading Challenge.">
          <meta property="og:title" content="Education - CME Group">
          <meta property="og:description" content="Resources Trading Simulator Course Catalog Glossary Research &#x26; Reports Trading Challenge.">
          <meta property="og:url" content="https://main--www--cmegroup.aem.live/education">
          <meta property="og:image" content="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-leadspace-1400x500.jpg">
          <meta property="og:image:secure_url" content="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-leadspace-1400x500.jpg">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="Education - CME Group">
          <meta name="twitter:description" content="Resources Trading Simulator Course Catalog Glossary Research &#x26; Reports Trading Challenge.">
          <meta name="twitter:image" content="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-leadspace-1400x500.jpg">
          <meta name="locale" content="en">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="/aemedge/scripts/aem.js" type="module"></script>
          <script src="/aemedge/scripts/scripts.js" type="module"></script>
          <link rel="stylesheet" href="/aemedge/styles/styles.css">
        </head>
        <body>
          <header></header>
          <main>
            <div>
              <div class="course-progress container">
                <div>
                  <div>items</div>
                  <div>6</div>
                </div>
              </div>
              <div class="hero leadspace overlapped">
                <div>
                  <div>
                    <h5 id="education">Education</h5>
                    <h1 id="deepen-your-understanding-of-the-futures-market-with-cme-institute">DEEPEN YOUR UNDERSTANDING OF THE FUTURES MARKET WITH CME INSTITUTE</h1>
                    <p>Whether you're experienced at trading or building your foundation of knowledge, our educational courses and tools help you stay a step ahead.</p>
                    <p><a href="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-leadspace-1400x500.jpg">https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-leadspace-1400x500.jpg</a></p>
                  </div>
                </div>
              </div>
              <div class="section-metadata">
                <div>
                  <div>style</div>
                  <div>full-width</div>
                </div>
                <div>
                  <div>id</div>
                  <div>custom-id</div>
                </div>
              </div>
            </div>
            <div>
              <div class="cards blue-box h3-citron">
                <div>
                  <div>
                    <h5 id="enhance-your-knowledge">ENHANCE YOUR KNOWLEDGE</h5>
                    <h3 id="explore-courses-to-learn-about-futures-and-options">Explore courses to learn about futures and options</h3>
                    <p><a href="#gain-confidence-through-knowledge">Learn</a></p>
                  </div>
                </div>
                <div>
                  <div>
                    <h5 id="apply-your-learning">APPLY YOUR LEARNING</h5>
                    <h3 id="get-hands-on-trading-experience">Get hands-on trading experience</h3>
                    <p><a href="#practice-what-you-learn">Practice</a></p>
                  </div>
                </div>
                <div>
                  <div>
                    <h5 id="make-informed-decisions">MAKE INFORMED DECISIONS</h5>
                    <h3 id="stay-on-top-of-the-latest-market-trends">Stay on top of the latest market trends</h3>
                    <p><a href="#follow-the-markets-to-make-informed-decisions">Follow the markets</a></p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 id="education-webinars-and-events">EDUCATION WEBINARS AND EVENTS</h4>
              <div class="columns column-75-25 last-column-right">
                <div>
                  <div>Find opportunities to register and attend webinars and events from CME Institute on the products that interest you.</div>
                  <div><a href="https://www.cmegroup.com/education/courses.html">View all</a></div>
                </div>
              </div>
              <div class="cards dynamic upcoming-events">
                <div>
                  <div>optional tags</div>
                  <div>content-type/webinar, News-And-Events/classroom, News-And-Events/webinar</div>
                </div>
              </div>
            </div>
            <div>
              <h2 id="gain-confidence-through-knowledge">Gain confidence through knowledge</h2>
              <div class="columns column-75-25 last-column-right">
                <div>
                  <div>Explore courses to refine your understanding of futures and options products. Browse self-paced courses and pathways to guide you through your journey into derivatives.</div>
                  <div><a href="https://www.cmegroup.com/education/courses.html">View all courses</a></div>
                </div>
              </div>
            </div>
            <div>
              <div class="accordion cards">
                <div>
                  <div>Trading Futures</div>
                </div>
                <div>
                  <div>tags</div>
                  <div>topic/getting-started, display/featured-courses/fundamentals</div>
                </div>
                <div>
                  <div>Trading Options on Futures</div>
                </div>
                <div>
                  <div>tags</div>
                  <div>topic/getting-started,</div>
                </div>
                <div>
                  <div>Trading Crypto Futures</div>
                </div>
                <div>
                  <div>tags</div>
                  <div>topic/education/getting-started/trading-crypto-futures</div>
                </div>
                <div>
                  <div>Futures vs. ETFs</div>
                </div>
                <div>
                  <div>tags</div>
                  <div>topic/education/getting-started/futures-vs-etfs</div>
                </div>
              </div>
              <div class="fragment">
                <div>
                  <div><a href="/fragments/accredited-course">https://main--www--cmegroup.aem.live/fragments/accredited-course</a></div>
                </div>
              </div>
            </div>
            <div>
              <h2 id="practice-what-you-learn">Practice what you learn</h2>
              <p>The CME Institute has tools that can help you develop your trading skills, develop new strategies or gain new insights about the market.</p>
              <div class="section-metadata">
                <div>
                  <div>style</div>
                  <div>gray5-background</div>
                </div>
              </div>
              <div class="columns education white-background gap-30">
                <div>
                  <div><a href="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/trading-simulator-desktop.png">https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/trading-simulator-desktop.png</a></div>
                  <div>
                    <h2 id="make-the-most-of-each-trade-with-the-trading-simulator">Make the most of each trade with the Trading Simulator</h2>
                    <p>Study the charts, add your indicators, test your strategies, and manage a practice account for free.</p>
                    <p><a href="https://www.cmegroup.com/trading_tools/simulator" title=":arrow-right-thin: Explore this tool"><span class="icon icon-arrow-right-thin"></span>Explore this tool</a></p>
                  </div>
                </div>
              </div>
              <div class="cards promo">
                <div>
                  <div>
                    <h4 id="trading-and-analytics-tools"><strong><a href="https://www.cmegroup.com/education/practice.html">Trading and analytics tools</a></strong></h4>
                    <p><a href="https://www.cmegroup.com/education/practice.html">Use our analytics tools to uncover insights that can give you an edge in every phase of your trading journey.</a></p>
                  </div>
                </div>
                <div>
                  <div>
                    <h4 id="trading-challenge"><strong><a href="https://www.cmegroup.com/education/trading-challenge.html">Trading Challenge</a></strong></h4>
                    <p><a href="https://www.cmegroup.com/education/trading-challenge.html">Put your trading knowledge to the test and compete in a real-time simulated environment.</a></p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 id="follow-the-markets-to-make-informed-decisions">Follow the markets to make informed decisions</h2>
              <div class="columns column-75-25 last-column-right flex-end">
                <div>
                  <div>Futures markets can offer valuable early insights on how traders are responding to economic news and global events - insights to help adjust positions accordingly.</div>
                  <div><a href="https://www.cmegroup.com/education/browse-all.html#filters=featured-article">View all</a></div>
                </div>
              </div>
              <div class="cards dynamic article card-list">
                <div>
                  <div>tags</div>
                  <div>content-type/featured-article</div>
                </div>
              </div>
            </div>
            <div>
              <div class="cards event h3-citron">
                <div>
                  <div><a href="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-calendar.jpg">https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-calendar.jpg</a></div>
                  <div>
                    <h3 id="cme-group-event-calendar">CME Group Event Calendar</h3>
                    <p>Explore Educational events covering the latest, most relevant topics in online and in-person formats.</p>
                    <p><a href="https://www.cmegroup.com/education/events.html">Learn More</a></p>
                  </div>
                </div>
              </div>
              <div class="cards links">
                <div>
                  <div>
                    <h6 id="resources">Resources</h6>
                  </div>
                </div>
                <div>
                  <div>
                    <ul>
                      <li><a href="https://www.cmegroup.com/education/files/educational-inventory.pdf">Course Inventory</a></li>
                      <li><a href="https://www.cmegroup.com/education/glossary.html">Glossary</a></li>
                      <li><a href="https://www.cmegroup.com/education/events/economic-releases-calendar.html">Economic Calendar</a></li>
                    </ul>
                  </div>
                  <div>
                    <ul>
                      <li><a href="https://www.cmegroup.com/education/browse-all.html#filters=case-study">Case Studies</a></li>
                      <li><a href="https://www.cmegroup.com/education/academic-resources.html?itm_source=cmegroup&#x26;itm_medium=education_&#x26;itm_campaign=resources_section">Academic Resources</a></li>
                      <li><a href="https://www.cmegroup.com/videos.html">Video Archive</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="form one-click">
                <div>
                  <div>Id</div>
                  <div>CUF-2023-AG-004</div>
                </div>
                <div>
                  <div>High Value</div>
                  <div>true</div>
                </div>
                <div>
                  <div>Source</div>
                  <div><a href="/forms/one-click-subscription/one-click-example.json">https://main--www--cmegroup.aem.live/forms/one-click-subscription/one-click-example.json</a></div>
                </div>
              </div>
              <div class="section-metadata">
                <div>
                  <div>layout</div>
                  <div>60-40</div>
                </div>
                <div>
                  <div>arrange</div>
                  <div>2-1</div>
                </div>
              </div>
            </div>
            <div>
              <h2 id="education-and-research-that-helps-connect-with-your-audience">Education and research that helps connect with your audience</h2>
              <p>The CME Institute creates and syndicates a variety of content for publishers, educators and students. We can help you provide the content that fits the needs of your audience.</p>
              <div class="cards white-raised-box">
                <div>
                  <div>
                    <h4 id="academics"><a href="https://www.cmegroup.com/education/academic-resources.html?itm_source=cmegroup&#x26;itm_medium=education_learning_paths&#x26;itm_campaign=academic_resources_slot_3">Academics</a></h4>
                    <p>Access more than 60 free online courses, set up a private trading simulation for individual classes and examine specific market data packages for research.</p>
                    <ul>
                      <li>Design a Trading Challenge</li>
                      <li>Explore CME Group Market Data</li>
                      <li>Contact us for bespoke solutions</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <div>
                    <h4 id="content-integration"><a href="https://www.cmegroup.com/campaigns/cme-group-content-offering.html">Content integration</a></h4>
                    <p>Browse education, market insights and research available for republishing to your intranets, external websites or customer communications.</p>
                    <ul>
                      <li>Latest insights on economic trends</li>
                      <li>Education content for traders and investors</li>
                      <li>Inquire today about our full content offering</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 id="get-in-touch-with-the-cme-institute">Get in touch with the CME Institute</h2>
              <p>Contact us to learn more about how our course curricula, private trading challenges and tools can help you stay a step ahead.</p>
              <div class="form contact-us grid">
                <div>
                  <div>Id</div>
                  <div>CUF-2023-AG-004</div>
                </div>
                <div>
                  <div>Source</div>
                  <div><a href="/forms/contact-us.json">https://main--www--cmegroup.aem.live/forms/contact-us.json</a></div>
                </div>
                <div>
                  <div>Submit Logged Out</div>
                  <div><a href="/fragments/contact-us-form-logged-out-submit">https://main--www--cmegroup.aem.live/fragments/contact-us-form-logged-out-submit</a></div>
                </div>
                <div>
                  <div>Submit Logged In</div>
                  <div><a href="/fragments/contact-us-form-logged-in-submit">https://main--www--cmegroup.aem.live/fragments/contact-us-form-logged-in-submit</a></div>
                </div>
                <div>
                  <div>Mock</div>
                  <div>LoggedIn</div>
                </div>
              </div>
              <div class="section-metadata">
                <div>
                  <div>style</div>
                  <div>blue3-background</div>
                </div>
                <div>
                  <div>layout</div>
                  <div>50-50</div>
                </div>
                <div>
                  <div>arrange</div>
                  <div>1-1</div>
                </div>
              </div>
            </div>
          </main>
          <footer></footer>
        </body>
      </html>
      "
    `);
  });

  it('responds with Hello World! (integration style)', async () => {
    const response = await SELF.fetch('http://example.com');
    expect(await response.text()).toMatchInlineSnapshot(`
      "<!DOCTYPE html>
      <html>
        <head>
          <title>Education - CME Group</title>
          <link rel="canonical" href="https://main--www--cmegroup.aem.live/education">
          <meta name="description" content="Resources Trading Simulator Course Catalog Glossary Research &#x26; Reports Trading Challenge.">
          <meta property="og:title" content="Education - CME Group">
          <meta property="og:description" content="Resources Trading Simulator Course Catalog Glossary Research &#x26; Reports Trading Challenge.">
          <meta property="og:url" content="https://main--www--cmegroup.aem.live/education">
          <meta property="og:image" content="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-leadspace-1400x500.jpg">
          <meta property="og:image:secure_url" content="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-leadspace-1400x500.jpg">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="Education - CME Group">
          <meta name="twitter:description" content="Resources Trading Simulator Course Catalog Glossary Research &#x26; Reports Trading Challenge.">
          <meta name="twitter:image" content="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-leadspace-1400x500.jpg">
          <meta name="locale" content="en">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="/aemedge/scripts/aem.js" type="module"></script>
          <script src="/aemedge/scripts/scripts.js" type="module"></script>
          <link rel="stylesheet" href="/aemedge/styles/styles.css">
        </head>
        <body>
          <header></header>
          <main>
            <div>
              <div class="course-progress container">
                <div>
                  <div>items</div>
                  <div>6</div>
                </div>
              </div>
              <div class="hero leadspace overlapped">
                <div>
                  <div>
                    <h5 id="education">Education</h5>
                    <h1 id="deepen-your-understanding-of-the-futures-market-with-cme-institute">DEEPEN YOUR UNDERSTANDING OF THE FUTURES MARKET WITH CME INSTITUTE</h1>
                    <p>Whether you're experienced at trading or building your foundation of knowledge, our educational courses and tools help you stay a step ahead.</p>
                    <p><a href="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-leadspace-1400x500.jpg">https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-leadspace-1400x500.jpg</a></p>
                  </div>
                </div>
              </div>
              <div class="section-metadata">
                <div>
                  <div>style</div>
                  <div>full-width</div>
                </div>
                <div>
                  <div>id</div>
                  <div>custom-id</div>
                </div>
              </div>
            </div>
            <div>
              <div class="cards blue-box h3-citron">
                <div>
                  <div>
                    <h5 id="enhance-your-knowledge">ENHANCE YOUR KNOWLEDGE</h5>
                    <h3 id="explore-courses-to-learn-about-futures-and-options">Explore courses to learn about futures and options</h3>
                    <p><a href="#gain-confidence-through-knowledge">Learn</a></p>
                  </div>
                </div>
                <div>
                  <div>
                    <h5 id="apply-your-learning">APPLY YOUR LEARNING</h5>
                    <h3 id="get-hands-on-trading-experience">Get hands-on trading experience</h3>
                    <p><a href="#practice-what-you-learn">Practice</a></p>
                  </div>
                </div>
                <div>
                  <div>
                    <h5 id="make-informed-decisions">MAKE INFORMED DECISIONS</h5>
                    <h3 id="stay-on-top-of-the-latest-market-trends">Stay on top of the latest market trends</h3>
                    <p><a href="#follow-the-markets-to-make-informed-decisions">Follow the markets</a></p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 id="education-webinars-and-events">EDUCATION WEBINARS AND EVENTS</h4>
              <div class="columns column-75-25 last-column-right">
                <div>
                  <div>Find opportunities to register and attend webinars and events from CME Institute on the products that interest you.</div>
                  <div><a href="https://www.cmegroup.com/education/courses.html">View all</a></div>
                </div>
              </div>
              <div class="cards dynamic upcoming-events">
                <div>
                  <div>optional tags</div>
                  <div>content-type/webinar, News-And-Events/classroom, News-And-Events/webinar</div>
                </div>
              </div>
            </div>
            <div>
              <h2 id="gain-confidence-through-knowledge">Gain confidence through knowledge</h2>
              <div class="columns column-75-25 last-column-right">
                <div>
                  <div>Explore courses to refine your understanding of futures and options products. Browse self-paced courses and pathways to guide you through your journey into derivatives.</div>
                  <div><a href="https://www.cmegroup.com/education/courses.html">View all courses</a></div>
                </div>
              </div>
            </div>
            <div>
              <div class="accordion cards">
                <div>
                  <div>Trading Futures</div>
                </div>
                <div>
                  <div>tags</div>
                  <div>topic/getting-started, display/featured-courses/fundamentals</div>
                </div>
                <div>
                  <div>Trading Options on Futures</div>
                </div>
                <div>
                  <div>tags</div>
                  <div>topic/getting-started,</div>
                </div>
                <div>
                  <div>Trading Crypto Futures</div>
                </div>
                <div>
                  <div>tags</div>
                  <div>topic/education/getting-started/trading-crypto-futures</div>
                </div>
                <div>
                  <div>Futures vs. ETFs</div>
                </div>
                <div>
                  <div>tags</div>
                  <div>topic/education/getting-started/futures-vs-etfs</div>
                </div>
              </div>
              <div class="fragment">
                <div>
                  <div><a href="/fragments/accredited-course">https://main--www--cmegroup.aem.live/fragments/accredited-course</a></div>
                </div>
              </div>
            </div>
            <div>
              <h2 id="practice-what-you-learn">Practice what you learn</h2>
              <p>The CME Institute has tools that can help you develop your trading skills, develop new strategies or gain new insights about the market.</p>
              <div class="section-metadata">
                <div>
                  <div>style</div>
                  <div>gray5-background</div>
                </div>
              </div>
              <div class="columns education white-background gap-30">
                <div>
                  <div><a href="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/trading-simulator-desktop.png">https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/trading-simulator-desktop.png</a></div>
                  <div>
                    <h2 id="make-the-most-of-each-trade-with-the-trading-simulator">Make the most of each trade with the Trading Simulator</h2>
                    <p>Study the charts, add your indicators, test your strategies, and manage a practice account for free.</p>
                    <p><a href="https://www.cmegroup.com/trading_tools/simulator" title=":arrow-right-thin: Explore this tool"><span class="icon icon-arrow-right-thin"></span>Explore this tool</a></p>
                  </div>
                </div>
              </div>
              <div class="cards promo">
                <div>
                  <div>
                    <h4 id="trading-and-analytics-tools"><strong><a href="https://www.cmegroup.com/education/practice.html">Trading and analytics tools</a></strong></h4>
                    <p><a href="https://www.cmegroup.com/education/practice.html">Use our analytics tools to uncover insights that can give you an edge in every phase of your trading journey.</a></p>
                  </div>
                </div>
                <div>
                  <div>
                    <h4 id="trading-challenge"><strong><a href="https://www.cmegroup.com/education/trading-challenge.html">Trading Challenge</a></strong></h4>
                    <p><a href="https://www.cmegroup.com/education/trading-challenge.html">Put your trading knowledge to the test and compete in a real-time simulated environment.</a></p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 id="follow-the-markets-to-make-informed-decisions">Follow the markets to make informed decisions</h2>
              <div class="columns column-75-25 last-column-right flex-end">
                <div>
                  <div>Futures markets can offer valuable early insights on how traders are responding to economic news and global events - insights to help adjust positions accordingly.</div>
                  <div><a href="https://www.cmegroup.com/education/browse-all.html#filters=featured-article">View all</a></div>
                </div>
              </div>
              <div class="cards dynamic article card-list">
                <div>
                  <div>tags</div>
                  <div>content-type/featured-article</div>
                </div>
              </div>
            </div>
            <div>
              <div class="cards event h3-citron">
                <div>
                  <div><a href="https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-calendar.jpg">https://www.cmegroup.com/content/dam/cmegroup/education/images/2021/q4/education-calendar.jpg</a></div>
                  <div>
                    <h3 id="cme-group-event-calendar">CME Group Event Calendar</h3>
                    <p>Explore Educational events covering the latest, most relevant topics in online and in-person formats.</p>
                    <p><a href="https://www.cmegroup.com/education/events.html">Learn More</a></p>
                  </div>
                </div>
              </div>
              <div class="cards links">
                <div>
                  <div>
                    <h6 id="resources">Resources</h6>
                  </div>
                </div>
                <div>
                  <div>
                    <ul>
                      <li><a href="https://www.cmegroup.com/education/files/educational-inventory.pdf">Course Inventory</a></li>
                      <li><a href="https://www.cmegroup.com/education/glossary.html">Glossary</a></li>
                      <li><a href="https://www.cmegroup.com/education/events/economic-releases-calendar.html">Economic Calendar</a></li>
                    </ul>
                  </div>
                  <div>
                    <ul>
                      <li><a href="https://www.cmegroup.com/education/browse-all.html#filters=case-study">Case Studies</a></li>
                      <li><a href="https://www.cmegroup.com/education/academic-resources.html?itm_source=cmegroup&#x26;itm_medium=education_&#x26;itm_campaign=resources_section">Academic Resources</a></li>
                      <li><a href="https://www.cmegroup.com/videos.html">Video Archive</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="form one-click">
                <div>
                  <div>Id</div>
                  <div>CUF-2023-AG-004</div>
                </div>
                <div>
                  <div>High Value</div>
                  <div>true</div>
                </div>
                <div>
                  <div>Source</div>
                  <div><a href="/forms/one-click-subscription/one-click-example.json">https://main--www--cmegroup.aem.live/forms/one-click-subscription/one-click-example.json</a></div>
                </div>
              </div>
              <div class="section-metadata">
                <div>
                  <div>layout</div>
                  <div>60-40</div>
                </div>
                <div>
                  <div>arrange</div>
                  <div>2-1</div>
                </div>
              </div>
            </div>
            <div>
              <h2 id="education-and-research-that-helps-connect-with-your-audience">Education and research that helps connect with your audience</h2>
              <p>The CME Institute creates and syndicates a variety of content for publishers, educators and students. We can help you provide the content that fits the needs of your audience.</p>
              <div class="cards white-raised-box">
                <div>
                  <div>
                    <h4 id="academics"><a href="https://www.cmegroup.com/education/academic-resources.html?itm_source=cmegroup&#x26;itm_medium=education_learning_paths&#x26;itm_campaign=academic_resources_slot_3">Academics</a></h4>
                    <p>Access more than 60 free online courses, set up a private trading simulation for individual classes and examine specific market data packages for research.</p>
                    <ul>
                      <li>Design a Trading Challenge</li>
                      <li>Explore CME Group Market Data</li>
                      <li>Contact us for bespoke solutions</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <div>
                    <h4 id="content-integration"><a href="https://www.cmegroup.com/campaigns/cme-group-content-offering.html">Content integration</a></h4>
                    <p>Browse education, market insights and research available for republishing to your intranets, external websites or customer communications.</p>
                    <ul>
                      <li>Latest insights on economic trends</li>
                      <li>Education content for traders and investors</li>
                      <li>Inquire today about our full content offering</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 id="get-in-touch-with-the-cme-institute">Get in touch with the CME Institute</h2>
              <p>Contact us to learn more about how our course curricula, private trading challenges and tools can help you stay a step ahead.</p>
              <div class="form contact-us grid">
                <div>
                  <div>Id</div>
                  <div>CUF-2023-AG-004</div>
                </div>
                <div>
                  <div>Source</div>
                  <div><a href="/forms/contact-us.json">https://main--www--cmegroup.aem.live/forms/contact-us.json</a></div>
                </div>
                <div>
                  <div>Submit Logged Out</div>
                  <div><a href="/fragments/contact-us-form-logged-out-submit">https://main--www--cmegroup.aem.live/fragments/contact-us-form-logged-out-submit</a></div>
                </div>
                <div>
                  <div>Submit Logged In</div>
                  <div><a href="/fragments/contact-us-form-logged-in-submit">https://main--www--cmegroup.aem.live/fragments/contact-us-form-logged-in-submit</a></div>
                </div>
                <div>
                  <div>Mock</div>
                  <div>LoggedIn</div>
                </div>
              </div>
              <div class="section-metadata">
                <div>
                  <div>style</div>
                  <div>blue3-background</div>
                </div>
                <div>
                  <div>layout</div>
                  <div>50-50</div>
                </div>
                <div>
                  <div>arrange</div>
                  <div>1-1</div>
                </div>
              </div>
            </div>
          </main>
          <footer></footer>
        </body>
      </html>
      "
    `);
  });
});
