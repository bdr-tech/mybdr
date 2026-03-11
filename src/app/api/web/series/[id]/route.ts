import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

export const GET = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    const series = await prisma.tournament_series.findUnique({
      where: { id: BigInt(id) },
      include: {
        tournaments: {
          orderBy: { edition_number: "asc" },
          select: {
            id: true,
            name: true,
            edition_number: true,
            startDate: true,
            status: true,
            venue_name: true,
            city: true,
            maxTeams: true,
            teams_count: true,
          },
        },
      },
    });

    if (!series) return apiError("시리즈를 찾을 수 없습니다.", 404);
    if (series.organizer_id !== ctx.userId) {
      return apiError("접근 권한이 없습니다.", 403);
    }

    const totalTeams = series.tournaments.reduce((sum, t) => sum + (t.teams_count ?? 0), 0);

    return apiSuccess({
      id: series.id.toString(),
      name: series.name,
      slug: series.slug,
      description: series.description,
      tournaments_count: series.tournaments_count ?? 0,
      total_teams: totalTeams,
      editions: series.tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        edition_number: t.edition_number,
        startDate: t.startDate?.toISOString() ?? null,
        status: t.status,
        venue_name: t.venue_name,
        city: t.city,
        maxTeams: t.maxTeams,
        teams_count: t.teams_count ?? 0,
      })),
    });
  } catch {
    return apiError("서버 오류가 발생했습니다.", 500);
  }
});
