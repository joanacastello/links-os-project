import { describe, expect, it } from 'vitest';
import { normalizePublicHttpsUrl } from './saCommunity';

describe('normalizePublicHttpsUrl', () => {
  it('returns https URL when valid', () => {
    expect(normalizePublicHttpsUrl('https://example.com/community')).toBe(
      'https://example.com/community',
    );
  });

  it('rejects non-https schemes', () => {
    expect(normalizePublicHttpsUrl('javascript:alert(1)')).toBe('');
    expect(normalizePublicHttpsUrl('http://example.com')).toBe('');
  });

  it('rejects malformed input', () => {
    expect(normalizePublicHttpsUrl('not-a-url')).toBe('');
  });
});
