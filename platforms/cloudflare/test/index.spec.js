import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from '../src';
import auth from '../src/handlers/auth';

describe('Gated Content Protection Worker', () => {
  it('bypasses processing for fragment paths', async () => {
    // Mock fetch for fragment path
    global.fetch = vi.fn().mockResolvedValue(new Response('Fragment content', {
      status: 200,
      headers: { 'content-type': 'text/html' }
    }));

    const request = new Request('http://example.com/fragments/test-fragment');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    // Should bypass protection logic
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Fragment content');
  });

  it('returns original content for non-gated pages', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page</title>
        </head>
        <body>
          <main>
            <div>
              <h1>Public Content</h1>
              <p>This content is always visible</p>
            </div>
          </main>
        </body>
      </html>
    `;
    
    // Mock fetch to return our test HTML
    global.fetch = vi.fn().mockResolvedValue(new Response(mockHtml, {
      status: 200,
      headers: { 'content-type': 'text/html' }
    }));

    const request = new Request('http://example.com/test-page');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    const html = await response.text();
    expect(html).toContain('Public Content');
    expect(html).toContain('This content is always visible');
  });

  it('processes gated content for unauthenticated users', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gated Page</title>
          <meta name="gated" content="true">
        </head>
        <body>
          <main>
            <div>
              <h1>Authenticated Content</h1>
              <p>Only logged in users see this</p>
              <div class="section-metadata">
                <div>
                  <div>style</div>
                  <div>Blue2-background</div>
                </div>
                <div>
                  <div>view</div>
                  <div>logged-in</div>
                </div>
              </div>
            </div>
            <div>
              <h1>Please Log In</h1>
              <p>Please log in to access premium content</p>
              <div class="section-metadata">
                <div>
                  <div>view</div>
                  <div>logged-out</div>
                </div>
              </div>
            </div>
            <div>
              <h2>Public Section</h2>
              <div class="logged-in">Premium feature</div>
              <div class="logged-out">Sign up for premium</div>
            </div>
          </main>
        </body>
      </html>
    `;
    
    global.fetch = vi.fn().mockResolvedValue(new Response(mockHtml, {
      status: 200,
      headers: { 'content-type': 'text/html' }
    }));

    const request = new Request('http://example.com/gated-page');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    const html = await response.text();
    
    // Should remove logged-in sections and blocks
    expect(html).not.toContain('Authenticated Content');
    expect(html).not.toContain('Only logged in users see this');
    expect(html).not.toContain('Premium feature');
    
    // Should keep logged-out sections and blocks
    expect(html).toContain('Please Log In');
    expect(html).toContain('Please log in to access premium content');
    expect(html).toContain('Sign up for premium');
    expect(html).toContain('Public Section');
  });

  it('processes gated content for authenticated users (mocked)', async () => {
    // Mock auth to return true for this test
    const authSpy = vi.spyOn(auth, 'checkAuthentication').mockReturnValue(true);
    
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gated Page</title>
          <meta name="gated" content="true">
        </head>
        <body>
          <main>
            <div>
              <h1>Authenticated Content</h1>
              <p>Welcome back, premium user!</p>
              <div class="section-metadata">
                <div>
                  <div>style</div>
                  <div>Blue2-background</div>
                </div>
                <div>
                  <div>view</div>
                  <div>logged-in</div>
                </div>
              </div>
            </div>
            <div>
              <h1>Please Log In</h1>
              <p>Please log in to access premium content</p>
              <div class="section-metadata">
                <div>
                  <div>view</div>
                  <div>logged-out</div>
                </div>
              </div>
            </div>
            <div>
              <h2>Public Section</h2>
              <div class="logged-in">Premium feature unlocked</div>
              <div class="logged-out">Sign up for premium</div>
            </div>
          </main>
        </body>
      </html>
    `;
    
    global.fetch = vi.fn().mockResolvedValue(new Response(mockHtml, {
      status: 200,
      headers: { 'content-type': 'text/html' }
    }));

    const request = new Request('http://example.com/gated-page');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    const html = await response.text();
    
    // Should keep logged-in sections and blocks
    expect(html).toContain('Authenticated Content');
    expect(html).toContain('Welcome back, premium user!');
    expect(html).toContain('Premium feature unlocked');
    
    // Should remove logged-out sections and blocks
    expect(html).not.toContain('Please Log In');
    expect(html).not.toContain('Please log in to access premium content');
    expect(html).not.toContain('Sign up for premium');
    
    expect(html).toContain('Public Section');
    
    // Restore original implementation
    authSpy.mockRestore();
  });

  it('handles section-metadata view filtering correctly', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="gated" content="true">
        </head>
        <body>
          <main>
            <div>
              <h2>Premium Content</h2>
              <p>This content is only for authenticated users.</p>
              <div class="section-metadata">
                <div>
                  <div>style</div>
                  <div>background-color</div>
                </div>
                <div>
                  <div>view</div>
                  <div>logged-in</div>
                </div>
              </div>
            </div>
            <div>
              <p><a href="/fragments/teasers/mock-teaser">Mock teaser link</a></p>
              <div class="section-metadata">
                <div>
                  <div>view</div>
                  <div>logged-out</div>
                </div>
              </div>
            </div>
          </main>
        </body>
      </html>
    `;
    
    global.fetch = vi.fn().mockResolvedValue(new Response(mockHtml, {
      status: 200,
      headers: { 'content-type': 'text/html' }
    }));

    const request = new Request('http://example.com/section-test');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    const html = await response.text();
    
    // For unauthenticated user - should remove logged-in section and keep logged-out
    expect(html).not.toContain('Premium Content');
    expect(html).not.toContain('This content is only for authenticated users');
    expect(html).toContain('mock-teaser');
  });

  it('handles block-level protection for unauthenticated users', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="gated" content="true">
        </head>
        <body>
          <main>
            <div>
              <div class="video-player logged-in">
                <div>
                  <div>Account ID</div>
                  <div>mock-account-123</div>
                </div>
                <div>
                  <div>Video ID</div>
                  <div>mock-video-456</div>
                </div>
                <div>
                  <div>Image URL</div>
                  <div><a href="/mock/image.jpg">Mock placeholder image</a></div>
                </div>
              </div>
              <div class="teaser logged-out">
                <div>
                  <div><a href="/fragments/teasers/mock-video">Mock video teaser</a></div>
                </div>
              </div>
              <h2>Video Overview</h2>
              <p>This is public content that describes the video.</p>
              <p>Additional public information about the topic.</p>
            </div>
          </main>
        </body>
      </html>
    `;
    
    global.fetch = vi.fn().mockResolvedValue(new Response(mockHtml, {
      status: 200,
      headers: { 'content-type': 'text/html' }
    }));

    const request = new Request('http://example.com/block-test');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    const html = await response.text();
    
    // For unauthenticated user - should remove logged-in blocks and keep logged-out blocks
    expect(html).not.toContain('video-player logged-in');
    expect(html).not.toContain('mock-account-123');
    expect(html).not.toContain('mock-video-456');
    expect(html).toContain('mock-video');
    expect(html).toContain('teaser logged-out');
    
    // Public content should always be visible
    expect(html).toContain('Video Overview');
    expect(html).toContain('This is public content');
    expect(html).toContain('Additional public information');
  });

  it('handles block-level protection for authenticated users', async () => {
    // Mock auth to return true for this test
    const authSpy = vi.spyOn(auth, 'checkAuthentication').mockReturnValue(true);
    
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="gated" content="true">
        </head>
        <body>
          <main>
            <div>
              <div class="video-player logged-in">
                <div>
                  <div>Account ID</div>
                  <div>mock-account-789</div>
                </div>
                <div>
                  <div>Video ID</div>
                  <div>premium-content-abc</div>
                </div>
              </div>
              <div class="teaser logged-out">
                <div>
                  <div><a href="/fragments/teasers/mock-video">Mock video teaser</a></div>
                </div>
              </div>
              <h2>Premium Video Content</h2>
              <p>Public content always visible to everyone</p>
            </div>
          </main>
        </body>
      </html>
    `;
    
    global.fetch = vi.fn().mockResolvedValue(new Response(mockHtml, {
      status: 200,
      headers: { 'content-type': 'text/html' }
    }));

    const request = new Request('http://example.com/block-auth-test');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    const html = await response.text();
    
    // For authenticated user - should keep logged-in blocks and remove logged-out blocks
    expect(html).toContain('video-player logged-in');
    expect(html).toContain('mock-account-789');
    expect(html).toContain('premium-content-abc');
    expect(html).not.toContain('mock-video');
    expect(html).not.toContain('teaser logged-out');
    
    // Public content should always be visible
    expect(html).toContain('Premium Video Content');
    expect(html).toContain('Public content always visible');
    
    // Restore original implementation
    authSpy.mockRestore();
  });

  it('handles complex nested content correctly', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="gated" content="true">
        </head>
        <body>
          <main>
            <div>
              <h1>Always Visible</h1>
              <div class="logged-in">
                <p>Premium content</p>
                <div class="nested-content">More premium</div>
              </div>
              <div class="logged-out">
                <p>Free content</p>
              </div>
            </div>
            <div>
              <div class="some-class">Authenticated section</div>
              <div class="section-metadata">
                <div>
                  <div>view</div>
                  <div>logged-in</div>
                </div>
              </div>
            </div>
          </main>
        </body>
      </html>
    `;
    
    global.fetch = vi.fn().mockResolvedValue(new Response(mockHtml, {
      status: 200,
      headers: { 'content-type': 'text/html' }
    }));

    const request = new Request('http://example.com/complex-page');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    const html = await response.text();
    
    // For unauthenticated user
    expect(html).toContain('Always Visible');
    expect(html).toContain('Free content');
    expect(html).not.toContain('Premium content');
    expect(html).not.toContain('More premium');
    expect(html).not.toContain('Authenticated section');
  });

  it('handles error cases gracefully', async () => {
    // Mock fetch to throw an error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const request = new Request('http://example.com/error-page');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Internal server error');
  });

  it('handles non-HTML content types correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('{"data": "json"}', {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }));

    const request = new Request('http://example.com/api/data.json');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    // Should pass through without processing
    expect(await response.text()).toBe('{"data": "json"}');
  });
});