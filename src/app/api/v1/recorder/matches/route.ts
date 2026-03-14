import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess } from "@/lib/api/response";
import { ACTIVE_MATCH_STATUSES, ACTIVE_TOURNAMENT_STATUSES } from "@/lib/constants/match-status";

// GET /api/v1/recorder/matches
// 현재 로그인한 사용자가 기록원으로 지정된 경기 목록 반환
async function handler(_req: NextRequest, ctx: AuthContext) {
  const userId = BigInt(ctx.userId);
  const isSuperAdmin = ctx.userRole === "super_admin";

  // super_admin은 진행중인 모든 대회의 경기를 볼 수 있음
  if (isSuperAdmin) {
    const matches = await prisma.tournamentMatch.findMany({
      where: {
        status: { in: [...ACTIVE_MATCH_STATUSES] },
        tournament: { status: { in: [...ACTIVE_TOURNAMENT_STATUSES] } },
      },
      select: {
        id: true, uuid: true, tournamentId: true, roundName: true,
        round_number: true, status: true, scheduledAt: true, started_at: true,
        homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true,
        venue_name: true,
        homeTeam: { select: { id: true, tournamentId: true, teamId: true } },
        awayTeam: { select: { id: true, tournamentId: true, teamId: true } },
        tournament: { select: { id: true, name: true } },
      },
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
      take: 100,
    });
    return apiSuccess({ matches });
  }

  // 기록원으로 등록된 대회 ID 목록
  const recorderRows = await prisma.tournament_recorders.findMany({
    where: { recorderId: userId, isActive: true },
    select: { tournamentId: true },
  });

  // 주최자인 대회도 포함
  const organizerRows = await prisma.tournament.findMany({
    where: { organizerId: userId, status: { in: [...ACTIVE_TOURNAMENT_STATUSES] } },
    select: { id: true },
  });

  const tournamentIds = [
    ...recorderRows.map((r) => r.tournamentId),
    ...organizerRows.map((r) => r.id),
  ];

  if (tournamentIds.length === 0) return apiSuccess({ matches: [] });

  // 고유 ID
  const uniqueIds = [...new Set(tournamentIds)];

  const matches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId: { in: uniqueIds },
      status: { in: [...ACTIVE_MATCH_STATUSES] },
    },
    select: {
      id: true,
      uuid: true,
      tournamentId: true,
      roundName: true,
      round_number: true,
      status: true,
      scheduledAt: true,
      started_at: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      venue_name: true,
      homeTeam: { select: { id: true, tournamentId: true, teamId: true } },
      awayTeam: { select: { id: true, tournamentId: true, teamId: true } },
      tournament: { select: { id: true, name: true } },
    },
    orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
  });

  return apiSuccess({ matches });
}

export const GET = withErrorHandler(withAuth(handler));
