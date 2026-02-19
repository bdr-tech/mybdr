import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess } from "@/lib/api/response";

// FR-022: 내 토너먼트 목록 API
async function handler(_req: NextRequest, ctx: AuthContext) {
  const adminMembers = await prisma.tournamentAdminMember.findMany({
    where: {
      userId: BigInt(ctx.userId),
      isActive: true,
    },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  const tournaments = adminMembers.map((m) => ({
    id: m.tournament.id,
    name: m.tournament.name,
    status: m.tournament.status,
    role: m.role,
    startDate: m.tournament.startDate,
    endDate: m.tournament.endDate,
  }));

  return apiSuccess(tournaments);
}

export const GET = withErrorHandler(withAuth(handler));
