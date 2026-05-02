import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@':        path.resolve(__dirname, 'src'),
      '@assets':  path.resolve(__dirname, 'src/assets'),
      '@sprites': path.resolve(__dirname, 'src/assets/sprites'),
      '@ui':      path.resolve(__dirname, 'src/assets/ui'),
      '@game':    path.resolve(__dirname, 'src/game'),
      '@audio':   path.resolve(__dirname, 'src/audio'),
    },
  },
})
