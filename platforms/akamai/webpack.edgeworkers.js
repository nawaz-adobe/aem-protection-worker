const path = require('path');

/**
 * Webpack configuration optimized for Akamai EdgeWorkers
 * - ES6 modules output (not CommonJS)
 * - No Node.js dependencies
 * - Minimal bundle size
 * - Production-ready optimizations
 */
module.exports = {
  entry: './src/main-production.js',
  
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    // Use ES6 modules for EdgeWorkers
    library: {
      type: 'module',
    },
    environment: {
      module: true,
    },
    // Keep function names for debugging
    clean: true,
  },
  
  experiments: {
    outputModule: true,
  },
  
  mode: 'production',
  
  // Target web environment (not Node.js)
  target: 'web',
  
  resolve: {
    extensions: ['.js'],
  },
  
  // No module rules - keep it simple
  
  externals: {
    // EdgeWorkers runtime modules - don't bundle these
    'http-request': 'http-request',
    'create-response': 'create-response',
    'url-search-params': 'url-search-params',
  },
  
  optimization: {
    minimize: false, // Don't minimize for better debugging and function name preservation
    // Single chunk for EdgeWorkers
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        // Everything in one bundle
        bundle: {
          name: 'main',
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
  
  // Performance optimizations
  performance: {
    maxAssetSize: 20 * 1024 * 1024, // 20MB Akamai limit
    maxEntrypointSize: 20 * 1024 * 1024,
  },
};
