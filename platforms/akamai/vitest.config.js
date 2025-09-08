import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.js'],
  },
  resolve: {
    alias: {
      'http-request': new URL('./test/mocks/http-request.js', import.meta.url).pathname,
      'create-response': new URL('./test/mocks/create-response.js', import.meta.url).pathname,
    },
  },
});
