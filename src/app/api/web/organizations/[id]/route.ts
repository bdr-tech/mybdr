import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/organizations/[id] — 단체 상세 조회
 * 로그인 유저가 소속된 단체의 상세 정보 (멤버 수, 시리즈 목록 포함)
 */
export const GET = withWebAuth(
  async (
    _req: Request,
    routeCtx: { params: Promise<{ id: string }> },
    ctx: WebAuthContext
  ) => {
    try {
      const { id } = await routeCtx.params;
      const orgId = BigInt(id);

      const org = await prisma.organizations.findUnique({
        where: { id: orgId },
        include: {
          owner: { select: { id: true, nickname: true, profile_image_url: true } },
          members: {
            where: { is_active: true },
            include: {
              user: { select: { id: true, nickname: true, profile_image_url: true } },
            },
            orderBy: { created_at: "asc" },
          },
          series: {
            where: { status: "active" },
            orderBy: { created_at: "desc" },
            select: {
              id: true,
              uuid: true,
              name: true,
              slug: true,
              tournaments_count: true,
              created_at: true,
            },
          },
        },
      });

      if (!org) {
        return apiError("단체를 찾을 수 없습니다.", 404);
      }

      // 내 멤버십 확인 (역할 포함)
      const myMembership = org.members.find(
        (m) => m.user_id === ctx.userId
      );

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
        contactPhone: org.contact_phone,
        websiteUrl: org.website_url,
        status: org.status,
        isPublic: org.is_public,
        seriesCount: org.series_count,
        createdAt: org.created_at,
        owner: {
          id: org.owner.id.toString(),
          nickname: org.owner.nickname,
          profileImageUrl: org.owner.profile_image_url,
        },
        myRole: myMembership?.role || null,
        members: org.members.map((m) => ({
          id: m.id.toString(),
          userId: m.user_id.toString(),
          nickname: m.user.nickname,
          profileImageUrl: m.user.profile_image_url,
          role: m.role,
          createdAt: m.created_at,
        })),
        series: org.series.map((s) => ({
          id: s.id.toString(),
          uuid: s.uuid,
          name: s.name,
          slug: s.slug,
          tournamentsCount: s.tournaments_count,
          createdAt: s.created_at,
        })),
      });
    } catch {
      return apiError("단체 조회 중 오류가 발생했습니다.", 500);
    }
  }
);

/**
 * PATCH /api/web/organizations/[id] — 단체 정보 수정
 * owner 또는 admin만 수정 가능 (IDOR 방지)
 */
export const PATCH = withWebAuth(
  async (
    req: Request,
    routeCtx: { params: Promise<{ id: string }> },
    ctx: WebAuthContext
  ) => {
    try {
      const { id } = await routeCtx.params;
      const orgId = BigInt(id);

      // 권한 검증: owner 또는 admin만 수정 가능
      const membership = await prisma.organization_members.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: orgId,
            user_id: ctx.userId,
          },
        },
      });

      if (!membership || !["owner", "admin"].includes(membership.role)) {
        return apiError("수정 권한이 없습니다.", 403);
      }

      const body = (await req.json()) as Record<string, unknown>;

      // 허용된 필드만 업데이트 (안전한 화이트리스트 방식)
      const updateData: Record<string, unknown> = {};
      if (body.name !== undefined) updateData.name = (body.name as string).trim();
      if (body.description !== undefined) updateData.description = (body.description as string)?.trim() || null;
      if (body.region !== undefined) updateData.region = (body.region as string)?.trim() || null;
      if (body.logo_url !== undefined) updateData.logo_url = (body.logo_url as string)?.trim() || null;
      if (body.banner_url !== undefined) updateData.banner_url = (body.banner_url as string)?.trim() || null;
      if (body.contact_email !== undefined) updateData.contact_email = (body.contact_email as string)?.trim() || null;
      if (body.contact_phone !== undefined) updateData.contact_phone = (body.contact_phone as string)?.trim() || null;
      if (body.website_url !== undefined) updateData.website_url = (body.website_url as string)?.trim() || null;
      if (body.is_public !== undefined) updateData.is_public = Boolean(body.is_public);

      if (Object.keys(updateData).length === 0) {
        return apiError("수정할 항목이 없습니다.", 400);
      }

      const updated = await prisma.organizations.update({
        where: { id: orgId },
        data: updateData,
      });

      return apiSuccess({
        success: true,
        id: updated.id.toString(),
        name: updated.name,
        slug: updated.slug,
      });
    } catch {
      return apiError("단체 수정 중 오류가 발생했습니다.", 500);
    }
  }
);
