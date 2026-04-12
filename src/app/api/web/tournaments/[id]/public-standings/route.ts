import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 대회 순위 탭 공개 API (인증 불필요)
 * GET /api/web/tournaments/[id]/public-standings
 *
 * 대회 상세 페이지에서 "순위" 탭 클릭 시 호출
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return apiError("Invalid tournament ID", 400);
  }

  // 1) 참가팀 + 완료/진행중 경기를 병렬로 조회 (DB 왕복 1회로 최적화)
  const [teams, matches] = await Promise.all([
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      include: { team: { select: { name: true } } },
    }),
    prisma.tournamentMatch.findMany({
      where: {
        tournamentId: id,
        status: { in: ["completed", "in_progress"] }, // 완료 + 진행중 경기만
        homeTeamId: { not: null },
        awayTeamId: { not: null },
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        status: true,
      },
    }),
  ]);

  // 2) 팀별 전적 집계 (tournament_teams.wins/losses 대신 경기 결과에서 직접 계산)
  const teamStats: Record<
    string,
    { wins: number; losses: number; draws: number; pointsFor: number; pointsAgainst: number }
  > = {};

  for (const m of matches) {
    if (!m.homeTeamId || !m.awayTeamId) continue;
    const homeId = m.homeTeamId.toString();
    const awayId = m.awayTeamId.toString();
    const hs = m.homeScore ?? 0;
    const as_ = m.awayScore ?? 0; // as는 JS 예약어이므로 as_ 사용

    // 초기화
    if (!teamStats[homeId])
      teamStats[homeId] = { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
    if (!teamStats[awayId])
      teamStats[awayId] = { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };

    // 득점/실점 집계 (진행중 경기도 포함)
    teamStats[homeId].pointsFor += hs;
    teamStats[homeId].pointsAgainst += as_;
    teamStats[awayId].pointsFor += as_;
    teamStats[awayId].pointsAgainst += hs;

    // 승패는 완료된 경기에서만 집계
    if (m.status === "completed") {
      if (hs > as_) {
        teamStats[homeId].wins++;
        teamStats[awayId].losses++;
      } else if (as_ > hs) {
        teamStats[awayId].wins++;
        teamStats[homeId].losses++;
      } else {
        teamStats[homeId].draws++;
        teamStats[awayId].draws++;
      }
    }
  }

  // 3) 직렬화 + 정렬 (승수 내림차순 → 패수 오름차순 → 득실차 내림차순)
  const serialized = teams
    .map((t) => {
      const tid = t.id.toString();
      const stats = teamStats[tid] ?? {
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      };
      return {
        id: tid,
        teamName: t.team.name,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        groupName: t.groupName,
        pointsFor: stats.pointsFor,
        pointsAgainst: stats.pointsAgainst,
        pointDifference: stats.pointsFor - stats.pointsAgainst,
      };
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins; // 승수 많은 순
      if (a.losses !== b.losses) return a.losses - b.losses; // 패수 적은 순
      return b.pointDifference - a.pointDifference; // 득실차 높은 순
    });

  return apiSuccess({ teams: serialized });
}
