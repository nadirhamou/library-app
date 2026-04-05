import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/books': {
        target: 'http://localhost:3001',
        rewrite: path => path.replace(/^\/api\/books/, '/books'),
        changeOrigin: true,
      },
      '/api/users': {
        target: 'http://localhost:3002',
        rewrite: path => path.replace(/^\/api\/users/, '/users'),
        changeOrigin: true,
      },
      '/api/loans': {
        target: 'http://localhost:3002',
        rewrite: path => path.replace(/^\/api\/loans/, '/loans'),
        changeOrigin: true,
      },
    },
  },
})
