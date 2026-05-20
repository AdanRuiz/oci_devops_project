import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/users': { target: 'http://localhost:8080', changeOrigin: true },
      '/teams': { target: 'http://localhost:8080', changeOrigin: true },
      '/team-members': { target: 'http://localhost:8080', changeOrigin: true },
      '/sprints': { target: 'http://localhost:8080', changeOrigin: true },
      '/tasks': { target: 'http://localhost:8080', changeOrigin: true },
      '/todolist': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build'
  }
})