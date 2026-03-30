import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

// --- 인메모리 캐시: 동일 검색어 반복 호출 방지 (30분 TTL) ---
interface CacheEntry {
  results: PlaceResult[];
  expiresAt: number;
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30분

// 5분마다 만료된 캐시 정리 (메모리 누수 방지)
if (typeof globalThis !== "undefined") {
  const existing = (globalThis as Record<string, unknown>).__placeSearchCacheCleanup;
  if (!existing) {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of searchCache) {
        if (entry.expiresAt < now) searchCache.delete(key);
      }
    }, 5 * 60 * 1000);
    if (interval.unref) interval.unref();
    (globalThis as Record<string, unknown>).__placeSearchCacheCleanup = true;
  }
}

// 클라이언트에 반환할 장소 정보 타입
interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
}

/**
 * Google Places Autocomplete proxy API
 *
 * 왜 서버 proxy인가:
 * 1. GOOGLE_PLACES_API_KEY를 클라이언트에 노출하지 않기 위해 (보안)
 * 2. 인메모리 캐시로 동일 검색어 반복 호출 방지 (비용 절약)
 * 3. rate limit으로 남용 방지
 *
 * GET /api/web/place-search?query=강남스포츠
 * 응답: { results: [{ place_id, name, address }] }
 */
export async function GET(request: NextRequest) {
  // API 키가 없으면 빈 배열 반환 (로컬 개발에서도 에러 없이 동작)
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ results: [] });
  }

  // Rate limit: 분당 30회 (Google Places API 비용 보호)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = await checkRateLimit(
    `place-search:${ip}`,
    { maxRequests: 30, windowMs: RATE_LIMITS.api.windowMs }
  );
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests", results: [] },
      { status: 429 }
    );
  }

  // query 파라미터 검증 (최소 2자 ~ 최대 100자)
  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query || query.length < 2 || query.length > 100) {
    return NextResponse.json({ results: [] });
  }

  // 캐시 확인 (히트하면 Google API 호출 생략)
  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(
      { results: cached.results },
      { headers: { "Cache-Control": "public, max-age=1800" } }
    );
  }

  try {
    // Google Places Autocomplete API 호출
    // 한국어 결과 우선, 한국 내 장소 우선 (components=country:kr)
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", query);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", "ko");
    url.searchParams.set("components", "country:kr");
    // 체육관/스포츠 시설 위주로 검색 (establishment 타입)
    url.searchParams.set("types", "establishment");

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("[PlaceSearch] Autocomplete failed:", res.status);
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    // 최대 5개만 반환 (UI 드롭다운에 5개면 충분)
    const predictions = (data.predictions ?? []).slice(0, 5);

    const results: PlaceResult[] = predictions.map((p: {
      place_id: string;
      structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
      };
      description?: string;
    }) => ({
      place_id: p.place_id,
      // 장소명: structured_formatting.main_text (예: "강남스포츠문화센터")
      name: p.structured_formatting?.main_text ?? p.description ?? "",
      // 주소: structured_formatting.secondary_text (예: "서울특별시 강남구")
      address: p.structured_formatting?.secondary_text ?? "",
    }));

    // 캐시에 저장
    searchCache.set(cacheKey, { results, expiresAt: Date.now() + CACHE_TTL });

    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, max-age=1800" } }
    );
  } catch (error) {
    console.error("[PlaceSearch] Error:", error);
    return NextResponse.json({ results: [] });
  }
}
