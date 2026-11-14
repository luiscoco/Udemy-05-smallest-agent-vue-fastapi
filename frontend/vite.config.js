import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // Image URLs point at public/ assets. Keep them as browser URLs in both the
  // build and Windows jsdom tests instead of transforming them into imports.
  plugins: [vue({ template: { transformAssetUrls: false } })],
  server: {
    proxy: {
      // Preserve the browser Host so the same-origin check also works in dev.
      '/api': { target: 'http://127.0.0.1:8100', changeOrigin: false },
      '/docs': { target: 'http://127.0.0.1:8100', changeOrigin: false },
      '/openapi.json': { target: 'http://127.0.0.1:8100', changeOrigin: false },
    },
  },
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.js'], restoreMocks: true },
});
