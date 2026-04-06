import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { verifyCode } from "@/lib/security/verify-store";

/**
 * POST /api/web/verify/complete
 * 인증 완료 → 이메일/전화번호 저장
 */
export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  const body = (await req.json()) as {
    email?: string;
    phone?: string;
    code?: string;
  };

  const updates: Record<string, string> = {};

  // 전화번호 인증 (SOLAPI SMS)
  if (body.phone) {
    const phone = body.phone.replace(/[^0-9]/g, "");
    if (!phone.match(/^01[016789]\d{7,8}$/)) {
      return apiError("올바른 전화번호를 입력해주세요.", 400);
    }
    if (!body.code) {
      return apiError("인증 코드를 입력해주세요.", 400);
    }
    const valid = await verifyCode(ctx.userId, phone, body.code);
    if (!valid) {
      return apiError("인증 코드가 올바르지 않거나 만료되었습니다.", 400);
    }

    // 중복 확인
    const existing = await prisma.user.findFirst({
      where: { phone, id: { not: ctx.userId } },
    });
    if (existing) {
      return apiError("이미 등록된 전화번호입니다.", 409);
    }
    updates.phone = phone;
  }

  // 이메일
  if (body.email) {
    const email = body.email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: { email, id: { not: ctx.userId } },
    });
    if (existing) {
      return apiError("이미 등록된 이메일입니다.", 409);
    }
    updates.email = email;
  }

  if (Object.keys(updates).length === 0) {
    return apiError("변경할 정보가 없습니다.", 400);
  }

  await prisma.user.update({
    where: { id: ctx.userId },
    data: updates,
  });

  return apiSuccess({ message: "인증이 완료되었습니다." });
});
