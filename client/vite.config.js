import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Keep index.html in project root as the entry and ignore public/ and build/ folders
  root: '.',
  publicDir: 'public',
  // Include .js files for JSX in the React plugin
  plugins: [
    react({
      include: ['src/**/*.{js,jsx,ts,tsx}']
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5001'
    }
  },
  // Only use the root index.html as entry, ignore other HTML files (e.g., legacy public/ and build/ folders)
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html')
    }
  },
  // No need for esbuild loader override; the React plugin handles JSX in .js files
});
