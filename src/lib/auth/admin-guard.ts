import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

/**
 * 협회 관리자(Association Admin) 인증 유틸리티.
 *
 * 사용법:
 *   const admin = await getAssociationAdmin();
 *   if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
 *
 * 내부 동작:
 *   1) getWebSession()으로 현재 로그인 세션 가져오기
 *   2) User 테이블에서 admin_role이 "association_admin"인지 확인
 *   3) AssociationAdmin 매핑 테이블에서 user_id로 소속 협회 조회
 *   4) 둘 다 통과하면 { userId, associationId } 반환, 아니면 null
 */

export type AdminGuardResult = {
  userId: bigint;
  associationId: bigint;
};

export async function getAssociationAdmin(): Promise<AdminGuardResult | null> {
  // 1) 세션 확인 — 로그인 안 되어 있으면 null
  const session = await getWebSession();
  if (!session) return null;

  const userId = BigInt(session.sub);

  // 2) User.admin_role 확인 — "association_admin"이어야 함
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { admin_role: true },
  });
  if (!user || user.admin_role !== "association_admin") return null;

  // 3) AssociationAdmin 매핑 조회 — user_id가 unique이므로 findUnique 사용
  const adminMapping = await prisma.associationAdmin.findUnique({
    where: { user_id: userId },
    select: { association_id: true },
  });
  if (!adminMapping) return null;

  return {
    userId,
    associationId: adminMapping.association_id,
  };
}
