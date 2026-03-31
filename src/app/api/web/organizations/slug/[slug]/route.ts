import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/organizations/slug/[slug] — 공개 단체 조회
 * 인증 불필요. slug로 단체 정보 + 멤버 수 + 시리즈 목록 반환.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    const org = await prisma.organizations.findUnique({
      where: { slug },
      include: {
        owner: {
          select: { id: true, nickname: true, profile_image_url: true },
        },
        members: {
          where: { is_active: true },
          select: { id: true }, // 멤버 수 카운트용
        },
        series: {
          where: { status: "active", is_public: true },
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            uuid: true,
            name: true,
            slug: true,
            logo_url: true,
            tournaments_count: true,
            created_at: true,
          },
        },
      },
    });

    if (!org || !org.is_public) {
      return apiError("단체를 찾을 수 없습니다.", 404);
    }

    return apiSuccess({
      id: org.id.toString(),
      uuid: org.uuid,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logo_url,
      bannerUrl: org.banner_url,
      description: org.description,
      region: org.region,
      contactEmail: org.contact_email,
      websiteUrl: org.website_url,
      status: org.status,
      seriesCount: org.series_count,
      memberCount: org.members.length,
      createdAt: org.created_at,
      owner: {
        id: org.owner.id.toString(),
        nickname: org.owner.nickname,
        profileImageUrl: org.owner.profile_image_url,
      },
      series: org.series.map((s) => ({
        id: s.id.toString(),
        uuid: s.uuid,
        name: s.name,
        slug: s.slug,
        logoUrl: s.logo_url,
        tournamentsCount: s.tournaments_count,
        createdAt: s.created_at,
      })),
    });
  } catch {
    return apiError("단체 조회 중 오류가 발생했습니다.", 500);
  }
}
