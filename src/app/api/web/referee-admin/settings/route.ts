import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

/**
 * /api/web/referee-admin/settings
 *
 * 협회 관리자 목록 조회 + 관리자 추가 API.
 *
 * GET  — 현재 협회의 관리자 목록 (모든 관리자 열람 가능)
 * POST — 관리자 추가 (secretary_general만 가능: admin_manage 권한)
 *
 * 보안:
 *   - association_id는 세션에서 강제 (IDOR 방지)
 *   - POST는 admin_manage 권한 필수
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

// ── POST 요청 Zod 스키마 ──
const addAdminSchema = z.object({
  // 추가할 유저의 ID
  user_id: z.number().int().positive("유효하지 않은 유저 ID입니다."),
  // 역할 (9종 중 하나)
  role: z.enum(VALID_ROLES, { message: "유효하지 않은 역할입니다." }),
});

/**
 * GET — 현재 협회 관리자 목록 조회
 */
export async function GET() {
  try {
    // 1) 관리자 인증 — 모든 관리자가 열람 가능
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 2) 같은 협회의 관리자 전체 조회 + User 정보 join
    const admins = await prisma.associationAdmin.findMany({
      where: { association_id: admin.associationId },
      orderBy: { created_at: "asc" },
    });

    // 3) User 정보 별도 조회 (name, email)
    const userIds = admins.map((a) => a.user_id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, nickname: true },
    });
    const userMap = new Map(users.map((u) => [u.id.toString(), u]));

    // 4) 응답 구성
    const items = admins.map((a) => {
      const user = userMap.get(a.user_id.toString());
      return {
        id: a.id,
        user_id: a.user_id,
        user_name: user?.name ?? user?.nickname ?? null,
        user_email: user?.email ?? null,
        role: a.role,
        created_at: a.created_at,
      };
    });

    return apiSuccess({ items, current_user_id: admin.userId });
  } catch {
    return apiError("관리자 목록을 불러올 수 없습니다.", 500);
  }
}

/**
 * POST — 관리자 추가
 */
export async function POST(req: Request) {
  try {
    // 1) 관리자 인증
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 2) admin_manage 권한 체크 (secretary_general만)
    const denied = requirePermission(admin.role, "admin_manage");
    if (denied) return denied;

    // 3) 요청 본문 파싱 + 검증
    const body = await req.json();
    const parsed = addAdminSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }

    const { user_id, role } = parsed.data;
    const targetUserId = BigInt(user_id);

    // 4) 대상 유저 존재 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, admin_role: true },
    });
    if (!targetUser) {
      return apiError("해당 유저를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 5) 이미 등록된 관리자인지 확인 (user_id unique 제약)
    const existing = await prisma.associationAdmin.findUnique({
      where: { user_id: targetUserId },
    });
    if (existing) {
      return apiError("이미 관리자로 등록된 유저입니다.", 409, "DUPLICATE");
    }

    // 6) AssociationAdmin 생성 + User.admin_role 업데이트 (트랜잭션)
    const created = await prisma.$transaction(async (tx) => {
      // 관리자 매핑 생성
      const adminRecord = await tx.associationAdmin.create({
        data: {
          user_id: targetUserId,
          association_id: admin.associationId,
          role,
        },
      });

      // User.admin_role을 "association_admin"으로 설정
      // (이미 설정돼 있으면 변경 없음)
      if (targetUser.admin_role !== "association_admin") {
        await tx.user.update({
          where: { id: targetUserId },
          data: { admin_role: "association_admin" },
        });
      }

      return adminRecord;
    });

    return apiSuccess(
      {
        id: created.id,
        user_id: created.user_id,
        role: created.role,
        message: "관리자가 추가되었습니다.",
      },
      201
    );
  } catch {
    return apiError("관리자 추가에 실패했습니다.", 500);
  }
}
