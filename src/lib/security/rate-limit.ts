interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 5분마다 만료된 엔트리 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { maxRequests: 5, windowMs: 60 * 1000 },
  api: { maxRequests: 100, windowMs: 60 * 1000 },
  upload: { maxRequests: 10, windowMs: 60 * 1000 },
  admin: { maxRequests: 200, windowMs: 60 * 1000 },
  subdomain: { maxRequests: 30, windowMs: 60 * 1000 },
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.api
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}
