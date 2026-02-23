import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, notFound, apiError, forbidden } from "@/lib/api/response";

// FR-023: 토너먼트 검증 API (API 토큰으로 접근)
async function handler(req: NextRequest, ctx: AuthContext) {
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
      organizerId: true,
    },
  });

  if (!tournament) return notFound("Tournament not found");

  // IDOR 방지: 소유자 또는 관리자만 접근 가능
  const isOwner = tournament.organizerId.toString() === ctx.userId;
  const isAdmin = ctx.userRole === "admin" || ctx.userRole === "super_admin";

  if (!isOwner && !isAdmin) {
    return forbidden("Access denied");
  }

  // organizerId는 응답에 포함하지 않음
  const { organizerId: _, ...safeData } = tournament;

  return apiSuccess(safeData);
}

export const GET = withErrorHandler(withAuth(handler));
