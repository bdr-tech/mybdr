import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

/**
 * GET /api/web/stats
 *
 * 플랫폼 전체 통계를 반환하는 공개 API
 * - 인증 불필요 (공개 정보)
 * - 팀 수, 매치 수, 유저 수를 병렬로 COUNT 쿼리
 * - 응답은 apiSuccess()를 통해 자동 snake_case 변환
 */
export async function GET(request: NextRequest) {
  // 공개 API — IP 기반 rate limit (분당 100회)
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`web-stats:${ip}`, RATE_LIMITS.api);
  if (!rl.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  try {
    // 3개의 COUNT 쿼리를 동시에 실행하여 응답 시간 최소화
    const [teamCount, matchCount, userCount] = await Promise.all([
      // 활성 + 공개 팀만 카운트
      prisma.team.count({
        where: { status: "active", is_public: true },
      }),
      // 전체 경기(games) 수 -- Prisma 모델명은 games
      prisma.games.count(),
      // 전체 유저 수
      prisma.user.count(),
    ]);

    // 5분 캐시: 통계는 자주 변하지 않으므로 CDN/브라우저 캐시 활용
    const response = apiSuccess({
      teamCount,
      matchCount,
      userCount,
    });
    response.headers.set("Cache-Control", "public, s-maxage=300, max-age=300");
    return response;
  } catch (error) {
    console.error("[GET /api/web/stats] Error:", error);
    return apiError("통계를 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
