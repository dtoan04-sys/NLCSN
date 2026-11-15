import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('AdminDashboardPage')) {
            return 'admin';
          }
          if (id.includes('AiVisionModal')) {
            return 'ai-vision';
          }
          if (id.includes('speciesData') || id.includes('mockData')) {
            return 'data';
          }
        },
      },
    },
  },
})
