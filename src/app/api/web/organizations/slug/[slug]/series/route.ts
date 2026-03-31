import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/organizations/slug/[slug]/series — 소속 시리즈 목록
 * 인증 불필요. 공개 단체의 활성 시리즈 + 각 시리즈의 대회 목록 포함.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    // 먼저 단체가 존재하고 공개인지 확인
    const org = await prisma.organizations.findUnique({
      where: { slug },
      select: { id: true, name: true, is_public: true },
    });

    if (!org || !org.is_public) {
      return apiError("단체를 찾을 수 없습니다.", 404);
    }

    // 소속 시리즈 + 각 시리즈의 대회 정보 포함
    const seriesList = await prisma.tournament_series.findMany({
      where: {
        organization_id: org.id,
        status: "active",
        is_public: true,
      },
      include: {
        tournaments: {
          orderBy: { startDate: "desc" },
          select: {
            id: true,
            name: true,
            edition_number: true,
            status: true,
            startDate: true,
            endDate: true,
            champion_team_id: true,
          },
          take: 10, // 최근 10개 대회만
        },
      },
      orderBy: { created_at: "desc" },
    });

    return apiSuccess({
      organizationName: org.name,
      series: seriesList.map((s) => ({
        id: s.id.toString(),
        uuid: s.uuid,
        name: s.name,
        slug: s.slug,
        description: s.description,
        logoUrl: s.logo_url,
        tournamentsCount: s.tournaments_count,
        createdAt: s.created_at,
        tournaments: s.tournaments.map((t) => ({
          id: t.id,
          name: t.name,
          editionNumber: t.edition_number,
          status: t.status,
          startDate: t.startDate,
          endDate: t.endDate,
          hasChampion: !!t.champion_team_id,
        })),
      })),
    });
  } catch {
    return apiError("시리즈 목록 조회 중 오류가 발생했습니다.", 500);
  }
}
