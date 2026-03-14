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
})
