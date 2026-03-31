import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/organizations/[id]/members — 멤버 목록
 * 단체 소속 멤버 전체 조회 (활성 멤버만)
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

      // 본인이 멤버인지 확인 (소속 확인)
      const myMembership = await prisma.organization_members.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: orgId,
            user_id: ctx.userId,
          },
        },
      });

      if (!myMembership || !myMembership.is_active) {
        return apiError("단체 멤버만 조회할 수 있습니다.", 403);
      }

      const members = await prisma.organization_members.findMany({
        where: { organization_id: orgId, is_active: true },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              email: true,
              profile_image_url: true,
            },
          },
        },
        orderBy: [
          // owner → admin → member 순서로 정렬
          { role: "asc" },
          { created_at: "asc" },
        ],
      });

      return apiSuccess({
        members: members.map((m) => ({
          id: m.id.toString(),
          userId: m.user_id.toString(),
          nickname: m.user.nickname,
          email: m.user.email,
          profileImageUrl: m.user.profile_image_url,
          role: m.role,
          createdAt: m.created_at,
        })),
      });
    } catch {
      return apiError("멤버 목록 조회 중 오류가 발생했습니다.", 500);
    }
  }
);

/**
 * POST /api/web/organizations/[id]/members — 멤버 초대 (이메일로)
 * owner 또는 admin만 초대 가능
 * body: { email, role? } — role 기본값 "member"
 */
export const POST = withWebAuth(
  async (
    req: Request,
    routeCtx: { params: Promise<{ id: string }> },
    ctx: WebAuthContext
  ) => {
    try {
      const { id } = await routeCtx.params;
      const orgId = BigInt(id);

      // 권한 검증: owner/admin만 초대 가능
      const myMembership = await prisma.organization_members.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: orgId,
            user_id: ctx.userId,
          },
        },
      });

      if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
        return apiError("멤버 초대 권한이 없습니다.", 403);
      }

      const body = (await req.json()) as Record<string, unknown>;
      const email = (body.email as string)?.trim();
      const role = (body.role as string)?.trim() || "member";

      if (!email) {
        return apiError("초대할 유저의 이메일은 필수입니다.", 400);
      }

      // owner 역할은 초대로 부여 불가 (보안)
      if (role === "owner") {
        return apiError("owner 역할은 초대로 부여할 수 없습니다.", 400);
      }

      // 이메일로 유저 검색
      const targetUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, nickname: true },
      });

      if (!targetUser) {
        return apiError("해당 이메일의 유저를 찾을 수 없습니다.", 404);
      }

      // 이미 멤버인지 확인
      const existingMember = await prisma.organization_members.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: orgId,
            user_id: targetUser.id,
          },
        },
      });

      if (existingMember && existingMember.is_active) {
        return apiError("이미 소속된 멤버입니다.", 409);
      }

      // 비활성 멤버면 재활성화, 아니면 새로 생성
      if (existingMember) {
        await prisma.organization_members.update({
          where: { id: existingMember.id },
          data: { is_active: true, role },
        });
      } else {
        await prisma.organization_members.create({
          data: {
            organization_id: orgId,
            user_id: targetUser.id,
            role,
            is_active: true,
          },
        });
      }

      return apiSuccess({
        success: true,
        message: `${targetUser.nickname || email}님을 ${role}로 초대했습니다.`,
      });
    } catch {
      return apiError("멤버 초대 중 오류가 발생했습니다.", 500);
    }
  }
);
