import type { IncomingMessage } from 'node:http';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { subscribeEmailToBeehiiv } from './server/beehiivSubscribe.ts';
import { anonymize, logSecurityEvent } from './server/security/logging.ts';
import {
  getRequestHost,
  getRequestOrigin,
  isOriginAllowed,
  setApiSecurityHeaders,
  setCorsHeaders,
} from './server/security/http.ts';
import { applyRateLimit } from './server/security/rateLimit.ts';
import { validateSubscribePayload } from './server/security/subscribeValidation.ts';
import { verifyTurnstileToken } from './server/security/turnstile.ts';

const MAX_BODY_BYTES = 8 * 1024;

function readBody(req: IncomingMessage, maxBodyBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (c: Buffer) => {
      total += c.length;
      if (total > maxBodyBytes) {
        reject(new Error('Body too large'));
        return;
      }
      chunks.push(c);
    });
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
        setApiSecurityHeaders((key, value) => res.setHeader(key, value));
        const getHeader = (name: string) => req.headers[name.toLowerCase()];
        const origin = getRequestOrigin(getHeader);
        const host = getRequestHost(getHeader);
        const env = loadEnv(mode, root, ['BEEHIIV_', 'TURNSTILE_', 'ALLOWED_SUBSCRIBE_ORIGINS']);
        const originAllowed = isOriginAllowed({
          origin,
          host,
          allowedOriginsRaw: env.ALLOWED_SUBSCRIBE_ORIGINS,
        });
        if (originAllowed) {
          setCorsHeaders((key, value) => res.setHeader(key, value), origin);
        }
        if (!originAllowed) {
          logSecurityEvent('subscribe_origin_blocked_dev', { origin, host });
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Origen no permitido.' }));
          return;
        }
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const clientIp = req.socket.remoteAddress ?? 'unknown';
        const rate = applyRateLimit(`subscribe-dev:${clientIp}`, {
          windowMs: 60_000,
          maxHits: 6,
        });
        res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
        if (!rate.allowed) {
          res.statusCode = 429;
          res.setHeader('Retry-After', String(rate.retryAfterSeconds));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Demasiadas solicitudes. Inténtalo en unos segundos.' }));
          return;
        }

        const contentLengthHeader = req.headers['content-length'];
        const contentLength =
          typeof contentLengthHeader === 'string' ? Number(contentLengthHeader) : Number.NaN;
        if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
          res.statusCode = 413;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'La solicitud es demasiado grande.' }));
          return;
        }

        let raw: string;
        try {
          raw = await readBody(req as IncomingMessage, MAX_BODY_BYTES);
        } catch {
          res.statusCode = 413;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'La solicitud es demasiado grande.' }));
          return;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(raw || '{}');
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'JSON inválido' }));
          return;
        }

        const validation = validateSubscribePayload(parsed);
        if (!validation.ok) {
          logSecurityEvent('subscribe_validation_failed_dev', {
            reason: validation.internalReason,
            ipHash: anonymize(clientIp),
          });
          res.statusCode = validation.statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: validation.publicError }));
          return;
        }

        const turnstile = await verifyTurnstileToken({
          token: validation.payload.captchaToken,
          remoteIp: clientIp,
          env,
        });
        if (!turnstile.ok) {
          logSecurityEvent('subscribe_turnstile_failed_dev', {
            reason: turnstile.internalReason,
            ipHash: anonymize(clientIp),
          });
          res.statusCode = turnstile.statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: turnstile.publicError }));
          return;
        }

        const result = await subscribeEmailToBeehiiv(validation.payload.email, env);
        if (!result.ok) {
          logSecurityEvent('subscribe_provider_error_dev', {
            reason: result.internalReason,
            ipHash: anonymize(clientIp),
            emailHash: anonymize(validation.payload.email),
            statusCode: result.statusCode,
          });
          res.statusCode = result.statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: result.publicError }));
          return;
        }

        logSecurityEvent('subscribe_success_dev', {
          ipHash: anonymize(clientIp),
          emailHash: anonymize(validation.payload.email),
        });
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
