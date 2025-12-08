import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    hmr: {
      protocol: 'wss',
      host: undefined,
      clientPort: 443,
    },
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
