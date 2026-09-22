import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleAuthRequest } from '../server/authMiddleware.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'chess-cure-auth-plugin',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            try {
              const handled = await handleAuthRequest(req, res);
              if (handled) return;
            } catch (err) {
              console.error('Error in Vite auth middleware:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Internal Auth Middleware Error' }));
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3000,
    open: false
  }
});
