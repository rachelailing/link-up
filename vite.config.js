import { defineConfig } from 'vite';
import { resolve, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Automatically find all HTML files in the project
const root = resolve(__dirname);
const htmlFiles = glob
  .sync('**/*.html', {
    ignore: ['node_modules/**', 'dist/**'],
  })
  .reduce((acc, file) => {
    // Create a clean key for each file
    const name = relative(root, file).replace(/\.html$/, '');
    acc[name] = resolve(root, file);
    return acc;
  }, {});

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: htmlFiles,
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
