import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { verifyCode } from "@/lib/security/verify-store";

/**
 * POST /api/web/verify/confirm-code
 * 전화번호 인증 코드 확인
 */
export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  const body = await req.json() as { phone?: string; code?: string };
  const phone = body.phone?.replace(/[^0-9]/g, "");
  const code = body.code?.trim();

  if (!phone || !code) {
    return apiError("전화번호와 인증번호를 입력해주세요.", 400);
  }

  // verify-store에서 검증 (Redis 또는 인메모리, 일회성)
  const valid = await verifyCode(ctx.userId, phone, code);
  if (!valid) {
    return apiError("인증번호가 올바르지 않거나 만료되었습니다.", 400);
  }

  return apiSuccess({ verified: true });
});
