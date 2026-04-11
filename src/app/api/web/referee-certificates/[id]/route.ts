import { NextRequest } from "next/server";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { refereeCertificateUpdateSchema } from "@/lib/validation/referee";

/**
 * /api/web/referee-certificates/[id]
 *
 * 본인 자격증 단건 조회/수정/삭제.
 * - IDOR: certificate.referee.user_id === ctx.userId 반드시 확인
 * - verified 계열은 본인 수정 불가 (스키마 제외 → 요청에 포함되어도 무시)
 */

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

// URL 파라미터(string)를 BigInt로 안전 변환
function parseId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

// 본인 자격증 권한 검증 후 해당 자격증 로드 (공통)
async function loadOwnedCertificate(
  userId: bigint,
  certId: bigint,
) {
  return prisma.refereeCertificate.findFirst({
    where: {
      id: certId,
      // IDOR: referee.user_id 일치 여부를 WHERE에서 바로 걸러냄
      referee: { user_id: userId },
    },
    include: {
      referee: { select: { id: true, user_id: true } },
    },
  });
}

// ─────────────────────────────────────────────────────────────
// GET — 본인 자격증 단건
// ─────────────────────────────────────────────────────────────
export const GET = withWebAuth(
  async (_req: NextRequest, routeCtx: RouteCtx, ctx: WebAuthContext) => {
    const { id } = await routeCtx.params;
    const certId = parseId(id);
    if (!certId) return apiError("Not found", 404, "NOT_FOUND");

    try {
      const cert = await loadOwnedCertificate(ctx.userId, certId);
      if (!cert) return apiError("Not found", 404, "NOT_FOUND");

      return apiSuccess(cert);
    } catch {
      return apiError("자격증을 불러올 수 없습니다.", 500);
    }
  },
);

// ─────────────────────────────────────────────────────────────
// PUT — 본인 자격증 수정 (verified 필드는 절대 수정 불가)
// ─────────────────────────────────────────────────────────────
export const PUT = withWebAuth(
  async (req: NextRequest, routeCtx: RouteCtx, ctx: WebAuthContext) => {
    const { id } = await routeCtx.params;
    const certId = parseId(id);
    if (!certId) return apiError("Not found", 404, "NOT_FOUND");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("유효하지 않은 요청입니다.", 400);
    }

    const parsed = refereeCertificateUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("유효하지 않은 값입니다.", 400, "VALIDATION_ERROR");
    }
    const data = parsed.data;

    try {
      // 소유권 확인 (IDOR)
      const existing = await loadOwnedCertificate(ctx.userId, certId);
      if (!existing) return apiError("Not found", 404, "NOT_FOUND");

      // 업데이트 대상 필드만 추출 — verified는 의도적으로 건드리지 않음
      const updateData: Record<string, unknown> = {};
      if (data.cert_type !== undefined) updateData.cert_type = data.cert_type;
      if (data.cert_grade !== undefined) updateData.cert_grade = data.cert_grade;
      if (data.issuer !== undefined) updateData.issuer = data.issuer;
      if (data.cert_number !== undefined)
        updateData.cert_number = data.cert_number;
      if (data.issued_at !== undefined)
        updateData.issued_at = new Date(data.issued_at);
      if (data.expires_at !== undefined)
        updateData.expires_at = data.expires_at
          ? new Date(data.expires_at)
          : null;

      const updated = await prisma.refereeCertificate.update({
        where: { id: certId },
        data: updateData,
      });

      return apiSuccess(updated);
    } catch {
      return apiError("자격증을 수정할 수 없습니다.", 500);
    }
  },
);

// ─────────────────────────────────────────────────────────────
// DELETE — 본인 자격증 삭제
// ─────────────────────────────────────────────────────────────
export const DELETE = withWebAuth(
  async (_req: NextRequest, routeCtx: RouteCtx, ctx: WebAuthContext) => {
    const { id } = await routeCtx.params;
    const certId = parseId(id);
    if (!certId) return apiError("Not found", 404, "NOT_FOUND");

    try {
      // 소유권 확인 (IDOR)
      const existing = await loadOwnedCertificate(ctx.userId, certId);
      if (!existing) return apiError("Not found", 404, "NOT_FOUND");

      await prisma.refereeCertificate.delete({ where: { id: certId } });
      return apiSuccess({ deleted: true });
    } catch {
      return apiError("자격증을 삭제할 수 없습니다.", 500);
    }
  },
);
