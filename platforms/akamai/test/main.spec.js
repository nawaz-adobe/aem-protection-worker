import { describe, it, expect, beforeEach, vi } from 'vitest';
import { responseProvider, auth } from '../src/main-standalone.js';

describe('AEM Protection Worker - Akamai', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    global.httpRequest.mockResolvedValue({
      status: 200,
      getHeader: vi.fn((name) => name === 'content-type' ? 'text/html' : null),
      getHeaders: vi.fn(() => ({ 'content-type': 'text/html' })),
      text: vi.fn().mockResolvedValue('<html><body>Default content</body></html>'),
    });
  });

  describe('Bypass Logic', () => {
    it('should bypass fragment paths', async () => {
      const request = global.mockRequest('https://example.com/fragments/teaser');
      
      await responseProvider(request);
      
      expect(global.httpRequest).toHaveBeenCalledWith(
        'https://main--www--example.aem.live/fragments/teaser'
      );
    });

    it('should bypass nav.plain.html', async () => {
      const request = global.mockRequest('https://example.com/nav.plain.html');
      
      await responseProvider(request);
      
      expect(global.httpRequest).toHaveBeenCalledWith(
        'https://main--www--example.aem.live/nav.plain.html'
      );
    });
  });

  describe('Non-HTML Content', () => {
    it('should pass through non-HTML content types', async () => {
      global.httpRequest.mockResolvedValue({
        status: 200,
        getHeader: vi.fn((name) => name === 'content-type' ? 'application/json' : null),
        getHeaders: vi.fn(() => ({ 'content-type': 'application/json' })),
        text: vi.fn().mockResolvedValue('{"data": "test"}'),
      });

      const request = global.mockRequest('https://example.com/api/data');
      const response = await responseProvider(request);
      
      expect(response.getHeader('content-type')).toBe('application/json');
    });
  });

  describe('Non-Gated Content', () => {
    it('should pass through content without gated meta tag', async () => {
      const html = `
        <html>
        <head><title>Test</title></head>
        <body>
          <main>
            <div>
              <h1>Public Content</h1>
              <p>This is available to everyone.</p>
            </div>
          </main>
        </body>
        </html>
      `;

      global.httpRequest.mockResolvedValue({
        status: 200,
        getHeader: vi.fn((name) => name === 'content-type' ? 'text/html' : null),
        getHeaders: vi.fn(() => ({ 'content-type': 'text/html' })),
        text: vi.fn().mockResolvedValue(html),
      });

      const request = global.mockRequest('https://example.com/public-page');
      const response = await responseProvider(request);
      
      expect(response.body).toContain('Public Content');
      expect(response.body).toContain('This is available to everyone');
    });
  });

  describe('Gated Content - Anonymous User', () => {
    it('should remove logged-in sections and show logged-out sections', async () => {
      const html = `
        <html>
        <head>
          <meta name="gated" content="true">
          <title>Test</title>
        </head>
        <body>
          <main>
            <div>
              <h2>Anonymous Content</h2>
              <div class="section-metadata">
                <div><div>view</div><div>logged-out</div></div>
              </div>
            </div>
            <div>
              <h2>Member Content</h2>
              <div class="section-metadata">
                <div><div>view</div><div>logged-in</div></div>
              </div>
            </div>
            <div>
              <h2>Public Section</h2>
              <div class="brightcove logged-in">Premium Video</div>
              <div class="fragment logged-out">Video Teaser</div>
            </div>
          </main>
        </body>
        </html>
      `;

      global.httpRequest.mockResolvedValue({
        status: 200,
        getHeader: vi.fn((name) => name === 'content-type' ? 'text/html' : null),
        getHeaders: vi.fn(() => ({ 'content-type': 'text/html' })),
        text: vi.fn().mockResolvedValue(html),
      });

      const request = global.mockRequest('https://example.com/gated-page');
      const response = await responseProvider(request);
      
      // Should contain anonymous content
      expect(response.body).toContain('Anonymous Content');
      expect(response.body).toContain('Video Teaser');
      
      // Should NOT contain member content
      expect(response.body).not.toContain('Member Content');
      expect(response.body).not.toContain('Premium Video');
    });
  });

  describe('Gated Content - Authenticated User', () => {
    it('should remove logged-out sections and show logged-in sections', async () => {
      // Mock auth to return true
      vi.spyOn(auth, 'checkAuthentication').mockReturnValue(true);

      const html = `
        <html>
        <head>
          <meta name="gated" content="true">
          <title>Test</title>
        </head>
        <body>
          <main>
            <div>
              <h2>Anonymous Content</h2>
              <div class="section-metadata">
                <div><div>view</div><div>logged-out</div></div>
              </div>
            </div>
            <div>
              <h2>Member Content</h2>
              <div class="section-metadata">
                <div><div>view</div><div>logged-in</div></div>
              </div>
            </div>
            <div>
              <h2>Public Section</h2>
              <div class="brightcove logged-in">Premium Video</div>
              <div class="fragment logged-out">Video Teaser</div>
            </div>
          </main>
        </body>
        </html>
      `;

      global.httpRequest.mockResolvedValue({
        status: 200,
        getHeader: vi.fn((name) => name === 'content-type' ? 'text/html' : null),
        getHeaders: vi.fn(() => ({ 'content-type': 'text/html' })),
        text: vi.fn().mockResolvedValue(html),
      });

      const request = global.mockRequest('https://example.com/gated-page');
      const response = await responseProvider(request);
      
      // Should contain member content
      expect(response.body).toContain('Member Content');
      expect(response.body).toContain('Premium Video');
      
      // Should NOT contain anonymous content
      expect(response.body).not.toContain('Anonymous Content');
      expect(response.body).not.toContain('Video Teaser');
    });
  });

  describe('Section and Block Filtering', () => {
    it('should test section-level filtering only', async () => {
      vi.spyOn(auth, 'checkAuthentication').mockReturnValue(false);
      
      const html = `
        <html>
        <head>
          <meta name="gated" content="true">
          <title>Section Test</title>
        </head>
        <body>
          <main>
            <div>
              <h2>Anonymous Section</h2>
              <p>Content for anonymous users</p>
              <div class="section-metadata">
                <div><div>view</div><div>logged-out</div></div>
              </div>
            </div>
            <div>
              <h2>Member Section</h2>
              <p>Content for logged-in users</p>
              <div class="section-metadata">
                <div><div>view</div><div>logged-in</div></div>
              </div>
            </div>
            <div>
              <h2>Public Section</h2>
              <p>Content for everyone (no section-metadata)</p>
            </div>
          </main>
        </body>
        </html>
      `;

      global.httpRequest.mockResolvedValue({
        status: 200,
        getHeader: vi.fn((name) => name === 'content-type' ? 'text/html' : null),
        getHeaders: vi.fn(() => ({ 'content-type': 'text/html' })),
        text: vi.fn().mockResolvedValue(html),
      });

      const request = global.mockRequest('https://example.com/section-test');
      const response = await responseProvider(request);
      
      // Should contain anonymous and public content
      expect(response.body).toContain('Anonymous Section');
      expect(response.body).toContain('Public Section');
      
      // Should NOT contain member content
      expect(response.body).not.toContain('Member Section');
    });

    it('should test block-level filtering only', async () => {
      vi.spyOn(auth, 'checkAuthentication').mockReturnValue(false);
      
      const html = `
        <html>
        <head>
          <meta name="gated" content="true">
          <title>Block Test</title>
        </head>
        <body>
          <main>
            <div>
              <h2>Mixed Content Section</h2>
              <p>This section has mixed block-level content:</p>
              <div class="video logged-in">Premium Video Player</div>
              <div class="teaser logged-out">Sign Up Teaser</div>
              <div class="content logged-in">Member-only Article</div>
              <div class="banner logged-out">Free Trial Banner</div>
              <p>Regular content available to all</p>
            </div>
          </main>
        </body>
        </html>
      `;

      global.httpRequest.mockResolvedValue({
        status: 200,
        getHeader: vi.fn((name) => name === 'content-type' ? 'text/html' : null),
        getHeaders: vi.fn(() => ({ 'content-type': 'text/html' })),
        text: vi.fn().mockResolvedValue(html),
      });

      const request = global.mockRequest('https://example.com/block-test');
      const response = await responseProvider(request);
      
      // Should contain anonymous block content
      expect(response.body).toContain('Sign Up Teaser');
      expect(response.body).toContain('Free Trial Banner');
      expect(response.body).toContain('Regular content available to all');
      
      // Should NOT contain member block content
      expect(response.body).not.toContain('Premium Video Player');
      expect(response.body).not.toContain('Member-only Article');
    });

    it('should handle deeply nested divs correctly (balanced matching)', async () => {
      vi.spyOn(auth, 'checkAuthentication').mockReturnValue(false);
      
      const html = `
        <html>
        <head>
          <meta name="gated" content="true">
          <title>Nested Test</title>
        </head>
        <body>
          <main>
            <div>
              <h2>Complex Nested Content</h2>
              <div class="brightcove logged-in">
                <div>
                  <div>accountID</div>
                  <div>49919183001</div>
                </div>
                <div>
                  <div>videoID</div>
                  <div>ref:170918ClearingStructure</div>
                </div>
                <div>
                  <div>aspectRatio</div>
                  <div>16:9</div>
                </div>
              </div>
              <div class="fragment logged-out">
                <div>
                  <div><a href="/teaser">Video Teaser</a></div>
                </div>
              </div>
              <p>Regular content</p>
            </div>
          </main>
        </body>
        </html>
      `;

      global.httpRequest.mockResolvedValue({
        status: 200,
        getHeader: vi.fn((name) => name === 'content-type' ? 'text/html' : null),
        getHeaders: vi.fn(() => ({ 'content-type': 'text/html' })),
        text: vi.fn().mockResolvedValue(html),
      });

      const request = global.mockRequest('https://example.com/nested-test');
      const response = await responseProvider(request);
      
      // Should contain logged-out content and regular content
      expect(response.body).toContain('Video Teaser');
      expect(response.body).toContain('Regular content');
      
      // Should NOT contain any of the nested logged-in content
      expect(response.body).not.toContain('brightcove');
      expect(response.body).not.toContain('accountID');
      expect(response.body).not.toContain('49919183001');
      expect(response.body).not.toContain('videoID');
      expect(response.body).not.toContain('170918ClearingStructure');
      
      // Critical: Check div balance (no dangling tags from greedy regex)
      const openDivs = (response.body.match(/<div/g) || []).length;
      const closeDivs = (response.body.match(/<\/div>/g) || []).length;
      expect(openDivs).toBe(closeDivs); // This would fail with greedy regex
    });

    it('should handle multiple sections and blocks correctly', async () => {
      vi.spyOn(auth, 'checkAuthentication').mockReturnValue(false);
      const html = `
        <html>
        <head>
          <meta name="gated" content="true">
          <title>Complex Test</title>
        </head>
        <body>
          <main>
            <div>
              <h2>Public Header</h2>
            </div>
            <div>
              <h2>Free Section</h2>
              <p>Free content for everyone</p>
              <div class="section-metadata">
                <div><div>view</div><div>logged-out</div></div>
              </div>
            </div>
            <div>
              <h2>Premium Section</h2>
              <p>Premium content for members</p>
              <div class="section-metadata">
                <div><div>view</div><div>logged-in</div></div>
              </div>
            </div>
            <div>
              <h2>Mixed Section</h2>
              <div class="video logged-in">Member Video</div>
              <div class="teaser logged-out">Upgrade Now</div>
              <p>Public content in mixed section</p>
            </div>
          </main>
        </body>
        </html>
      `;

      global.httpRequest.mockResolvedValue({
        status: 200,
        getHeader: vi.fn((name) => name === 'content-type' ? 'text/html' : null),
        getHeaders: vi.fn(() => ({ 'content-type': 'text/html' })),
        text: vi.fn().mockResolvedValue(html),
      });

      const request = global.mockRequest('https://example.com/complex-page');
      const response = await responseProvider(request);
      
      expect(response.body).toContain('Public Header');
      expect(response.body).toContain('Free Section');
      expect(response.body).toContain('Upgrade Now');
      expect(response.body).toContain('Public content in mixed section');
      
      expect(response.body).not.toContain('Premium Section');
      expect(response.body).not.toContain('Member Video');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      global.httpRequest.mockRejectedValue(new Error('Network error'));

      const request = global.mockRequest('https://example.com/test-page');
      const response = await responseProvider(request);
      
      expect(response.status).toBe(500);
      expect(response.body).toContain('Content protection service temporarily unavailable');
    });

    it('should handle malformed HTML gracefully', async () => {
      const malformedHtml = '<html><head><meta name="gated" content="true"></head><body><div><div class="section-metadata"><div><div>view</div></body></html>';

      global.httpRequest.mockResolvedValue({
        status: 200,
        getHeader: vi.fn((name) => name === 'content-type' ? 'text/html' : null),
        getHeaders: vi.fn(() => ({ 'content-type': 'text/html' })),
        text: vi.fn().mockResolvedValue(malformedHtml),
      });

      const request = global.mockRequest('https://example.com/malformed-page');
      const response = await responseProvider(request);
      
      // Should not crash and return some response
      expect(response.status).toBe(200);
    });
  });
});
