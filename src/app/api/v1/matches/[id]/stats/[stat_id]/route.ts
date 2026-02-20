import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { createStatSchema } from "@/lib/validation/match";
import { apiSuccess, notFound, forbidden, validationError } from "@/lib/api/response";

type Ctx = AuthContext & { params: Promise<{ id: string; stat_id: string }> };

async function patchHandler(req: NextRequest, ctx: Ctx) {
  const { stat_id } = await ctx.params;
  const statId = BigInt(stat_id);

  const stat = await prisma.matchPlayerStat.findUnique({
    where: { id: statId },
    include: { tournamentMatch: { select: { tournamentId: true } } },
  });
  if (!stat) return notFound("Stat not found");

  const hasAccess = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId: stat.tournamentMatch.tournamentId, userId: BigInt(ctx.userId), isActive: true },
  });
  if (!hasAccess) return forbidden("No access");

  let body: unknown;
  try { body = await req.json(); } catch { return validationError([{ message: "Invalid JSON" }]); }

  const result = createStatSchema.partial().safeParse(body);
  if (!result.success) return validationError(result.error.issues);

  const s = result.data;
  const updated = await prisma.matchPlayerStat.update({
    where: { id: statId },
    data: {
      ...(s.points !== undefined && { points: s.points }),
      ...(s.rebounds !== undefined && { total_rebounds: s.rebounds }),
      ...(s.assists !== undefined && { assists: s.assists }),
      ...(s.steals !== undefined && { steals: s.steals }),
      ...(s.blocks !== undefined && { blocks: s.blocks }),
      ...(s.turnovers !== undefined && { turnovers: s.turnovers }),
      ...(s.fouls !== undefined && { personal_fouls: s.fouls }),
      ...(s.fieldGoalsMade !== undefined && { fieldGoalsMade: s.fieldGoalsMade }),
      ...(s.fieldGoalsAttempted !== undefined && { fieldGoalsAttempted: s.fieldGoalsAttempted }),
      ...(s.threePointersMade !== undefined && { threePointersMade: s.threePointersMade }),
      ...(s.threePointersAttempted !== undefined && { threePointersAttempted: s.threePointersAttempted }),
      ...(s.freeThrowsMade !== undefined && { freeThrowsMade: s.freeThrowsMade }),
      ...(s.freeThrowsAttempted !== undefined && { freeThrowsAttempted: s.freeThrowsAttempted }),
      ...(s.minutesPlayed !== undefined && { minutesPlayed: s.minutesPlayed }),
      ...(s.isStarter !== undefined && { isStarter: s.isStarter }),
      ...(s.plusMinus !== undefined && { plusMinus: s.plusMinus }),
      updatedAt: new Date(),
    },
  });

  return apiSuccess(updated);
}

async function deleteHandler(_req: NextRequest, ctx: Ctx) {
  const { stat_id } = await ctx.params;
  const statId = BigInt(stat_id);

  const stat = await prisma.matchPlayerStat.findUnique({
    where: { id: statId },
    include: { tournamentMatch: { select: { tournamentId: true } } },
  });
  if (!stat) return notFound("Stat not found");

  const hasAccess = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId: stat.tournamentMatch.tournamentId, userId: BigInt(ctx.userId), isActive: true },
  });
  if (!hasAccess) return forbidden("No access");

  await prisma.matchPlayerStat.delete({ where: { id: statId } });
  return apiSuccess({ deleted: true });
}

export function PATCH(req: NextRequest, context: { params: Promise<{ id: string; stat_id: string }> }) {
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return patchHandler(r, { ...authCtx, params: context.params });
  }))(req);
}

export function DELETE(req: NextRequest, context: { params: Promise<{ id: string; stat_id: string }> }) {
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return deleteHandler(r, { ...authCtx, params: context.params });
  }))(req);
}
