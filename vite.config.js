import { defineConfig } from 'vite';
import { handleMultiplayerUpgrade } from './server/multiplayerServer.js';

export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  plugins: [
    {
      name: 'multiplayer-ws-plugin',
      configureServer(server) {
        server.httpServer?.on('upgrade', (req, socket, head) => {
          if (req.url && req.url.includes('/multiplayer')) {
            handleMultiplayerUpgrade(req, socket, head);
          }
        });
      }
    }
  ],
  build: {
    target: 'esnext'
  }
});
