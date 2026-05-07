import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@e965/xlsx'],
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    hmr: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
    fs: {
      strict: false,
    },
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
  },
})
