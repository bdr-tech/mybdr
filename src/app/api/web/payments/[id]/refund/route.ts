/**
 * POST /api/web/payments/[id]/refund
 * 결제 환불 API
 *
 * 규칙:
 * - 본인 결제만 환불 가능 (IDOR 방지)
 * - 결제 후 7일 이내만 환불 가능
 * - 이미 환불된 건은 재환불 불가
 * - 토스페이먼츠 API 키가 없으면 DB 상태만 변경 (개발용)
 */

import { NextRequest } from "next/server";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, notFound, forbidden } from "@/lib/api/response";

// 환불 가능 기한: 결제 후 7일
const REFUND_DEADLINE_MS = 7 * 24 * 60 * 60 * 1000;

export const POST = withWebAuth(
  async (
    req: NextRequest,
    routeCtx: { params: Promise<{ id: string }> },
    ctx: WebAuthContext
  ) => {
    const { id } = await routeCtx.params;
    const paymentId = BigInt(id);

    // 결제 조회
    const payment = await prisma.payments.findUnique({
      where: { id: paymentId },
    });

    if (!payment) return notFound("결제 내역을 찾을 수 없습니다.");

    // 본인 결제인지 확인 (IDOR 방지)
    if (payment.user_id !== ctx.userId) {
      return forbidden("본인의 결제만 환불할 수 있습니다.");
    }

    // 이미 환불된 건인지 확인
    if (payment.status === "refunded") {
      return apiError("이미 환불된 결제입니다.", 400, "ALREADY_REFUNDED");
    }

    // paid 상태만 환불 가능
    if (payment.status !== "paid") {
      return apiError("환불할 수 없는 결제 상태입니다.", 400, "INVALID_STATUS");
    }

    // 7일 이내 환불 가능 여부 확인
    const paidAt = payment.paid_at ?? payment.created_at;
    const elapsed = Date.now() - paidAt.getTime();
    if (elapsed > REFUND_DEADLINE_MS) {
      return apiError(
        "결제 후 7일이 지나 환불이 불가합니다.",
        400,
        "REFUND_EXPIRED"
      );
    }

    // 토스페이먼츠 환불 시도 (API 키가 있을 때만)
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (secretKey && payment.toss_payment_key) {
      try {
        const encoded = Buffer.from(`${secretKey}:`).toString("base64");
        const tossRes = await fetch(
          `https://api.tosspayments.com/v1/payments/${payment.toss_payment_key}/cancel`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${encoded}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cancelReason: "사용자 환불 요청" }),
          }
        );

        if (!tossRes.ok) {
          const errBody = await tossRes.json().catch(() => ({}));
          console.error("[Toss Refund Error]", errBody);
          return apiError("토스페이먼츠 환불에 실패했습니다.", 500, "TOSS_REFUND_FAILED");
        }
      } catch (err) {
        console.error("[Toss Refund Exception]", err);
        return apiError("환불 처리 중 오류가 발생했습니다.", 500, "REFUND_ERROR");
      }
    }

    // DB 상태 변경: payments → refunded
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      // 결제 상태를 환불로 변경
      await tx.payments.update({
        where: { id: paymentId },
        data: {
          status: "refunded",
          refunded_at: now,
          refund_amount: payment.final_amount,
          refund_reason: "사용자 환불 요청",
          refund_status: "completed",
          updated_at: now,
        },
      });

      // 연관 구독이 있으면 cancelled로 변경
      if (payment.order_id) {
        await tx.user_subscriptions.updateMany({
          where: {
            user_id: ctx.userId,
            order_id: payment.order_id,
            status: "active",
          },
          data: {
            status: "cancelled",
            updated_at: now,
          },
        });
      }
    });

    return apiSuccess({ message: "환불이 완료되었습니다." });
  }
);
