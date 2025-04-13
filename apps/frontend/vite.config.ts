import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Allow ngrok host and any other hosts
    allowedHosts: ['bc8a-136-233-11-130.ngrok-free.app', 'localhost', '.ngrok-free.app'],
    // Optionally force disable host check
    // (only use this in development, not in production)
    host: '0.0.0.0',
  }
})
