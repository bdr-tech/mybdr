import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * DELETE /api/web/organizations/[id]/members/[memberId] — 멤버 제거
 * owner/admin만 제거 가능. owner 자신은 제거 불가.
 */
export const DELETE = withWebAuth(
  async (
    _req: Request,
    routeCtx: { params: Promise<{ id: string; memberId: string }> },
    ctx: WebAuthContext
  ) => {
    try {
      const { id, memberId } = await routeCtx.params;
      const orgId = BigInt(id);
      const targetMemberId = BigInt(memberId);

      // 내 권한 확인
      const myMembership = await prisma.organization_members.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: orgId,
            user_id: ctx.userId,
          },
        },
      });

      if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
        return apiError("멤버 제거 권한이 없습니다.", 403);
      }

      // 대상 멤버 조회
      const targetMember = await prisma.organization_members.findFirst({
        where: { id: targetMemberId, organization_id: orgId },
      });

      if (!targetMember) {
        return apiError("해당 멤버를 찾을 수 없습니다.", 404);
      }

      // owner는 제거 불가 (단체 해산만 가능)
      if (targetMember.role === "owner") {
        return apiError("소유자는 제거할 수 없습니다.", 400);
      }

      // admin이 다른 admin을 제거하려면 owner여야 함
      if (targetMember.role === "admin" && myMembership.role !== "owner") {
        return apiError("관리자는 소유자만 제거할 수 있습니다.", 403);
      }

      // 소프트 삭제: is_active를 false로 변경
      await prisma.organization_members.update({
        where: { id: targetMemberId },
        data: { is_active: false },
      });

      return apiSuccess({ success: true, message: "멤버가 제거되었습니다." });
    } catch {
      return apiError("멤버 제거 중 오류가 발생했습니다.", 500);
    }
  }
);
