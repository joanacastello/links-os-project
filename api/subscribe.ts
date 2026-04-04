import { subscribeEmailToBeehiiv } from '../server/beehiivSubscribe';
import { anonymize, logSecurityEvent } from '../server/security/logging';
import {
  getRequestHost,
  getRequestOrigin,
  isOriginAllowed,
  parseClientIp,
  setApiSecurityHeaders,
  setCorsHeaders,
} from '../server/security/http';
import { applyRateLimit } from '../server/security/rateLimit';
import { validateSubscribePayload } from '../server/security/subscribeValidation';
import { verifyTurnstileToken } from '../server/security/turnstile';

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
  const allowedOriginsRaw = process.env.ALLOWED_SUBSCRIBE_ORIGINS;
  const originAllowed = isOriginAllowed({ origin, host, allowedOriginsRaw });

  if (req.method === 'OPTIONS') {
    if (!originAllowed) {
      logSecurityEvent('subscribe_origin_blocked', { origin, host });
      res.status(403).json({ error: 'Origen no permitido.' });
      return;
    }
    setCorsHeaders(res.setHeader, origin);
    res.status(204).end();
    return;
  }

  if (!originAllowed) {
    logSecurityEvent('subscribe_origin_blocked', { origin, host });
    res.status(403).json({ error: 'Origen no permitido.' });
    return;
  }

  setCorsHeaders(res.setHeader, origin);

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

  const turnstile = await verifyTurnstileToken({
    token: validation.payload.captchaToken,
    remoteIp: clientIp,
  });
  if (!turnstile.ok) {
    logSecurityEvent('subscribe_turnstile_failed', {
      reason: turnstile.internalReason,
      ipHash: anonymize(clientIp),
    });
    res.status(turnstile.statusCode).json({ error: turnstile.publicError });
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
