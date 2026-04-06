import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

/**
 * GET /api/web/tournaments/calendar
 *
 * 캘린더 뷰 전용 대회 목록 API
 * - year/month 기반으로 해당 월에 걸치는 대회를 반환
 * - category, gender 필터 지원
 * - 인증 불필요 (공개 API)
 */
export async function GET(request: NextRequest) {
  // IP 기반 rate limit
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`web-tournaments-calendar:${ip}`, RATE_LIMITS.api);
  if (!rl.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  try {
    const { searchParams } = request.nextUrl;

    // 쿼리 파라미터: year, month (필수), category, gender (선택)
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const category = searchParams.get("category"); // general, youth, university, senior
    const gender = searchParams.get("gender");     // male, female

    // year/month 기본값: 현재 날짜
    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return apiError("유효하지 않은 년/월 값입니다.", 400);
    }

    // 해당 월의 시작일과 다음 달 시작일 계산 (UTC 기준)
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    // where 조건: 해당 월에 걸치는 대회 (시작일이 월 끝 이전 AND (종료일이 월 시작 이후 OR 종료일 없으면 시작일이 월 시작 이후))
    // draft 제외 (공개된 대회만)
    const where: Record<string, unknown> = {
      status: { not: "draft" },
      startDate: { lt: monthEnd },
      OR: [
        { endDate: { gte: monthStart } },
        { endDate: null, startDate: { gte: monthStart } },
      ],
    };

    // 종별 필터: categories Json 객체에서 해당 키가 true인 것만
    if (category && category !== "all") {
      where[`categories`] = { path: [category], equals: true };
    }

    // 성별 필터: division_tiers 배열에서 W 접미사로 판별
    // male = W로 끝나지 않는 tier 포함, female = W로 끝나는 tier 포함
    // Prisma Json 필터로는 "W로 끝나는" 조건이 어려우므로 앱 레벨에서 필터링

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: { startDate: "asc" },
      take: 200, // 월간 대회 수 상한
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        city: true,
        venue_name: true,
        categories: true,
        division_tiers: true,
        format: true,
      },
    });

    // 성별 필터: 앱 레벨에서 적용
    let filtered = tournaments;
    if (gender && gender !== "all") {
      filtered = tournaments.filter((t) => {
        const tiers = Array.isArray(t.division_tiers) ? (t.division_tiers as string[]) : [];
        if (tiers.length === 0) return true; // tier 정보 없으면 포함
        if (gender === "female") return tiers.some((code) => code.endsWith("W"));
        return tiers.some((code) => !code.endsWith("W"));
      });
    }

    // 응답 형태: 캘린더 렌더링에 필요한 최소 정보
    const result = filtered.map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      startDate: t.startDate?.toISOString() ?? null,
      endDate: t.endDate?.toISOString() ?? null,
      city: t.city,
      venueName: t.venue_name,
      categories: t.categories ?? {},
      divisionTiers: Array.isArray(t.division_tiers) ? t.division_tiers : [],
      format: t.format,
    }));

    // 5분 캐시: 캘린더 데이터는 자주 변하지 않으므로
    const response = apiSuccess({ tournaments: result, year, month });
    response.headers.set("Cache-Control", "public, s-maxage=300, max-age=300");
    return response;
  } catch (error) {
    console.error("[GET /api/web/tournaments/calendar] Error:", error);
    return apiError("캘린더 데이터를 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
