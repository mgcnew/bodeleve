import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const design = fileURLToPath(new URL('../design', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // tokens.css vive em ../design e é a fonte única (CLAUDE.md)
      '@design': design,
    },
  },
  server: { fs: { allow: ['.', design] } },
})
