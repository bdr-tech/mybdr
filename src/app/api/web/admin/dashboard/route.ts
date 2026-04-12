import { apiSuccess, apiError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";

/**
 * /api/web/admin/dashboard
 *
 * 협회 관리자 대시보드 통계 API.
 * - 소속 심판 수, 자격증 검증율, 미정산 총액, 최근 배정 수를 집계
 * - IDOR 방지: associationId는 세션 기반 admin-guard에서 가져옴
 */

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 관리자 인증 — 세션 + admin_role + 매핑 테이블 확인
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    const { associationId } = admin;

    // 4개 통계를 병렬로 가져옴 (성능 최적화)
    const [
      totalReferees,
      certStats,
      unpaidTotal,
      recentAssignments,
    ] = await Promise.all([
      // 1) 소속 심판 수
      prisma.referee.count({
        where: { association_id: associationId },
      }),

      // 2) 자격증 검증 통계 — 소속 심판의 자격증만 집계
      prisma.refereeCertificate.groupBy({
        by: ["verified"],
        where: {
          referee: { association_id: associationId },
        },
        _count: true,
      }),

      // 3) 미정산 총액 — 소속 심판의 pending 정산 합계
      prisma.refereeSettlement.aggregate({
        where: {
          referee: { association_id: associationId },
          status: "pending",
        },
        _sum: { amount: true },
      }),

      // 4) 최근 30일 배정 수
      prisma.refereeAssignment.count({
        where: {
          referee: { association_id: associationId },
          assigned_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // 자격증 검증율 계산
    const verifiedCount = certStats.find((s) => s.verified === true)?._count ?? 0;
    const unverifiedCount = certStats.find((s) => s.verified === false)?._count ?? 0;
    const totalCerts = verifiedCount + unverifiedCount;
    const verificationRate = totalCerts > 0
      ? Math.round((verifiedCount / totalCerts) * 100)
      : 0;

    return apiSuccess({
      total_referees: totalReferees,
      total_certificates: totalCerts,
      verified_certificates: verifiedCount,
      verification_rate: verificationRate,
      unpaid_total: unpaidTotal._sum.amount ?? 0,
      recent_assignments_30d: recentAssignments,
    });
  } catch {
    return apiError("대시보드 정보를 불러올 수 없습니다.", 500);
  }
}
