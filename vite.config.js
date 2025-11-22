import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,     // 👈 allows connections from lvh.me, 127.0.0.1, etc.
    port: 5173,
    allowedHosts: ['lvh.me', '.lvh.me'],
  },
})
