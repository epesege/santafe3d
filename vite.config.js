import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api-catastro': {
        target: 'https://geo.santafeciudad.gov.ar',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-catastro/, '')
      }
    }
  }
});
