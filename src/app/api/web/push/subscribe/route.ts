import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { apiSuccess, apiError } from "@/lib/api/response";

// POST /api/web/push/subscribe — 푸시 구독 저장
export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const subscription = await req.json();

    if (!subscription?.endpoint) {
      return apiError("잘못된 구독 정보입니다.", 400);
    }

    await prisma.user.update({
      where: { id: ctx.userId },
      data: { push_subscription: subscription },
    });

    return apiSuccess({ subscribed: true });
  } catch {
    return apiError("구독 저장 실패", 500);
  }
});

// DELETE /api/web/push/subscribe — 푸시 구독 해제
export const DELETE = withWebAuth(async (_req: Request, ctx: WebAuthContext) => {
  await prisma.user.update({
    where: { id: ctx.userId },
    data: { push_subscription: Prisma.JsonNull },
  });

  return apiSuccess({ unsubscribed: true });
});
