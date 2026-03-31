import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { storeCode } from "@/lib/security/verify-store";

/**
 * POST /api/web/verify/send-code
 * 전화번호 인증 코드 발송
 *
 * 개발 환경: 코드를 응답에 포함 (SMS 발송 없이 테스트)
 * 프로덕션: Naver SENS 등 SMS API 연동
 */
export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  const body = await req.json() as { phone?: string };
  const phone = body.phone?.replace(/[^0-9]/g, "");

  if (!phone || !phone.match(/^01[016789]\d{7,8}$/)) {
    return apiError("올바른 전화번호를 입력해주세요.", 400);
  }

  // 6자리 랜덤 코드 생성
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Redis(있으면) 또는 인메모리에 코드 저장 (5분 TTL)
  await storeCode(ctx.userId, phone, code);

  // TODO: 프로덕션에서 SMS 발송
  // await sendSMS(phone, `[BDR] 인증 코드: ${code}`);

  const isDev = process.env.NODE_ENV !== "production";
  return apiSuccess({
    message: "인증 코드를 발송했습니다.",
    ...(isDev && { code }), // 개발 환경에서만 코드 노출
  });
});
