import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

/**
 * GET /api/web/search?q=키워드
 *
 * 통합 검색 API — 4개 테이블에서 동시 검색
 * - games: title 검색
 * - Tournament: name 검색
 * - Team: name 검색
 * - community_posts: title 검색
 * 각 최대 5건, BigInt/Date 직렬화 처리
 */
export async function GET(request: NextRequest) {
  // IP 기반 rate limit (분당 100회)
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`web-search:${ip}`, RATE_LIMITS.api);
  if (!rl.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return apiError("검색어를 입력해주세요.", 400);
  }

  try {
    // 4개 테이블 동시 검색 (Promise.all로 병렬 처리)
    const [games, tournaments, teams, posts] = await Promise.all([
      // 경기: title에서 키워드 검색
      prisma.games.findMany({
        where: { title: { contains: q, mode: "insensitive" } },
        orderBy: { scheduled_at: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          game_type: true,
          venue_name: true,
          city: true,
          scheduled_at: true,
          current_participants: true,
          max_participants: true,
        },
      }),

      // 대회: name에서 키워드 검색
      prisma.tournament.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          city: true,
          startDate: true,
          endDate: true,
          teams_count: true,
          maxTeams: true,
        },
      }),

      // 팀: name에서 키워드 검색
      prisma.team.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          city: true,
          members_count: true,
          logoUrl: true,
        },
      }),

      // 커뮤니티: title에서 키워드 검색
      prisma.community_posts.findMany({
        where: {
          title: { contains: q, mode: "insensitive" },
          status: "published",
        },
        orderBy: { created_at: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          view_count: true,
          comments_count: true,
          created_at: true,
        },
      }),
    ]);

    // BigInt/Date를 JSON 직렬화 가능한 형태로 변환
    const serialize = (obj: Record<string, unknown>) => {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "bigint") {
          result[key] = value.toString();
        } else if (value instanceof Date) {
          result[key] = value.toISOString();
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return apiSuccess({
      games: games.map((g) => serialize(g as unknown as Record<string, unknown>)),
      tournaments: tournaments.map((t) => serialize(t as unknown as Record<string, unknown>)),
      teams: teams.map((t) => serialize(t as unknown as Record<string, unknown>)),
      posts: posts.map((p) => serialize(p as unknown as Record<string, unknown>)),
    });
  } catch (error) {
    console.error("[search] error:", error);
    return apiError("검색 중 오류가 발생했습니다.", 500);
  }
}
