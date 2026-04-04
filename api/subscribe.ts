import { subscribeEmailToBeehiiv } from '../server/beehiivSubscribe.js';
import { anonymize, logSecurityEvent } from '../server/security/logging.js';
import {
  getRequestHost,
  getRequestOrigin,
  isOriginAllowed,
  parseClientIp,
  setApiSecurityHeaders,
  setCorsHeaders,
} from '../server/security/http.js';
import { applyRateLimit } from '../server/security/rateLimit.js';
import { validateSubscribePayload } from '../server/security/subscribeValidation.js';

type VercelReq = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

type VercelRes = {
  status: (code: number) => VercelRes;
  setHeader: (k: string, v: string) => void;
  json: (body: unknown) => void;
  end: (body?: string) => void;
};

export default async function handler(req: VercelReq, res: VercelRes): Promise<void> {
  setApiSecurityHeaders(res.setHeader);
  const getHeader = (name: string) =>
    req.headers?.[name] ?? req.headers?.[name.toLowerCase()] ?? req.headers?.[name.toUpperCase()];
  const origin = getRequestOrigin(getHeader);
  const host = getRequestHost(getHeader);
  const allowedOrigin = isOriginAllowed({ origin, host }) ? origin : undefined;
  setCorsHeaders(res.setHeader, allowedOrigin);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!isOriginAllowed({ origin, host })) {
    logSecurityEvent('subscribe_origin_blocked', {
      origin,
      host,
    });
    res.status(403).json({ error: 'Origen no permitido.' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientIp = parseClientIp(getHeader) ?? 'unknown';
  const limit = applyRateLimit(`subscribe:${clientIp}`, {
    windowMs: 60_000,
    maxHits: 6,
  });
  res.setHeader('X-RateLimit-Remaining', String(limit.remaining));
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    logSecurityEvent('subscribe_rate_limited', {
      ipHash: anonymize(clientIp),
    });
    res.status(429).json({ error: 'Demasiadas solicitudes. Inténtalo en unos segundos.' });
    return;
  }

  const validation = validateSubscribePayload(req.body);
  if (!validation.ok) {
    logSecurityEvent('subscribe_validation_failed', {
      reason: validation.internalReason,
      ipHash: anonymize(clientIp),
    });
    res.status(validation.statusCode).json({ error: validation.publicError });
    return;
  }

  const result = await subscribeEmailToBeehiiv(validation.payload.email);
  if (!result.ok) {
    logSecurityEvent('subscribe_provider_error', {
      reason: result.internalReason,
      ipHash: anonymize(clientIp),
      emailHash: anonymize(validation.payload.email),
      statusCode: result.statusCode,
    });
    res.status(result.statusCode).json({ error: result.publicError });
    return;
  }

  logSecurityEvent('subscribe_success', {
    ipHash: anonymize(clientIp),
    emailHash: anonymize(validation.payload.email),
  });
  res.status(200).json({ ok: true });
}
