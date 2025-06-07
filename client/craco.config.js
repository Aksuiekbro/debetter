// client/craco.config.js
const path = require('path');

module.exports = {
  // Use custom PostCSS config file for Tailwind CSS v4 compatibility
  style: {
    postcss: {
      // Load the custom PostCSS config file
      mode: 'file'
    }
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src/')
    }
  },
  jest: {
    configure: (jestConfig) => {
      jestConfig.transformIgnorePatterns = [
        '/node_modules/(?!axios)/',
      ];
      jestConfig.moduleNameMapper = {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^puppeteer-core/internal/puppeteer-core.js$': '<rootDir>/node_modules/puppeteer-core/internal/puppeteer-core.js',
      };
      return jestConfig;
    },
  },
};