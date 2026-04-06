import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { storeCode } from "@/lib/security/verify-store";
import { SolapiMessageService } from "solapi";

const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

/**
 * POST /api/web/verify/send-code
 * 전화번호 인증 코드 발송 (SOLAPI SMS)
 */
export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  const body = (await req.json()) as { phone?: string };
  const phone = body.phone?.replace(/[^0-9]/g, "");

  if (!phone || !phone.match(/^01[016789]\d{7,8}$/)) {
    return apiError("올바른 전화번호를 입력해주세요.", 400);
  }

  // 6자리 랜덤 코드 생성
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // 코드 저장 (5분 TTL)
  await storeCode(ctx.userId, phone, code);

  // SMS 발송
  try {
    await messageService.sendOne({
      to: phone,
      from: process.env.SOLAPI_SENDER!,
      text: `[MYBDR] 인증 코드: ${code}`,
    });
  } catch (e) {
    console.error("[SOLAPI] SMS 발송 실패:", e);
    return apiError("SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.", 500);
  }

  return apiSuccess({ message: "인증 코드를 발송했습니다." });
});
