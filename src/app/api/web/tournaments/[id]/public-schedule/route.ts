import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 대회 일정 탭 공개 API (인증 불필요)
 * GET /api/web/tournaments/[id]/public-schedule
 *
 * 대회 상세 페이지에서 "일정" 탭 클릭 시 호출
 * 기존 page.tsx의 scheduleRawMatches + scheduleRawTeams 쿼리를 그대로 사용
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  // UUID 형식 검증
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return apiError("Invalid tournament ID", 400);
  }

  const [matches, teams] = await Promise.all([
    // 일정 탭: 경기 목록
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: { scheduledAt: "asc" },
      include: {
        homeTeam: { include: { team: { select: { name: true } } } },
        awayTeam: { include: { team: { select: { name: true } } } },
      },
    }),
    // 일정 탭: 참가팀 목록
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      select: {
        id: true,
        team: { select: { name: true } },
      },
      orderBy: { team: { name: "asc" } },
    }),
  ]);

  // 직렬화 (page.tsx의 scheduleMatches/scheduleTeams 변환 로직과 동일)
  const serializedMatches = matches.map((m) => ({
    id: m.id.toString(),
    homeTeamName: m.homeTeam?.team.name ?? null,
    awayTeamName: m.awayTeam?.team.name ?? null,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    roundName: m.roundName,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    courtNumber: m.court_number,
  }));

  const serializedTeams = teams.map((t) => ({
    id: t.id.toString(),
    name: t.team.name,
  }));

  return apiSuccess({ matches: serializedMatches, teams: serializedTeams });
}
