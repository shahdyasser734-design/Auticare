import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'https://auticare-production-828c.up.railway.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
      '/uploads': {
        target: 'https://auticare-production-828c.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
