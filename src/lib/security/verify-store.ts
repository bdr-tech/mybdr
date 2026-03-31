/**
 * SMS 인증코드 저장소 (Redis + 인메모리 Map 폴백)
 *
 * 왜 별도 모듈인가?
 * - send-code 라우트 파일 안에 있던 Map 저장소를 분리
 * - Upstash Redis가 설정되어 있으면 Redis 사용 (서버리스 환경에서 인스턴스 간 공유)
 * - Redis 없으면 인메모리 Map으로 graceful fallback (개발환경)
 *
 * 저장 구조: key = "{userId}:{phone}" → { code, expires }
 */

import { Redis } from "@upstash/redis";

// --- Redis 연결 (rate-limit.ts와 동일 패턴) ---

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

// --- 인메모리 폴백 저장소 ---

interface CodeEntry {
  code: string;
  expires: number; // timestamp (ms)
}

const memoryStore = new Map<string, CodeEntry>();

// 5분마다 만료된 엔트리 정리 (메모리 누수 방지)
if (typeof globalThis !== "undefined") {
  const existing = (globalThis as Record<string, unknown>).__verifyStoreCleanup;
  if (!existing) {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of memoryStore) {
        if (entry.expires < now) memoryStore.delete(key);
      }
    }, 5 * 60 * 1000);
    if (interval.unref) interval.unref();
    (globalThis as Record<string, unknown>).__verifyStoreCleanup = true;
  }
}

// Redis 키 접두사 (다른 키와 충돌 방지)
const REDIS_PREFIX = "mybdr:verify:";
// 인증코드 유효 시간 (5분)
const CODE_TTL_MS = 5 * 60 * 1000;
const CODE_TTL_SEC = 300; // Redis TTL용 (초 단위)

/**
 * 인증코드를 저장한다
 * @param userId 사용자 ID
 * @param phone 전화번호 (숫자만)
 * @param code 6자리 인증코드
 */
export async function storeCode(
  userId: bigint | string,
  phone: string,
  code: string
): Promise<void> {
  const key = `${userId}:${phone}`;
  const r = getRedis();

  if (r) {
    try {
      // Redis에 JSON으로 저장 + TTL 자동 만료
      await r.set(`${REDIS_PREFIX}${key}`, JSON.stringify({ code }), {
        ex: CODE_TTL_SEC,
      });
      return;
    } catch (err) {
      // Redis 장애 시 인메모리 폴백
      console.error("[VerifyStore] Redis set error, falling back:", err);
    }
  }

  // 인메모리 저장
  memoryStore.set(key, { code, expires: Date.now() + CODE_TTL_MS });
}

/**
 * 인증코드를 검증한다 (일회성: 성공 시 삭제)
 * @returns true = 인증 성공, false = 실패/만료
 */
export async function verifyCode(
  userId: bigint | string,
  phone: string,
  code: string
): Promise<boolean> {
  const key = `${userId}:${phone}`;
  const r = getRedis();

  if (r) {
    try {
      const raw = await r.get<string>(`${REDIS_PREFIX}${key}`);
      if (!raw) return false;

      // Redis에서 가져온 값 파싱
      const stored = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (stored.code !== code) return false;

      // 일회성: 인증 성공 후 삭제
      await r.del(`${REDIS_PREFIX}${key}`);
      return true;
    } catch (err) {
      console.error("[VerifyStore] Redis get error, falling back:", err);
      // Redis 장애 시 인메모리 폴백으로 시도
    }
  }

  // 인메모리 검증
  const entry = memoryStore.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expires) {
    memoryStore.delete(key);
    return false;
  }
  if (entry.code !== code) return false;

  // 일회성: 인증 성공 후 삭제
  memoryStore.delete(key);
  return true;
}
