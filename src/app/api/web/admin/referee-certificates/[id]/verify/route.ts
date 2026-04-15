import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";

/**
 * /api/web/admin/referee-certificates/[id]/verify
 *
 * 자격증 검증 토글 (관리자 전용).
 * - PATCH: verified 상태를 true/false로 변경
 * - IDOR 방지: 해당 자격증의 심판이 관리자 소속 협회인지 확인
 *
 * body: { verified: boolean }
 */

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    const { id } = await params;
    const certId = BigInt(id);

    // body 파싱
    let body: { verified?: boolean };
    try {
      body = await req.json();
    } catch {
      return apiError("유효하지 않은 요청입니다.", 400);
    }

    if (typeof body.verified !== "boolean") {
      return apiError("verified 필드는 boolean이어야 합니다.", 400, "VALIDATION_ERROR");
    }

    // 자격증 조회 + 심판의 소속 협회 확인 (IDOR 방지)
    const cert = await prisma.refereeCertificate.findUnique({
      where: { id: certId },
      include: {
        referee: {
          select: { association_id: true },
        },
      },
    });

    if (!cert) {
      return apiError("자격증을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // IDOR 방지: 심판의 소속 협회가 관리자의 협회와 일치하는지 확인
    if (!cert.referee.association_id || cert.referee.association_id !== admin.associationId) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 검증 상태 업데이트
    const updated = await prisma.refereeCertificate.update({
      where: { id: certId },
      data: {
        verified: body.verified,
        verified_at: body.verified ? new Date() : null,
        verified_by_admin_id: body.verified ? admin.userId : null,
      },
    });

    return apiSuccess({ certificate: updated });
  } catch {
    return apiError("자격증 검증 상태를 변경할 수 없습니다.", 500);
  }
}
