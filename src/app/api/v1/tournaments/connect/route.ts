import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withErrorHandler } from "@/lib/api/middleware";
import { apiSuccess, apiError, notFound } from "@/lib/api/response";

// FR-023: 대회 API 토큰으로 대회 기본 정보 조회 (공개 엔드포인트)
// api_token 자체가 인증 수단이므로 JWT 불필요
// Flutter 앱 구형 연결 플로우(TournamentConnectScreen)에서 사용
async function handler(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return apiError("Token parameter required", 400, "VALIDATION_ERROR");
  }

  const tournament = await prisma.tournament.findUnique({
    where: { apiToken: token },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      venue_name: true,
      venue_address: true,
      teams_count: true,
    },
  });

  if (!tournament) return notFound("Tournament not found");

  return apiSuccess({
    id: tournament.id,
    name: tournament.name,
    status: tournament.status,
    start_date: tournament.startDate,
    end_date: tournament.endDate,
    venue_name: tournament.venue_name,
    venue_address: tournament.venue_address,
    team_count: tournament.teams_count,
  });
}

export const GET = withErrorHandler(handler);
