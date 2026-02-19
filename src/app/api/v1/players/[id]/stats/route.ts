import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, notFound } from "@/lib/api/response";

// FR-027: 선수 커리어 스탯
async function handler(
  _req: NextRequest,
  ctx: AuthContext & { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await ctx.params;
  const playerIdBig = BigInt(playerId);

  const player = await prisma.tournamentTeamPlayer.findUnique({
    where: { id: playerIdBig },
    select: { id: true, position: true, jerseyNumber: true, users: { select: { nickname: true } } },
  });

  if (!player) return notFound("Player not found");

  const stats = await prisma.matchPlayerStat.findMany({
    where: { tournamentTeamPlayerId: playerIdBig },
  });

  const gamesPlayed = stats.length;
  if (gamesPlayed === 0) {
    return apiSuccess({ player, gamesPlayed: 0, averages: null, totals: null });
  }

  const totals = stats.reduce(
    (acc, s) => ({
      points: acc.points + (s.points ?? 0),
      rebounds: acc.rebounds + (s.total_rebounds ?? 0),
      assists: acc.assists + (s.assists ?? 0),
      steals: acc.steals + (s.steals ?? 0),
      blocks: acc.blocks + (s.blocks ?? 0),
      turnovers: acc.turnovers + (s.turnovers ?? 0),
      fouls: acc.fouls + (s.personal_fouls ?? 0),
      fieldGoalsMade: acc.fieldGoalsMade + (s.fieldGoalsMade ?? 0),
      fieldGoalsAttempted: acc.fieldGoalsAttempted + (s.fieldGoalsAttempted ?? 0),
      threePointersMade: acc.threePointersMade + (s.threePointersMade ?? 0),
      threePointersAttempted: acc.threePointersAttempted + (s.threePointersAttempted ?? 0),
      freeThrowsMade: acc.freeThrowsMade + (s.freeThrowsMade ?? 0),
      freeThrowsAttempted: acc.freeThrowsAttempted + (s.freeThrowsAttempted ?? 0),
      minutesPlayed: acc.minutesPlayed + (s.minutesPlayed ?? 0),
    }),
    {
      points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0,
      turnovers: 0, fouls: 0, fieldGoalsMade: 0, fieldGoalsAttempted: 0,
      threePointersMade: 0, threePointersAttempted: 0,
      freeThrowsMade: 0, freeThrowsAttempted: 0, minutesPlayed: 0,
    }
  );

  const avg = (val: number) => Math.round((val / gamesPlayed) * 10) / 10;
  const pct = (made: number, attempted: number) =>
    attempted > 0 ? Math.round((made / attempted) * 1000) / 10 : 0;

  return apiSuccess({
    player,
    gamesPlayed,
    averages: {
      ppg: avg(totals.points),
      rpg: avg(totals.rebounds),
      apg: avg(totals.assists),
      spg: avg(totals.steals),
      bpg: avg(totals.blocks),
      tpg: avg(totals.turnovers),
      mpg: avg(totals.minutesPlayed),
      fgPct: pct(totals.fieldGoalsMade, totals.fieldGoalsAttempted),
      threePct: pct(totals.threePointersMade, totals.threePointersAttempted),
      ftPct: pct(totals.freeThrowsMade, totals.freeThrowsAttempted),
    },
    totals,
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return handler(r, { ...authCtx, params: context.params });
  }))(req);
}
