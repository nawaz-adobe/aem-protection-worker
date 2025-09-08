/**
 * Test setup for Akamai EdgeWorkers environment
 * Mock EdgeWorkers-specific APIs
 */

// Mock EdgeWorkers http-request API
export const httpRequest = vi.fn();
global.httpRequest = httpRequest;

// Mock EdgeWorkers create-response API  
export const createResponse = vi.fn((status, headers, body) => ({
  status,
  headers,
  body,
  text: async () => body,
  getHeader: (name) => headers[name],
  getHeaders: () => headers,
}));
global.createResponse = createResponse;

// Mock EdgeWorkers HTMLRewriter API
class MockElement {
  constructor(tagName, attributes = {}) {
    this.tagName = tagName;
    this.attributes = attributes;
    this.content = '';
    this.removed = false;
  }
  
  getAttribute(name) {
    return this.attributes[name] || '';
  }
  
  remove() {
    this.removed = true;
  }
  
  onEndTag(callback) {
    // Simulate end tag callback
    setTimeout(() => callback(), 0);
  }
}

class MockHTMLRewriter {
  constructor() {
    this.handlers = [];
  }
  
  on(selector, handler) {
    this.handlers.push({ selector, handler });
    return this;
  }
  
  transform(html) {
    // Simple mock that just returns the HTML for now
    // In real tests, we'll validate the logic separately
    return html;
  }
}

export const HTMLRewriter = MockHTMLRewriter;
global.HTMLRewriter = HTMLRewriter;

// Mock EdgeWorkers request object
global.mockRequest = (url, options = {}) => ({
  url,
  method: options.method || 'GET',
  headers: options.headers || {},
  getHeader: function(name) {
    return this.headers[name.toLowerCase()];
  },
});
