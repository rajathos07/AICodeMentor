// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // (Optional) If you prefer proxy over base URL, uncomment below and
    // set axios.defaults.baseURL = "" in App.jsx instead.
    // proxy: {
    //   '/api': { target: 'http://localhost:3000', changeOrigin: true },
    //   '/ai':  { target: 'http://localhost:3000', changeOrigin: true },
    // },
  },
  build: {
    // Suppress chunk size warnings — bundles are intentionally split below
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — loads first, cached forever
          "vendor-react":    ["react", "react-dom"],
          // Animations — used on every page
          "vendor-framer":   ["framer-motion"],
          // HTTP client
          "vendor-axios":    ["axios"],
          // Code editor + syntax highlighting
          "vendor-editor":   ["react-simple-code-editor", "prismjs"],
          // Markdown renderer
          "vendor-markdown": ["react-markdown"],
          // Charts — only loaded on Dashboard page
          "vendor-charts":   ["recharts"],
          // Mermaid — ~500kB, lazy-imported so this chunk loads only when DiagramGenerator mounts
          "vendor-mermaid":  ["mermaid"],
        },
      },
    },
  },
})
