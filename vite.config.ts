import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    hmr: {
        clientPort: 443,
        host: '0.0.0.0',
        protocol: 'wss'
    }
  },
  optimizeDeps: {
    exclude: ['web-ifc', 'three']
  },
  preview: {
    allowedHosts: true,
    host: '0.0.0.0',
    port: 5000
  }
});