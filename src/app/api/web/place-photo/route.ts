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

// --- 인메모리 캐시: 같은 장소명 반복 조회 방지 (1시간 TTL) ---
interface CacheEntry {
  photoUrl: string | null; // null = 사진 없음도 캐시 (불필요한 재조회 방지)
  expiresAt: number;
}
const photoCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

// 5분마다 만료된 캐시 정리 (메모리 누수 방지)
if (typeof globalThis !== "undefined") {
  const existing = (globalThis as Record<string, unknown>).__placePhotoCacheCleanup;
  if (!existing) {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of photoCache) {
        if (entry.expiresAt < now) photoCache.delete(key);
      }
    }, 5 * 60 * 1000);
    if (interval.unref) interval.unref();
    (globalThis as Record<string, unknown>).__placePhotoCacheCleanup = true;
  }
}

/**
 * Google Places API proxy
 *
 * 왜 서버에서 proxy하는가:
 * 1. API 키를 클라이언트에 노출하지 않기 위해 (보안)
 * 2. Place Photo URL에 API 키가 포함되므로 직접 전달 불가
 * 3. 인메모리 캐시로 동일 장소 반복 호출 방지 (비용 절약)
 *
 * GET /api/web/place-photo?query=강남스포츠문화센터
 * 응답: { photo_url: "https://..." } 또는 { photo_url: null }
 */
export async function GET(request: NextRequest) {
  // API 키가 없으면 빈 응답 (로컬 개발에서도 에러 없이 동작)
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ photo_url: null });
  }

  // Rate limit: 분당 30회 (Google Places API 비용 보호)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = await checkRateLimit(
    `place-photo:${ip}`,
    { maxRequests: 30, windowMs: RATE_LIMITS.api.windowMs }
  );
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests", photo_url: null },
      { status: 429 }
    );
  }

  // query 파라미터 검증
  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query || query.length < 2 || query.length > 100) {
    return NextResponse.json({ photo_url: null });
  }

  // 3단계 캐시: 인메모리 → Redis → Google API
  const cacheKey = query.toLowerCase();
  const redis = getRedis();

  // 1단계: 인메모리 캐시 확인 (가장 빠름)
  const cached = photoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(
      { photo_url: cached.photoUrl },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  }

  // 2단계: Redis 캐시 확인 (서버리스 인스턴스 간 공유)
  if (redis) {
    try {
      const redisCached = await redis.get<string | null>(REDIS_KEY_PREFIX + cacheKey);
      if (redisCached !== undefined && redisCached !== null) {
        const photoUrl = redisCached === "null" ? null : redisCached;
        // 인메모리에도 저장 (다음 요청은 Redis 안 거침)
        photoCache.set(cacheKey, { photoUrl, expiresAt: Date.now() + CACHE_TTL });
        return NextResponse.json(
          { photo_url: photoUrl },
          { headers: { "Cache-Control": "public, max-age=3600" } }
        );
      }
    } catch (err) {
      console.error("[PlacePhoto] Redis get failed:", err);
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
      console.error("[PlacePhoto] Text Search failed:", searchRes.status);
      return NextResponse.json({ photo_url: null });
    }

    const searchData = await searchRes.json();
    const firstResult = searchData.results?.[0];
    const photoRef = firstResult?.photos?.[0]?.photo_reference;

    // 사진 참조가 없으면 null 캐시 후 반환
    if (!photoRef) {
      saveToAllCaches(cacheKey, null, redis);
      return NextResponse.json({ photo_url: null });
    }

    // Place Photo URL → redirect 따라가서 최종 URL 획득
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`;
    const photoRes = await fetch(photoUrl, { redirect: "follow" });
    const finalUrl = photoRes.url;

    saveToAllCaches(cacheKey, finalUrl, redis);

    return NextResponse.json(
      { photo_url: finalUrl },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (error) {
    console.error("[PlacePhoto] Error:", error);
    return NextResponse.json({ photo_url: null });
  }
}

// 인메모리 + Redis 동시에 캐시 저장하는 헬퍼
function saveToAllCaches(cacheKey: string, photoUrl: string | null, redis: Redis | null): void {
  // 인메모리 저장
  photoCache.set(cacheKey, { photoUrl, expiresAt: Date.now() + CACHE_TTL });

  // Redis에도 저장 (fire-and-forget: 응답 지연 방지)
  if (redis) {
    redis.set(REDIS_KEY_PREFIX + cacheKey, photoUrl ?? "null", { ex: REDIS_TTL }).catch((err) => {
      console.error("[PlacePhoto] Redis set failed:", err);
    });
  }
}
