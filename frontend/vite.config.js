import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      // Admin-uploaded branding images are served publicly by the backend.
      '/branding-files': 'http://localhost:8080',
    },
  },
})
