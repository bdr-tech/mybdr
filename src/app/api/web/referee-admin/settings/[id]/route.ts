import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

/**
 * /api/web/referee-admin/settings/[id]
 *
 * 개별 관리자 역할 변경 (PATCH) / 삭제 (DELETE).
 *
 * 보안:
 *   - admin_manage 권한 필수 (secretary_general만)
 *   - association_id 세션 강제 (IDOR 방지)
 *   - 자기 자신의 역할 변경/삭제 불가 (안전장치)
 */

export const dynamic = "force-dynamic";

// ── 유효한 역할 목록 (9종) ──
const VALID_ROLES = [
  "president",
  "vice_president",
  "director",
  "secretary_general",
  "staff",
  "referee_chief",
  "referee_clerk",
  "game_chief",
  "game_clerk",
] as const;

// ── PATCH 요청 Zod 스키마 ──
const updateRoleSchema = z.object({
  role: z.enum(VALID_ROLES, { message: "유효하지 않은 역할입니다." }),
});

// ── params에서 id 추출 + 유효성 검증 ──
function parseAdminId(id: string): bigint | null {
  if (!/^\d+$/.test(id)) return null;
  return BigInt(id);
}

/**
 * PATCH — 관리자 역할 변경
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetId = parseAdminId(id);
    if (!targetId) {
      return apiError("유효하지 않은 ID입니다.", 400, "INVALID_ID");
    }

    // 1) 관리자 인증
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 2) admin_manage 권한 체크
    const denied = requirePermission(admin.role, "admin_manage");
    if (denied) return denied;

    // 3) 대상 관리자 조회 — 같은 협회인지 확인 (IDOR 방지)
    const target = await prisma.associationAdmin.findUnique({
      where: { id: targetId },
      select: { id: true, user_id: true, association_id: true },
    });
    if (!target || target.association_id !== admin.associationId) {
      return apiError("관리자를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 4) 자기 자신의 역할 변경 불가 (안전장치)
    if (target.user_id === admin.userId) {
      return apiError("자기 자신의 역할은 변경할 수 없습니다.", 400, "SELF_MODIFY");
    }

    // 5) 요청 본문 파싱 + 검증
    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }

    // 6) 역할 업데이트
    const updated = await prisma.associationAdmin.update({
      where: { id: targetId },
      data: { role: parsed.data.role },
    });

    return apiSuccess({
      id: updated.id,
      role: updated.role,
      message: "역할이 변경되었습니다.",
    });
  } catch {
    return apiError("역할 변경에 실패했습니다.", 500);
  }
}

/**
 * DELETE — 관리자 삭제
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetId = parseAdminId(id);
    if (!targetId) {
      return apiError("유효하지 않은 ID입니다.", 400, "INVALID_ID");
    }

    // 1) 관리자 인증
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 2) admin_manage 권한 체크
    const denied = requirePermission(admin.role, "admin_manage");
    if (denied) return denied;

    // 3) 대상 관리자 조회 — 같은 협회인지 확인
    const target = await prisma.associationAdmin.findUnique({
      where: { id: targetId },
      select: { id: true, user_id: true, association_id: true },
    });
    if (!target || target.association_id !== admin.associationId) {
      return apiError("관리자를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 4) 자기 자신 삭제 불가
    if (target.user_id === admin.userId) {
      return apiError("자기 자신은 삭제할 수 없습니다.", 400, "SELF_DELETE");
    }

    // 5) 삭제 + User.admin_role 초기화 (트랜잭션)
    await prisma.$transaction(async (tx) => {
      // AssociationAdmin 삭제
      await tx.associationAdmin.delete({ where: { id: targetId } });

      // User.admin_role을 null로 초기화 (더 이상 관리자가 아님)
      await tx.user.update({
        where: { id: target.user_id },
        data: { admin_role: null },
      });
    });

    return apiSuccess({ message: "관리자가 삭제되었습니다." });
  } catch {
    return apiError("관리자 삭제에 실패했습니다.", 500);
  }
}
