interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const limiters = new Map<string, TokenBucket>();

/**
 * Token bucket rate limiter.
 * @param key Unique key for the rate limit (e.g. "IP:login")
 * @param limit Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const bucket = limiters.get(key) || { tokens: limit, lastRefill: now };

  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed * (limit / windowMs));

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  const resetTime = bucket.lastRefill + windowMs;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    limiters.set(key, bucket);
    return { success: true, limit, remaining: Math.floor(bucket.tokens), reset: resetTime };
  } else {
    limiters.set(key, bucket);
    return { success: false, limit, remaining: 0, reset: resetTime };
  }
}
