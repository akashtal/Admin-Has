import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allow external access
    proxy: {
      '/api': {
        target: 'http://192.168.108.239:5000', // Your backend URL (UPDATED!)
        changeOrigin: true,
        secure: false
      }
    }
  }
});

