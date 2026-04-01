import type { IncomingMessage } from 'node:http';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { subscribeEmailToBeehiiv } from './server/beehiivSubscribe.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function subscribeApiPlugin(): Plugin {
  return {
    name: 'subscribe-api-dev',
    configureServer(server) {
      const root = server.config.root;
      const mode = server.config.mode;

      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? '';
        if (pathname !== '/api/subscribe') {
          next();
          return;
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        // Prefijo explícito: `loadEnv(..., '')` no es el patrón recomendado y puede fallar según versión.
        const env = loadEnv(mode, root, ['BEEHIIV_']);
        let raw: string;
        try {
          raw = await readBody(req as IncomingMessage);
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Cuerpo inválido' }));
          return;
        }

        let parsed: { email?: string };
        try {
          parsed = JSON.parse(raw || '{}') as { email?: string };
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'JSON inválido' }));
          return;
        }

        const email = typeof parsed.email === 'string' ? parsed.email.trim() : '';
        if (!email || !EMAIL_RE.test(email)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Correo no válido.' }));
          return;
        }

        const result = await subscribeEmailToBeehiiv(email, env);
        if (!result.ok) {
          res.statusCode = result.statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: result.error }));
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), subscribeApiPlugin()],
}));
