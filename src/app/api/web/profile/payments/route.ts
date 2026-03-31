/**
 * GET /api/web/profile/payments
 * 내 결제 내역 목록 API
 *
 * - 본인 결제만 조회 (user_id 기반)
 * - 최신순 정렬, 페이지네이션 지원
 * - 환불 가능 여부(7일 이내)도 함께 반환
 */

import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/response";

// 환불 가능 기한: 7일
const REFUND_DEADLINE_MS = 7 * 24 * 60 * 60 * 1000;

export const GET = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  // 본인 결제 내역 조회 (최신순)
  const [payments, total] = await Promise.all([
    prisma.payments.findMany({
      where: { user_id: ctx.userId },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        order_id: true,
        payable_type: true,
        amount: true,
        final_amount: true,
        payment_method: true,
        status: true,
        paid_at: true,
        refunded_at: true,
        refund_amount: true,
        created_at: true,
        description: true,
      },
    }),
    prisma.payments.count({
      where: { user_id: ctx.userId },
    }),
  ]);

  // 각 결제 건에 환불 가능 여부를 추가
  const now = Date.now();
  const items = payments.map((p) => {
    const paidAt = p.paid_at ?? p.created_at;
    const canRefund =
      p.status === "paid" && now - paidAt.getTime() < REFUND_DEADLINE_MS;

    return {
      id: p.id.toString(),
      order_id: p.order_id,
      payable_type: p.payable_type,
      amount: Number(p.amount),
      final_amount: Number(p.final_amount),
      payment_method: p.payment_method,
      status: p.status,
      paid_at: p.paid_at?.toISOString() ?? null,
      refunded_at: p.refunded_at?.toISOString() ?? null,
      refund_amount: p.refund_amount ? Number(p.refund_amount) : null,
      created_at: p.created_at.toISOString(),
      description: p.description,
      can_refund: canRefund,
    };
  });

  return apiSuccess({
    payments: items,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});
