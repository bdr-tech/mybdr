/**
 * 코트 대관 결제 successUrl 콜백 (Phase B-3)
 *
 * 이유:
 *   - 토스 결제창 성공 후 successUrl 로 GET 콜백이 들어옴.
 *   - 기존 `/api/web/payments/confirm` 은 Plan 전용이므로 CourtBooking 전용으로 분리.
 *   - 신뢰 경계: 클라이언트가 보낸 paymentKey/orderId/amount 는 위변조 가능 → 서버에서 3중 검증.
 *
 * 흐름:
 *   1. query 파싱 (paymentKey, orderId, amount, courtId(redirect용))
 *   2. orderId 파싱: BOOKING-{bookingId}-{userId}-{ts} → bookingId, userId 추출
 *   3. court_bookings.findUnique → status="pending" 검증
 *   4. 3중 검증: booking.user_id === ctx.userId === orderId.userId,
 *               booking.final_amount === query.amount === toss API 응답 totalAmount
 *   5. Toss confirmPayment API 호출
 *   6. 트랜잭션: payments INSERT + court_bookings UPDATE (status=confirmed, payment_id)
 *   7. 성공 → /profile/bookings?just_paid=1
 *   8. 실패 → /courts/{courtId}/booking/payment-fail?reason=xxx (검증 실패 시 토스 cancel 보상)
 */
import { NextResponse } from "next/server";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

// 실패 시 redirect URL 생성 헬퍼
// 이유: courtId 모를 때(orderId 파싱 실패 등)는 /profile/bookings 로 fallback.
function failRedirect(reqUrl: string, courtId: string | null, reason: string) {
  if (courtId) {
    return NextResponse.redirect(
      new URL(
        `/courts/${courtId}/booking/payment-fail?reason=${encodeURIComponent(reason)}`,
        reqUrl,
      ),
    );
  }
  return NextResponse.redirect(
    new URL(`/profile/bookings?fail=${encodeURIComponent(reason)}`, reqUrl),
  );
}

// 토스 결제 취소 보상 호출
// 이유: 토스 confirm 까지 성공했지만 DB 검증/저장에 실패한 경우 결제만 살아있는 상태 방지.
async function tossCancelCompensate(
  paymentKey: string,
  secretKey: string,
  cancelReason: string,
) {
  try {
    const encoded = Buffer.from(`${secretKey}:`).toString("base64");
    await fetch(
      `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encoded}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cancelReason }),
      },
    );
  } catch (err) {
    // 보상 실패는 로그만 남김 (이중 실패 시 운영자가 수동 처리)
    console.error("[Toss Cancel Compensate Error]", err);
  }
}

export const GET = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  const { searchParams } = new URL(req.url);
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amountStr = searchParams.get("amount");

  // ---- 1) 필수 파라미터 검증 ----
  if (!paymentKey || !orderId || !amountStr) {
    return failRedirect(req.url, null, "missing_params");
  }

  const amount = parseInt(amountStr, 10);
  if (!Number.isFinite(amount) || amount <= 0) {
    return failRedirect(req.url, null, "invalid_amount");
  }

  // ---- 2) orderId 파싱: BOOKING-{bookingId}-{userId}-{ts} ----
  // 이유: bookingId/userId 를 orderId 에서 직접 뽑아 query 변조 차단.
  const parts = orderId.split("-");
  if (parts.length !== 4 || parts[0] !== "BOOKING") {
    return failRedirect(req.url, null, "invalid_order_id");
  }

  let bookingId: bigint;
  let orderUserId: bigint;
  try {
    bookingId = BigInt(parts[1]);
    orderUserId = BigInt(parts[2]);
  } catch {
    return failRedirect(req.url, null, "invalid_order_id");
  }

  // ---- 3) booking 조회 ----
  const booking = await prisma.court_bookings
    .findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        court_info_id: true,
        user_id: true,
        final_amount: true,
        status: true,
        payment_id: true,
      },
    })
    .catch(() => null);

  if (!booking) {
    return failRedirect(req.url, null, "booking_not_found");
  }

  // courtId 확보 — 이후 fail redirect 에서 사용
  const courtIdStr = booking.court_info_id.toString();

  // ---- 4) 3중 보안 게이트 ----
  // 4-1) 세션 user === orderId user === booking owner
  if (
    booking.user_id !== ctx.userId ||
    orderUserId !== ctx.userId
  ) {
    return failRedirect(req.url, courtIdStr, "owner_mismatch");
  }

  // 4-2) 이미 결제 완료된 booking 재결제 차단
  if (booking.status !== "pending" || booking.payment_id !== null) {
    return failRedirect(req.url, courtIdStr, "already_processed");
  }

  // 4-3) DB final_amount === query amount
  const dbAmount = Number(booking.final_amount);
  if (dbAmount !== amount) {
    return failRedirect(req.url, courtIdStr, "amount_mismatch");
  }

  // ---- 5) 토스 confirm API 호출 ----
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return failRedirect(req.url, courtIdStr, "config_error");
  }

  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  const tossRes = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    },
  );

  if (!tossRes.ok) {
    const errBody = await tossRes.json().catch(() => ({}));
    console.error("[Toss Confirm Booking Error]", errBody);
    const code = (errBody as { code?: string }).code ?? "toss_error";
    return failRedirect(req.url, courtIdStr, code);
  }

  const tossData = (await tossRes.json()) as {
    totalAmount?: number;
    method?: string | null;
    [k: string]: unknown;
  };

  // 4-4) 토스 응답 totalAmount === amount (최종 검증)
  // 이유: 토스가 우리가 보낸 amount 로 confirm 했더라도 응답의 totalAmount 와 재대조.
  if (typeof tossData.totalAmount === "number" && tossData.totalAmount !== amount) {
    await tossCancelCompensate(paymentKey, secretKey, "금액 불일치");
    return failRedirect(req.url, courtIdStr, "verification_failed");
  }

  // ---- 6) DB 트랜잭션 ----
  try {
    await prisma.$transaction(async (tx) => {
      // payments INSERT — Plan 결제와 동일 구조, payable_type 만 "CourtBooking"
      const created = await tx.payments.create({
        data: {
          user_id: ctx.userId,
          payable_type: "CourtBooking",
          payable_id: bookingId,
          payment_code: orderId,
          order_id: orderId,
          payment_key: paymentKey,
          toss_payment_key: paymentKey,
          toss_order_id: orderId,
          amount: amount,
          final_amount: amount,
          currency: "KRW",
          payment_method: tossData.method ?? null,
          status: "paid",
          paid_at: new Date(),
          toss_response: tossData as object,
          created_at: new Date(),
          updated_at: new Date(),
        },
        select: { id: true },
      });

      // court_bookings UPDATE — 동시성 가드: where 에 status="pending" 포함
      // 이유: 같은 booking 에 대해 두 번 콜백이 들어와도 한 번만 confirmed 로 전환.
      const updateRes = await tx.court_bookings.updateMany({
        where: { id: bookingId, status: "pending", payment_id: null },
        data: {
          status: "confirmed",
          payment_id: created.id,
        },
      });

      if (updateRes.count !== 1) {
        // 다른 요청이 먼저 처리한 경우 — 트랜잭션 롤백 유발
        throw new Error("BOOKING_RACE");
      }
    });
  } catch (err) {
    console.error("[Booking Payment DB Error]", err);
    // DB 저장 실패 → 토스 결제 취소 보상
    await tossCancelCompensate(
      paymentKey,
      secretKey,
      "DB 저장 실패",
    );
    return failRedirect(req.url, courtIdStr, "db_error");
  }

  // ---- 7) 성공 redirect ----
  return NextResponse.redirect(
    new URL(`/profile/bookings?just_paid=1`, req.url),
  );
});
