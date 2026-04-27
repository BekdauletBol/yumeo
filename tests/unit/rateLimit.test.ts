import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit } from '@/lib/security/rateLimit';

describe('checkRateLimit', () => {
  it('allows requests within the limit', () => {
    const key = `test-${Date.now()}-allow`;
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests that exceed the limit', () => {
    const key = `test-${Date.now()}-block`;
    // Exhaust the limit
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000);
    // 4th call should be blocked
    const result = checkRateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('counts remaining correctly', () => {
    const key = `test-${Date.now()}-remaining`;
    checkRateLimit(key, 10, 60_000); // 1st call → remaining 9
    const r = checkRateLimit(key, 10, 60_000); // 2nd call → remaining 8
    expect(r.remaining).toBe(8);
  });

  it('uses different buckets for different keys', () => {
    const key1 = `test-${Date.now()}-k1`;
    const key2 = `test-${Date.now()}-k2`;
    for (let i = 0; i < 3; i++) checkRateLimit(key1, 3, 60_000);
    // key1 exhausted, key2 should still be allowed
    const r = checkRateLimit(key2, 3, 60_000);
    expect(r.allowed).toBe(true);
  });

  it('returns a resetAt timestamp in the future', () => {
    const key = `test-${Date.now()}-reset`;
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});