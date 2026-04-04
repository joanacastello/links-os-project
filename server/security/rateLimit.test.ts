import { beforeEach, describe, expect, it } from 'vitest';
import { applyRateLimit, clearRateLimitState } from './rateLimit';

describe('applyRateLimit', () => {
  beforeEach(() => {
    clearRateLimitState();
  });

  it('allows requests under the threshold', () => {
    const first = applyRateLimit('ip:1', { maxHits: 2, windowMs: 10_000 });
    const second = applyRateLimit('ip:1', { maxHits: 2, windowMs: 10_000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
  });

  it('blocks requests over the threshold', () => {
    applyRateLimit('ip:2', { maxHits: 1, windowMs: 10_000 });
    const blocked = applyRateLimit('ip:2', { maxHits: 1, windowMs: 10_000 });

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
