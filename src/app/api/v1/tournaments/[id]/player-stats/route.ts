import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess } from "@/lib/api/response";

// FR-027: 토너먼트 전체 선수 스탯
async function handler(_req: NextRequest, _ctx: AuthContext, tournamentId: string) {
  const stats = await prisma.matchPlayerStat.findMany({
    where: { tournamentMatch: { tournamentId } },
    include: {
      tournamentTeamPlayer: {
        select: { id: true, jerseyNumber: true, position: true, users: { select: { nickname: true } } },
      },
    },
  });

  return apiSuccess(stats);
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return handler(r, authCtx, id);
  }))(req);
}
