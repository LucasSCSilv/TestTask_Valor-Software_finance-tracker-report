import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { withZephyr } from 'vite-plugin-zephyr'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'finance_tracker_reports',
      filename: 'remoteEntry.js',
      exposes: {
        './reports': './src/reports.jsx',
      },
      shared: ['react', 'react-dom'],
    }),
    withZephyr(),
  ],
  build: {
    target: 'chrome89',
    minify: false,
  },
  server: {
    port: 5174,
  },
})