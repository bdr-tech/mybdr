import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, notFound, apiError } from "@/lib/api/response";

// FR-023: 토너먼트 검증 API (API 토큰으로 접근)
async function handler(req: NextRequest, _ctx: AuthContext) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return apiError("Token parameter required", 400, "VALIDATION_ERROR");
  }

  const tournament = await prisma.tournament.findUnique({
    where: { apiToken: token },
    select: {
      id: true,
      name: true,
      format: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!tournament) return notFound("Tournament not found");

  return apiSuccess(tournament);
}

export const GET = withErrorHandler(withAuth(handler));
