import { apiSuccess, apiError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";

/**
 * /api/web/admin/bulk-verify/confirm
 *
 * Excel 일괄 검증 확정.
 * - POST: preview에서 matched된 certificate_ids를 받아 일괄 검증 처리
 * - TOCTOU 방지: 각 자격증의 심판 소속 협회를 재확인
 * - $transaction으로 원자적 처리
 *
 * body: { certificate_ids: number[] }
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // body 파싱
    let body: { certificate_ids?: number[] };
    try {
      body = await req.json();
    } catch {
      return apiError("유효하지 않은 요청입니다.", 400);
    }

    const { certificate_ids } = body;
    // 배열 형태 검증 + 각 원소가 정수인지 확인 (문자열/소수점 등 차단)
    if (
      !Array.isArray(certificate_ids) ||
      certificate_ids.length === 0 ||
      !certificate_ids.every((id) => typeof id === "number" && Number.isInteger(id))
    ) {
      return apiError("certificate_ids는 정수 배열이어야 합니다.", 400, "VALIDATION_ERROR");
    }

    // 최대 500개 제한
    if (certificate_ids.length > 500) {
      return apiError("한 번에 최대 500개까지 처리 가능합니다.", 400, "TOO_MANY_IDS");
    }

    // $transaction으로 원자적 처리
    const result = await prisma.$transaction(async (tx) => {
      let verified = 0;
      let skipped = 0;
      const errors: { id: number; reason: string }[] = [];

      for (const certIdNum of certificate_ids) {
        const certId = BigInt(certIdNum);

        // TOCTOU 방지: 자격증 + 심판 소속 협회 재확인
        const cert = await tx.refereeCertificate.findUnique({
          where: { id: certId },
          include: {
            referee: {
              select: { association_id: true },
            },
          },
        });

        if (!cert) {
          errors.push({ id: certIdNum, reason: "자격증을 찾을 수 없습니다." });
          continue;
        }

        // 소속 협회 불일치 → 건너뜀 (IDOR 방지)
        if (!cert.referee.association_id || cert.referee.association_id !== admin.associationId) {
          errors.push({ id: certIdNum, reason: "소속 협회가 일치하지 않습니다." });
          continue;
        }

        // 이미 검증됨 → 건너뜀
        if (cert.verified) {
          skipped++;
          continue;
        }

        // 검증 처리
        await tx.refereeCertificate.update({
          where: { id: certId },
          data: {
            verified: true,
            verified_at: new Date(),
            verified_by_admin_id: admin.userId,
          },
        });
        verified++;
      }

      return { verified, skipped, errors };
    });

    return apiSuccess({
      verified: result.verified,
      skipped: result.skipped,
      errors: result.errors,
      total_requested: certificate_ids.length,
    });
  } catch {
    return apiError("일괄 검증 처리 중 오류가 발생했습니다.", 500);
  }
}
