import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// --- 인터페이스 (기존 호출측과 호환) ---

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // login은 DB 기반(login-attempts.ts)으로 처리 — 여기선 완전 차단용
  login: { maxRequests: 20, windowMs: 60 * 1000 },
  api: { maxRequests: 100, windowMs: 60 * 1000 },
  upload: { maxRequests: 10, windowMs: 60 * 1000 },
  admin: { maxRequests: 200, windowMs: 60 * 1000 },
  subdomain: { maxRequests: 30, windowMs: 60 * 1000 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

// --- Upstash Redis 기반 구현 ---

const hasUpstashConfig =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!hasUpstashConfig) return null;
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// Upstash Ratelimit 인스턴스 캐시 (config별)
const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(config: RateLimitConfig): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  const key = `${config.maxRequests}:${config.windowMs}`;
  let limiter = limiterCache.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(
        config.maxRequests,
        `${config.windowMs}ms`
      ),
      prefix: "mybdr:rl",
    });
    limiterCache.set(key, limiter);
  }
  return limiter;
}

// --- 인메모리 fallback (개발환경 / Upstash 미설정 시) ---

interface InMemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, InMemoryEntry>();

// 5분마다 만료된 엔트리 정리 (메모리 누수 방지)
if (typeof globalThis !== "undefined") {
  const existing = (globalThis as Record<string, unknown>).__rateLimitCleanup;
  if (!existing) {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of memoryStore) {
        if (entry.resetAt < now) memoryStore.delete(key);
      }
    }, 5 * 60 * 1000);
    // 서버리스 환경에서 프로세스 종료를 막지 않도록
    if (interval.unref) interval.unref();
    (globalThis as Record<string, unknown>).__rateLimitCleanup = true;
  }
}

function checkInMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      limit: config.maxRequests,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.maxRequests,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    limit: config.maxRequests,
  };
}

// --- 메인 함수 (기존 API 유지) ---

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.api
): Promise<RateLimitResult> {
  const upstash = getUpstashLimiter(config);

  if (upstash) {
    try {
      const result = await upstash.limit(identifier);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
        limit: result.limit,
      };
    } catch (err) {
      // Upstash 장애 시 인메모리 fallback (서비스 중단 방지)
      console.error("[RateLimit] Upstash error, falling back to in-memory:", err);
      return checkInMemory(identifier, config);
    }
  }

  // Upstash 미설정: 인메모리 사용 (개발환경)
  return checkInMemory(identifier, config);
}
