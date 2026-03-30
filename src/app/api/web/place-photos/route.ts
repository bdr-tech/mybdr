import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

// --- Redis 캐시 설정 (YouTube route와 동일 패턴) ---
// Upstash Redis: 서버리스 인스턴스 간 캐시 공유용
// 환경변수 미설정 시 null -> 기존 인메모리 캐시로 fallback
const hasRedisConfig =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (!hasRedisConfig) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisClient;
}

// Redis 캐시 키 접두사 + TTL (24시간: 장소 사진은 자주 변하지 않으므로 길게)
const REDIS_KEY_PREFIX = "mybdr:place-photo:";
const REDIS_TTL = 86400; // 24시간 (초)

/**
 * Place Photos Batch API — 여러 장소 사진을 한번에 조회
 *
 * 왜 batch API가 필요한가:
 * 기존 place-photo API는 카드 1개당 1번 호출 = 60개 카드면 60번 호출
 * 브라우저 동시 연결 제한(6개)에 걸려 폭포수(waterfall) 현상 발생
 * batch API로 1번 호출에 모든 장소 사진을 한번에 가져오면 극적으로 빨라짐
 *
 * POST /api/web/place-photos
 * Body: { queries: ["강남스포츠", "잠실체육관", ...] }
 * 응답: { results: { "강남스포츠": "photo_url", "잠실체육관": null } }
 */

// --- 인메모리 캐시: 기존 place-photo와 동일한 구조 (1시간 TTL) ---
interface CacheEntry {
  photoUrl: string | null;
  expiresAt: number;
}
const photoCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

// 5분마다 만료된 캐시 정리 (메모리 누수 방지)
if (typeof globalThis !== "undefined") {
  const existing = (globalThis as Record<string, unknown>).__placePhotosBatchCacheCleanup;
  if (!existing) {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of photoCache) {
        if (entry.expiresAt < now) photoCache.delete(key);
      }
    }, 5 * 60 * 1000);
    if (interval.unref) interval.unref();
    (globalThis as Record<string, unknown>).__placePhotosBatchCacheCleanup = true;
  }
}

// 단일 장소 사진 조회 (3단계 캐시: 인메모리 → Redis → Google API)
async function fetchPlacePhoto(query: string, apiKey: string): Promise<string | null> {
  const cacheKey = query.toLowerCase();

  // 1단계: 인메모리 캐시 확인 (가장 빠름, 같은 서버리스 인스턴스 내)
  const cached = photoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.photoUrl;
  }

  // 2단계: Redis 캐시 확인 (서버리스 인스턴스 간 공유, cold start 시에도 히트)
  const redis = getRedis();
  if (redis) {
    try {
      const redisCached = await redis.get<string | null>(REDIS_KEY_PREFIX + cacheKey);
      // Redis에 키가 존재하면 (값이 null이든 string이든) 캐시 히트
      if (redisCached !== undefined && redisCached !== null) {
        // "null" 문자열은 사진 없음을 의미 (Redis에 null 직접 저장 불가)
        const photoUrl = redisCached === "null" ? null : redisCached;
        // 인메모리에도 저장 (다음 요청은 Redis 안 거치고 바로 반환)
        photoCache.set(cacheKey, { photoUrl, expiresAt: Date.now() + CACHE_TTL });
        return photoUrl;
      }
    } catch (err) {
      // Redis 장애 시 무시하고 Google API로 진행 (graceful degradation)
      console.error("[place-photos] Redis get failed:", err);
    }
  }

  // 3단계: Google API 직접 호출 (캐시 모두 미적중 시)
  try {
    const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("language", "ko");

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      saveToAllCaches(cacheKey, null, redis);
      return null;
    }

    const searchData = await searchRes.json();
    const photoRef = searchData.results?.[0]?.photos?.[0]?.photo_reference;

    if (!photoRef) {
      // 사진 없음도 캐시 (불필요한 재조회 방지)
      saveToAllCaches(cacheKey, null, redis);
      return null;
    }

    // Place Photo URL → redirect 따라가서 최종 URL 획득
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`;
    const photoRes = await fetch(photoUrl, { redirect: "follow" });
    const finalUrl = photoRes.url;

    saveToAllCaches(cacheKey, finalUrl, redis);
    return finalUrl;
  } catch {
    saveToAllCaches(cacheKey, null, redis);
    return null;
  }
}

// 인메모리 + Redis 동시에 캐시 저장하는 헬퍼
function saveToAllCaches(cacheKey: string, photoUrl: string | null, redis: Redis | null): void {
  // 인메모리 저장
  photoCache.set(cacheKey, { photoUrl, expiresAt: Date.now() + CACHE_TTL });

  // Redis에도 저장 (fire-and-forget: 응답 지연 방지)
  if (redis) {
    // null은 "null" 문자열로 저장 (사진 없음도 캐시하여 Google API 재호출 방지)
    redis.set(REDIS_KEY_PREFIX + cacheKey, photoUrl ?? "null", { ex: REDIS_TTL }).catch((err) => {
      console.error("[place-photos] Redis set failed:", err);
    });
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ results: {} });
  }

  // Rate limit: 분당 10회 (batch이므로 더 엄격하게)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = await checkRateLimit(
    `place-photos-batch:${ip}`,
    { maxRequests: 10, windowMs: RATE_LIMITS.api.windowMs }
  );
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests", results: {} },
      { status: 429 }
    );
  }

  // 요청 바디 파싱
  let queries: string[];
  try {
    const body = await request.json();
    queries = body.queries;
    if (!Array.isArray(queries)) {
      return NextResponse.json({ results: {} });
    }
  } catch {
    return NextResponse.json({ results: {} });
  }

  // 유효한 장소명만 필터 + 중복 제거 (같은 장소를 여러 카드가 참조할 수 있음)
  const uniqueQueries = [...new Set(
    queries
      .filter((q): q is string => typeof q === "string" && q.trim().length >= 2 && q.trim().length <= 100)
      .map((q) => q.trim())
  )];

  // 최대 60개까지만 처리 (과도한 요청 방지)
  const limitedQueries = uniqueQueries.slice(0, 60);

  // 모든 장소를 병렬로 조회 (캐시 히트는 즉시, 미스만 Google API)
  const entries = await Promise.all(
    limitedQueries.map(async (query) => {
      const photoUrl = await fetchPlacePhoto(query, apiKey);
      return [query, photoUrl] as const;
    })
  );

  // 결과를 장소명 -> URL 맵으로 구성
  const results: Record<string, string | null> = {};
  for (const [query, photoUrl] of entries) {
    results[query] = photoUrl;
  }

  return NextResponse.json(
    { results },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
