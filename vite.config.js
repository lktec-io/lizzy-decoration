import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Sidebar/Navbar/ToastProvider mount framer-motion eagerly at the
        // app shell, so it can no longer stay confined to a lazy route
        // chunk (see Modal's chunk shrinking once Toast pulled it into the
        // eager graph). Splitting it into its own vendor chunk at least
        // keeps it cacheable independently of app code, instead of being
        // baked into the main entry chunk that changes on every deploy.
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion-dom') || id.includes('node_modules/motion-utils')) {
            return 'framer-motion';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: {
      // Keeps the frontend and API same-origin in dev so the httpOnly
      // refresh-token cookie works without SameSite=None+Secure.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
