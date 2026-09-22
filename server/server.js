import http from 'http';
import { handleAuthRequest } from './authMiddleware.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(async (req, res) => {
  const handled = await handleAuthRequest(req, res);
  if (!handled) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Chess Cure PMS Auth Server listening on port ${PORT}`);
});
