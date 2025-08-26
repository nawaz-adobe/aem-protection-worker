const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    ignores: ['platforms/**/dist/**', 'platforms/**/node_modules/**'],
  },
  {
    files: ['platforms/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Common globals
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        // Cloudflare Workers globals
        HTMLRewriter: 'readonly',
        // EdgeWorkers globals (will be available at runtime)
        httpRequest: 'readonly',
        createResponse: 'readonly',
      },
    },
    rules: {
      // Code quality rules
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Style rules
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      
      // Best practices
      'eqeqeq': 'error',
      'curly': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      
      // ES6+ features
      'arrow-spacing': 'error',
      'no-duplicate-imports': 'error',
      'prefer-arrow-callback': 'error',
      
      // Allow undefined globals for platform-specific code
      'no-undef': 'error',
    },
  },
  {
    files: ['platforms/**/test/**/*.js', 'test/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['platforms/**/webpack*.js', 'platforms/**/validate*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]; 