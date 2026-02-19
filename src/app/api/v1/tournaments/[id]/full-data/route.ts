import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, notFound, forbidden } from "@/lib/api/response";

// FR-024: 토너먼트 전체 데이터 다운로드 (Flutter 오프라인 동기화)
async function handler(
  _req: NextRequest,
  ctx: AuthContext,
  tournamentId: string
) {
  // IDOR 방지
  const adminMember = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId, userId: BigInt(ctx.userId), isActive: true },
  });
  if (!adminMember) return forbidden("No access to this tournament");

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) return notFound("Tournament not found");

  const [teams, players, matches, playerStats] = await Promise.all([
    prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: { team: { select: { name: true, primaryColor: true, secondaryColor: true } } },
    }),
    prisma.tournamentTeamPlayer.findMany({
      where: { tournamentTeam: { tournamentId } },
      include: { users: { select: { nickname: true } } },
    }),
    prisma.tournamentMatch.findMany({
      where: { tournamentId },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.matchPlayerStat.findMany({
      where: { tournamentMatch: { tournamentId } },
    }),
  ]);

  return apiSuccess({
    teams: teams.map((t) => ({
      id: t.id.toString(),
      tournamentId: t.tournamentId,
      teamName: t.team.name,
      primaryColor: t.team.primaryColor,
      secondaryColor: t.team.secondaryColor,
      groupName: t.groupName,
      seedNumber: t.seedNumber,
      wins: t.wins,
      losses: t.losses,
    })),
    players: players.map((p) => ({
      id: p.id.toString(),
      tournamentTeamId: p.tournamentTeamId.toString(),
      userId: p.userId?.toString(),
      userName: p.users?.nickname,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      role: p.role,
      isStarter: p.isStarter ?? false,
    })),
    matches: matches.map((m) => ({
      id: m.id.toString(),
      uuid: m.uuid,
      homeTeamId: m.homeTeamId?.toString(),
      awayTeamId: m.awayTeamId?.toString(),
      roundName: m.roundName,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      quarterScores: m.quarterScores,
    })),
    playerStats: playerStats.map((s) => ({
      ...s,
      id: s.id.toString(),
      tournamentMatchId: s.tournamentMatchId.toString(),
      tournamentTeamPlayerId: s.tournamentTeamPlayerId.toString(),
    })),
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return handler(r, authCtx, id);
  }))(req);
}
