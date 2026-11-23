import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Em desenvolvimento, as chamadas para /api vão para o back-end local
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
