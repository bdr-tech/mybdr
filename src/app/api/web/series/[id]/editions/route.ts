import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

export const POST = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    // IDOR 방지: 소유자 확인
    const series = await prisma.tournament_series.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, name: true, organizer_id: true },
    });
    if (!series) return apiError("시리즈를 찾을 수 없습니다.", 404);
    if (series.organizer_id !== ctx.userId) {
      return apiError("접근 권한이 없습니다.", 403);
    }

    const body = await req.json() as Record<string, unknown>;
    const startDate = body.startDate as string;
    const venueName = (body.venueName as string)?.trim() || null;
    const maxTeams = Number(body.maxTeams) || 8;

    if (!startDate) {
      return apiError("날짜는 필수입니다.", 400);
    }

    // edition_number 자동 채번
    const count = await prisma.tournament.count({
      where: { series_id: series.id },
    });
    const editionNumber = count + 1;

    const [tournament] = await prisma.$transaction([
      prisma.tournament.create({
        data: {
          series_id: series.id,
          edition_number: editionNumber,
          name: `${series.name} ${editionNumber}회`,
          startDate: new Date(startDate),
          venue_name: venueName,
          maxTeams,
          status: "registration_open",
          format: "single_elimination",
          organizerId: ctx.userId,
          is_public: true,
        },
      }),
      prisma.tournament_series.update({
        where: { id: series.id },
        data: {
          tournaments_count: { increment: 1 },
          updated_at: new Date(),
        },
      }),
    ]);

    return apiSuccess({
      success: true,
      tournamentId: tournament.id,
      editionNumber,
      name: tournament.name,
      redirectUrl: `/tournament-admin/tournaments/${tournament.id}`,
    });
  } catch {
    return apiError("회차 추가 중 오류가 발생했습니다.", 500);
  }
});
