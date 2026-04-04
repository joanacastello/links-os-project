type HeaderGetter = (name: string) => string | string[] | undefined;
type HeaderSetter = (name: string, value: string) => void;

const DEFAULT_ALLOWED_HEADERS = 'Content-Type';
const DEFAULT_ALLOWED_METHODS = 'POST, OPTIONS';

export function setApiSecurityHeaders(setHeader: HeaderSetter): void {
  setHeader('X-Content-Type-Options', 'nosniff');
  setHeader('X-Frame-Options', 'DENY');
  setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

export function parseClientIp(getHeader: HeaderGetter): string | undefined {
  const xfwd = getHeader('x-forwarded-for');
  const first =
    typeof xfwd === 'string'
      ? xfwd.split(',')[0]
      : Array.isArray(xfwd)
        ? xfwd[0]
        : undefined;
  const ip = first?.trim();
  return ip || undefined;
}

export function getRequestOrigin(getHeader: HeaderGetter): string | undefined {
  const origin = getHeader('origin');
  if (typeof origin === 'string') return origin;
  if (Array.isArray(origin)) return origin[0];
  return undefined;
}

export function getRequestHost(getHeader: HeaderGetter): string | undefined {
  const host = getHeader('host');
  if (typeof host === 'string') return host;
  if (Array.isArray(host)) return host[0];
  return undefined;
}

export function isOriginAllowed(params: {
  origin: string | undefined;
  host: string | undefined;
  allowedOriginsRaw?: string | undefined;
}): boolean {
  const { origin, host, allowedOriginsRaw } = params;
  if (!origin) return true;

  if (host) {
    const localAllowed = new Set([`https://${host}`, `http://${host}`]);
    if (localAllowed.has(origin)) return true;
  }

  const allowedOrigins = (allowedOriginsRaw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return allowedOrigins.includes(origin);
}

export function setCorsHeaders(
  setHeader: HeaderSetter,
  allowedOrigin: string | undefined,
): void {
  if (!allowedOrigin) return;
  setHeader('Access-Control-Allow-Origin', allowedOrigin);
  setHeader('Vary', 'Origin');
  setHeader('Access-Control-Allow-Headers', DEFAULT_ALLOWED_HEADERS);
  setHeader('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS);
}
