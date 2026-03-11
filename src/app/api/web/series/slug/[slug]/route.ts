import { type NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const getData = unstable_cache(
    async () => {
      const series = await prisma.tournament_series.findUnique({
        where: { slug, is_public: true },
        include: {
          tournaments: {
            orderBy: { edition_number: "asc" },
            select: {
              id: true,
              name: true,
              edition_number: true,
              startDate: true,
              endDate: true,
              status: true,
              venue_name: true,
              city: true,
              maxTeams: true,
              teams_count: true,
              teams: { select: { name: true } },
            },
          },
        },
      });

      if (!series) return null;

      return {
        id: series.id.toString(),
        uuid: series.uuid,
        name: series.name,
        slug: series.slug,
        description: series.description,
        logo_url: series.logo_url,
        tournaments_count: series.tournaments_count ?? 0,
        editions: series.tournaments.map((t) => ({
          id: t.id,
          name: t.name,
          edition_number: t.edition_number,
          startDate: t.startDate?.toISOString() ?? null,
          endDate: t.endDate?.toISOString() ?? null,
          status: t.status,
          venue_name: t.venue_name,
          city: t.city,
          maxTeams: t.maxTeams,
          teams_count: t.teams_count ?? 0,
          champion_name: t.teams?.name ?? null,
        })),
      };
    },
    [`series-slug-${slug}`],
    { revalidate: 30 }
  );

  const data = await getData();
  if (!data) return apiError("시리즈를 찾을 수 없습니다.", 404);

  return apiSuccess(data);
}
