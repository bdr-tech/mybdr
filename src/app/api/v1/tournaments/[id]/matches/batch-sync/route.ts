import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { batchSyncSchema } from "@/lib/validation/match";
import { apiSuccess, forbidden, validationError } from "@/lib/api/response";

// FR-025: 매치 일괄 동기화
async function handler(req: NextRequest, ctx: AuthContext, tournamentId: string) {
  const adminMember = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId, userId: BigInt(ctx.userId), isActive: true },
  });
  if (!adminMember) return forbidden("No access to this tournament");

  let body: unknown;
  try { body = await req.json(); } catch { return validationError([{ message: "Invalid JSON body" }]); }

  const result = batchSyncSchema.safeParse(body);
  if (!result.success) return validationError(result.error.issues);

  let synced = 0;
  let failed = 0;
  const errors: { matchId: string; reason: string }[] = [];

  for (const match of result.data.matches) {
    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.tournamentMatch.findFirst({
          where: { id: BigInt(match.matchId), tournamentId },
        });
        if (!existing) throw new Error("Match not found in tournament");

        await tx.tournamentMatch.update({
          where: { id: BigInt(match.matchId) },
          data: {
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            status: match.status,
            quarterScores: match.quarterScores ?? undefined,
          },
        });
      });
      synced++;
    } catch (err) {
      failed++;
      // ★ 보안: 내부 에러 메시지 노출 방지
      const safeReason = err instanceof Error && err.message === "Match not found in tournament"
        ? "Match not found in tournament"
        : "Sync failed";
      console.error(`[batch-sync] Match ${match.matchId} failed:`, err);
      errors.push({ matchId: match.matchId, reason: safeReason });
    }
  }

  return apiSuccess({ synced, failed, errors }, failed > 0 && synced > 0 ? 207 : 200);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return handler(r, authCtx, id);
  }))(req);
}
