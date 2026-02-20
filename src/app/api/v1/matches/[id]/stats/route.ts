import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { createStatSchema, bulkStatsSchema } from "@/lib/validation/match";
import { apiSuccess, notFound, validationError, forbidden } from "@/lib/api/response";

// FR-026: 매치 스탯 조회
async function getHandler(
  _req: NextRequest,
  ctx: AuthContext & { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await ctx.params;

  const stats = await prisma.matchPlayerStat.findMany({
    where: { tournamentMatchId: BigInt(matchId) },
    include: {
      tournamentTeamPlayer: {
        select: { jerseyNumber: true, position: true, users: { select: { nickname: true } } },
      },
    },
  });

  return apiSuccess(stats);
}

// FR-026: 스탯 생성
async function postHandler(
  req: NextRequest,
  ctx: AuthContext & { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await ctx.params;
  const matchIdBig = BigInt(matchId);

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchIdBig },
    select: { tournamentId: true },
  });
  if (!match) return notFound("Match not found");

  const hasAccess = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId: match.tournamentId, userId: BigInt(ctx.userId), isActive: true },
  });
  if (!hasAccess) return forbidden("No access to this tournament");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError([{ message: "Invalid JSON body" }]);
  }

  const bulkResult = bulkStatsSchema.safeParse(body);
  if (bulkResult.success) {
    // Zod 검증된 데이터를 실제 DB 컬럼명으로 매핑
    const now = new Date();
    const mapStatToDb = (s: (typeof bulkResult.data.stats)[number]) => ({
      tournamentMatchId: matchIdBig,
      tournamentTeamPlayerId: BigInt(s.tournamentTeamPlayerId),
      points: s.points,
      total_rebounds: s.rebounds,
      assists: s.assists,
      steals: s.steals,
      blocks: s.blocks,
      turnovers: s.turnovers,
      personal_fouls: s.fouls,
      fieldGoalsMade: s.fieldGoalsMade,
      fieldGoalsAttempted: s.fieldGoalsAttempted,
      threePointersMade: s.threePointersMade,
      threePointersAttempted: s.threePointersAttempted,
      freeThrowsMade: s.freeThrowsMade,
      freeThrowsAttempted: s.freeThrowsAttempted,
      minutesPlayed: s.minutesPlayed,
      isStarter: s.isStarter,
      plusMinus: s.plusMinus,
      createdAt: now,
      updatedAt: now,
    });

    const created = await prisma.matchPlayerStat.createMany({
      data: bulkResult.data.stats.map(mapStatToDb),
    });
    return apiSuccess({ created: created.count }, 201);
  }

  const singleResult = createStatSchema.safeParse(body);
  if (!singleResult.success) return validationError(singleResult.error.issues);

  const s = singleResult.data;
  const stat = await prisma.matchPlayerStat.create({
    data: {
      tournamentMatchId: matchIdBig,
      tournamentTeamPlayerId: BigInt(s.tournamentTeamPlayerId),
      points: s.points,
      total_rebounds: s.rebounds,
      assists: s.assists,
      steals: s.steals,
      blocks: s.blocks,
      turnovers: s.turnovers,
      personal_fouls: s.fouls,
      fieldGoalsMade: s.fieldGoalsMade,
      fieldGoalsAttempted: s.fieldGoalsAttempted,
      threePointersMade: s.threePointersMade,
      threePointersAttempted: s.threePointersAttempted,
      freeThrowsMade: s.freeThrowsMade,
      freeThrowsAttempted: s.freeThrowsAttempted,
      minutesPlayed: s.minutesPlayed,
      isStarter: s.isStarter,
      plusMinus: s.plusMinus,
    },
  });

  return apiSuccess(stat, 201);
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return getHandler(r, { ...authCtx, params: context.params });
  }))(req);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return postHandler(r, { ...authCtx, params: context.params });
  }))(req);
}
