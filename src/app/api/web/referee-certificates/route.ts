import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { refereeCertificateCreateSchema } from "@/lib/validation/referee";

/**
 * /api/web/referee-certificates
 *
 * 본인 심판 자격증 목록 + 생성.
 * - referee_id는 서버에서 세션 → 본인 Referee 조회로 강제 주입 (IDOR 방지)
 * - verified / verified_at / verified_by_admin_id는 본인이 입력/수정 불가 (스키마에서 제외)
 */

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET — 본인 자격증 목록
// ─────────────────────────────────────────────────────────────
// 주의: 쿼리 스트링으로 referee_id가 와도 무시한다. 본인 자격증 고정.
export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  try {
    // 본인 Referee를 조회 — 없으면 400
    const referee = await prisma.referee.findUnique({
      where: { user_id: ctx.userId },
      select: { id: true },
    });
    if (!referee) {
      return apiError(
        "먼저 심판 프로필을 등록하세요.",
        400,
        "NO_REFEREE_PROFILE",
      );
    }

    const items = await prisma.refereeCertificate.findMany({
      where: { referee_id: referee.id },
      orderBy: { issued_at: "desc" },
    });

    return apiSuccess({ items });
  } catch {
    return apiError("자격증 목록을 불러올 수 없습니다.", 500);
  }
});

// ─────────────────────────────────────────────────────────────
// POST — 본인 자격증 추가
// ─────────────────────────────────────────────────────────────
export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("유효하지 않은 요청입니다.", 400);
  }

  const parsed = refereeCertificateCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 값입니다.", 400, "VALIDATION_ERROR");
  }
  const data = parsed.data;

  try {
    // 본인 Referee 조회 — referee_id 서버 주입
    const referee = await prisma.referee.findUnique({
      where: { user_id: ctx.userId },
      select: { id: true },
    });
    if (!referee) {
      return apiError(
        "먼저 심판 프로필을 등록하세요.",
        400,
        "NO_REFEREE_PROFILE",
      );
    }

    // verified 계열은 스키마에 없으므로 자동으로 Prisma default(false) 적용
    const created = await prisma.refereeCertificate.create({
      data: {
        referee_id: referee.id,
        cert_type: data.cert_type,
        cert_grade: data.cert_grade,
        issuer: data.issuer,
        cert_number: data.cert_number ?? null,
        issued_at: new Date(data.issued_at),
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
        // verified 계열은 명시적으로 false/null (보안 명확화)
        verified: false,
        verified_at: null,
        verified_by_admin_id: null,
      },
    });

    return apiSuccess(created, 201);
  } catch {
    return apiError("자격증을 추가할 수 없습니다.", 500);
  }
});
