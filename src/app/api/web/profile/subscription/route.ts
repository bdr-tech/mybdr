/**
 * GET /api/web/profile/subscription — 구독 현황 조회
 * DELETE /api/web/profile/subscription — 구독 해지
 *
 * 해지 규칙:
 * - status를 "cancelled"로 변경
 * - expires_at까지는 계속 이용 가능 (즉시 해지가 아닌 만료일 기준)
 */

import { NextRequest } from "next/server";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, notFound } from "@/lib/api/response";

// GET: 내 구독 현황 목록
export const GET = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  // 본인 구독 전체 조회 (활성 + 취소 모두)
  const subscriptions = await prisma.user_subscriptions.findMany({
    where: { user_id: ctx.userId },
    orderBy: { created_at: "desc" },
    include: {
      plans: {
        select: {
          id: true,
          name: true,
          description: true,
          plan_type: true,
          price: true,
          feature_key: true,
        },
      },
    },
  });

  const items = subscriptions.map((s) => ({
    id: s.id.toString(),
    plan: {
      id: s.plans.id.toString(),
      name: s.plans.name,
      description: s.plans.description,
      plan_type: s.plans.plan_type,
      price: s.plans.price,
      feature_key: s.plans.feature_key,
    },
    status: s.status,
    feature_key: s.feature_key,
    started_at: s.started_at.toISOString(),
    expires_at: s.expires_at?.toISOString() ?? null,
    // 만료일이 미래이고 active면 이용 가능
    is_usable:
      s.status === "active" ||
      (s.status === "cancelled" &&
        s.expires_at != null &&
        s.expires_at.getTime() > Date.now()),
    created_at: s.created_at.toISOString(),
  }));

  return apiSuccess({ subscriptions: items });
});

// DELETE: 구독 해지
export const DELETE = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  let body: { subscription_id?: string };
  try {
    body = await (req as NextRequest).json();
  } catch {
    return apiError("요청 본문이 올바르지 않습니다.", 400, "INVALID_BODY");
  }

  if (!body.subscription_id) {
    return apiError("subscription_id가 필요합니다.", 400, "MISSING_FIELD");
  }

  const subscriptionId = BigInt(body.subscription_id);

  // 구독 조회
  const subscription = await prisma.user_subscriptions.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) return notFound("구독을 찾을 수 없습니다.");

  // 본인 구독인지 확인 (IDOR 방지)
  if (subscription.user_id !== ctx.userId) {
    return apiError("본인의 구독만 해지할 수 있습니다.", 403, "FORBIDDEN");
  }

  // 이미 취소된 건인지 확인
  if (subscription.status === "cancelled") {
    return apiError("이미 해지된 구독입니다.", 400, "ALREADY_CANCELLED");
  }

  // 상태를 cancelled로 변경 (만료일까지는 이용 가능)
  await prisma.user_subscriptions.update({
    where: { id: subscriptionId },
    data: {
      status: "cancelled",
      updated_at: new Date(),
    },
  });

  return apiSuccess({
    message: "구독이 해지되었습니다. 만료일까지 이용 가능합니다.",
    expires_at: subscription.expires_at?.toISOString() ?? null,
  });
});
