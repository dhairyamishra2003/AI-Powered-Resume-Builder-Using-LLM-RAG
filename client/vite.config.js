import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // Google authorizes an exact scheme + host + port. Never silently move to
    // 5174/another port, because that makes a registered localhost origin fail.
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        timeout: 120000,
        proxyTimeout: 120000,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.warn(`[vite proxy error] ${req.method} ${req.url}:`, err.message);
            if (res.writeHead && !res.headersSent) {
              const isTimeout = err.code === 'ETIMEDOUT' || err.message?.includes('timeout');
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                message: isTimeout
                  ? 'Request timed out while waiting for server processing. Please try again.'
                  : 'Backend server is temporarily unreachable. Please ensure the backend is running.',
                code: isTimeout ? 'TIMEOUT' : 'BACKEND_UNAVAILABLE',
              }));
            }
          });
        },
      },
    },
  },
});
