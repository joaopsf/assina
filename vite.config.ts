/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // No GitHub Pages o app mora em /assina/. Localmente fica na raiz.
  base: process.env.GITHUB_PAGES ? '/assina/' : '/',
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
