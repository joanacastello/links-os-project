type Bucket = {
  hits: number;
  resetAt: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, Bucket>();

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_HITS = 5;

function nowMs(): number {
  return Date.now();
}

export function applyRateLimit(
  key: string,
  options?: { windowMs?: number; maxHits?: number },
): RateLimitDecision {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxHits = options?.maxHits ?? DEFAULT_MAX_HITS;
  const now = nowMs();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { hits: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, maxHits - 1),
      retryAfterSeconds: 0,
    };
  }

  if (current.hits >= maxHits) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.hits += 1;
  buckets.set(key, current);
  return {
    allowed: true,
    remaining: Math.max(0, maxHits - current.hits),
    retryAfterSeconds: 0,
  };
}

export function clearRateLimitState(): void {
  buckets.clear();
}
