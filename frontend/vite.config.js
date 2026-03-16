import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // accessible from local network
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',      // forward REST calls to FastAPI
      '/ws': {
        target: 'ws://localhost:8000',      // forward WS to FastAPI
        ws: true,
      },
    },
  },
})
