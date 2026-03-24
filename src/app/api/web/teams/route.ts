import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/teams
 *
 * 팀 목록 + 도시 목록을 한번에 반환하는 공개 API
 * - 인증 불필요 (공개 목록)
 * - 쿼리 파라미터: q(검색), city(도시)
 * - BigInt 필드를 JSON 직렬화 가능한 형태로 변환
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // 쿼리 파라미터 추출
    const q = searchParams.get("q") || undefined;
    const city = searchParams.get("city") || undefined;

    // where 조건 구성 (기존 page.tsx에서 이동)
    const where: Record<string, unknown> = {
      status: "active",
      is_public: true,
    };

    // 검색어가 있으면 팀 이름으로 부분 검색
    if (q) {
      where.name = { contains: q, mode: "insensitive" };
    }

    // 도시 필터 ("all"이 아닌 경우에만 적용)
    if (city && city !== "all") {
      where.city = { contains: city, mode: "insensitive" };
    }

    // 팀 목록 + 도시 목록 병렬 조회 (네트워크 요청 1회로 최적화)
    const [teams, citiesRaw] = await Promise.all([
      prisma.team.findMany({
        where,
        orderBy: [{ wins: "desc" }, { createdAt: "desc" }],
        take: 60,
        select: {
          id: true,
          name: true,
          primaryColor: true,
          secondaryColor: true,
          city: true,
          district: true,
          wins: true,
          losses: true,
          accepting_members: true,
          tournaments_count: true,
          _count: { select: { teamMembers: true } },
        },
      }).catch(() => []),
      prisma.team.groupBy({
        by: ["city"],
        where: { city: { not: null }, status: "active", is_public: true },
        orderBy: { _count: { city: "desc" } },
        take: 30,
      }).catch(() => []),
    ]);

    // 도시 목록에서 null 제거
    const cities = citiesRaw.map((r) => r.city!).filter(Boolean);

    // BigInt 필드를 string으로 변환 (JSON 직렬화 불가능하므로)
    const serializedTeams = teams.map((t) => ({
      id: t.id.toString(),                         // BigInt -> string
      name: t.name,
      primaryColor: t.primaryColor,
      secondaryColor: t.secondaryColor,
      city: t.city,
      district: t.district,
      wins: t.wins,
      losses: t.losses,
      acceptingMembers: t.accepting_members,
      tournamentsCount: t.tournaments_count,
      memberCount: t._count.teamMembers,            // _count를 평탄화
    }));

    return apiSuccess({ teams: serializedTeams, cities });
  } catch (error) {
    console.error("[GET /api/web/teams] Error:", error);
    return apiError("팀 목록을 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
