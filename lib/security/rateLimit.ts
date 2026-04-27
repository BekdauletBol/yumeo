/**
 * Simple in-memory rate limiter for API routes.
 * For production, replace with Upstash Redis.
 *
 * Allows `maxRequests` per `windowMs` per key (e.g., userId).
 */

interface RateLimitRecord {
    count: number;
    resetAt: number;
  }
  
  const store = new Map<string, RateLimitRecord>();
  
  /** Clean up expired entries every 5 minutes */
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
  
  export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  }
  
  /**
   * Check and increment rate limit for a given key.
   *
   * @param key      - Identifier (userId, IP, etc.)
   * @param limit    - Max requests allowed in the window
   * @param windowMs - Window size in milliseconds
   */
  export function checkRateLimit(
    key: string,
    limit = 30,
    windowMs = 60_000,
  ): RateLimitResult {
    const now = Date.now();
    const record = store.get(key);
  
    if (!record || record.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }
  
    if (record.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }
  
    record.count += 1;
    return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
  }
  
  /**
   * Helper: return a 429 Response with Retry-After headers if rate limited.
   */
  export function rateLimitResponse(resetAt: number): Response {
    return new Response(
      JSON.stringify({ error: 'Too many requests', code: 'RATE_LIMITED' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      },
    );
  }