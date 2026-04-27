/* ============================================================
 * /api/web/bookings/[id] — 단일 예약 조회/취소 (Phase B)
 *
 * GET    : 본인 예약 상세 (또는 운영자가 자기 코트 예약 조회)
 * DELETE : 예약 취소 (예약자 본인 OR 해당 코트 운영자)
 *
 * 권한:
 *   - 예약자 본인 → 자기 예약 모두 조회/취소 가능
 *   - 코트 운영자 → 자기 코트의 모든 예약 조회/취소 가능 (강제 취소 + 사유 기록)
 *
 * Phase B 환불 정책 (B-7):
 *   - 무료 예약(payment_id null OR final_amount=0): status="cancelled"만 변경
 *   - 유료 예약: refund-policy.ts 룰 → 토스 cancel API → DB 트랜잭션
 *     • 운영자 취소 시 ratio=1.0 강제 (운영 사정으로 인한 사용자 보호)
 *     • ratio=0(당일): 토스 호출 X, DB만 cancelled
 *     • ratio>0: 토스 cancel(cancelAmount=refund.amount) 성공 시
 *                court_bookings + payments 동시 갱신 (트랜잭션)
 *     • 토스 실패: 500 응답, DB 변경 X (트랜잭션 밖이라 자동 롤백 안전)
 * ============================================================ */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { isCourtManager } from "@/lib/courts/court-manager-guard";
import { calcRefundAmount } from "@/lib/courts/refund-policy";

// 취소 요청 스키마
const CancelSchema = z.object({
  reason: z.string().max(200).optional(),
});

// 예약 + 권한 컨텍스트 조회 (재사용)
async function loadBookingWithPermission(
  bookingId: bigint,
  userId: bigint
): Promise<
  | { ok: true; booking: NonNullable<Awaited<ReturnType<typeof findBooking>>>; isOwner: boolean; isManager: boolean }
  | { ok: false; status: number; code: string; message: string }
> {
  const booking = await findBooking(bookingId);
  if (!booking) {
    return { ok: false, status: 404, code: "NOT_FOUND", message: "존재하지 않는 예약입니다" };
  }
  const isOwner = booking.user_id === userId;
  // 본인 예약이 아닐 때만 운영자 검사 (DB 쿼리 절약)
  const isManager = isOwner ? false : await isCourtManager(userId, booking.court_info_id);
  if (!isOwner && !isManager) {
    return { ok: false, status: 403, code: "FORBIDDEN", message: "이 예약을 처리할 권한이 없습니다" };
  }
  return { ok: true, booking, isOwner, isManager };
}

async function findBooking(bookingId: bigint) {
  return prisma.court_bookings.findUnique({
    where: { id: bookingId },
    include: {
      court: { select: { id: true, name: true, address: true, city: true, district: true } },
      user: { select: { id: true, nickname: true, name: true } },
    },
  });
}

// ─────────────────────────────────────────────
// GET — 단일 예약 조회
// ─────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError("유효하지 않은 예약 ID입니다", 400);
  const bookingId = BigInt(id);
  const userId = BigInt(session.sub);

  const result = await loadBookingWithPermission(bookingId, userId);
  if (!result.ok) return apiError(result.message, result.status, result.code);

  const b = result.booking;
  return apiSuccess({
    booking: {
      id: b.id.toString(),
      start_at: b.start_at.toISOString(),
      end_at: b.end_at.toISOString(),
      duration_hours: b.duration_hours,
      purpose: b.purpose,
      status: b.status,
      amount: Number(b.amount),
      final_amount: Number(b.final_amount),
      expected_count: b.expected_count,
      cancellation_reason: b.cancellation_reason,
      cancelled_at: b.cancelled_at?.toISOString() ?? null,
      created_at: b.created_at.toISOString(),
      court: {
        id: b.court.id.toString(),
        name: b.court.name,
        address: b.court.address,
        city: b.court.city,
        district: b.court.district,
      },
      user: {
        id: b.user.id.toString(),
        nickname: b.user.nickname,
        name: b.user.name,
      },
      // 권한 컨텍스트 (UI 분기용)
      can_cancel: result.isOwner || result.isManager,
      is_manager_view: result.isManager,
    },
  });
}

// ─────────────────────────────────────────────
// DELETE — 예약 취소 (Phase B 환불 정책 적용)
//   Body: { reason? } (선택, 최대 200자)
// ─────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError("유효하지 않은 예약 ID입니다", 400);
  const bookingId = BigInt(id);
  const userId = BigInt(session.sub);

  // Body 파싱 (DELETE 도 body 허용 — Next.js Edge/Node 모두 가능)
  let reason: string | undefined;
  try {
    const body = await req.json().catch(() => null);
    if (body) {
      const parsed = CancelSchema.safeParse(body);
      if (parsed.success) reason = parsed.data.reason;
    }
  } catch {
    // body 없는 DELETE 도 허용 — 이유 미기재 취소
  }

  const result = await loadBookingWithPermission(bookingId, userId);
  if (!result.ok) return apiError(result.message, result.status, result.code);

  const booking = result.booking;

  // 이미 취소/환불/완료된 예약은 재취소 불가
  if (
    booking.status === "cancelled" ||
    booking.status === "refunded" ||
    booking.status === "completed"
  ) {
    return apiError(
      "이미 종료된 예약은 취소할 수 없습니다",
      400,
      "ALREADY_TERMINATED"
    );
  }

  // 시작 시간 이후 취소 불가 — 시작 시각이 지난 예약은 취소·환불 모두 의미 없음
  // 이유: 코트 사용이 이미 진행되었거나 노쇼 상태이므로 운영자 차원 처리(완료 처리)로 분리해야 한다.
  const now = new Date();
  if (now.getTime() >= booking.start_at.getTime()) {
    return apiError(
      "이미 시작된 예약은 취소할 수 없습니다",
      409,
      "ALREADY_STARTED"
    );
  }

  // 취소 사유 — body에 없으면 권한별 기본값
  const cancelReason =
    reason ?? (result.isManager ? "운영자 취소" : "예약자 취소");

  // ─────────────────────────────────────────────
  // 분기 A: 무료 예약 (payment_id null 또는 final_amount=0)
  //   토스 호출 불필요 → status="cancelled"만 변경
  // ─────────────────────────────────────────────
  const finalAmountNum = Number(booking.final_amount);
  const isFree = booking.payment_id === null || finalAmountNum === 0;

  if (isFree) {
    const updated = await prisma.court_bookings.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
        cancellation_reason: cancelReason,
        cancelled_at: now,
      },
      select: {
        id: true,
        status: true,
        cancellation_reason: true,
        cancelled_at: true,
      },
    });

    return apiSuccess({
      booking: {
        id: updated.id.toString(),
        status: updated.status,
        cancellation_reason: updated.cancellation_reason,
        cancelled_at: updated.cancelled_at?.toISOString() ?? null,
      },
      refund: null, // 무료 예약은 환불 객체 자체가 의미 없음
    });
  }

  // ─────────────────────────────────────────────
  // 분기 B: 유료 예약 (payment_id 존재 + final_amount > 0)
  //   payments 조회 → 환불 정책 계산 → 토스 cancel(필요 시) → 트랜잭션 갱신
  // ─────────────────────────────────────────────
  // payment_id가 null이 아님은 위에서 확인됨 (TS 좁히기를 위해 별도 변수)
  const paymentId = booking.payment_id!;
  const payment = await prisma.payments.findUnique({
    where: { id: paymentId },
  });

  // 결제 레코드가 없으면 데이터 정합성 오류 — 운영자 알림 필요
  if (!payment) {
    return apiError(
      "결제 정보가 존재하지 않습니다. 운영자에게 문의해주세요.",
      500,
      "PAYMENT_NOT_FOUND"
    );
  }

  // 결제 상태 가드 — 이미 환불/취소된 결제는 더 이상 처리 불가
  if (
    payment.status === "refunded" ||
    payment.status === "partial_refunded" ||
    payment.status === "cancelled"
  ) {
    return apiError(
      "이미 환불 처리된 결제입니다",
      400,
      "PAYMENT_ALREADY_REFUNDED"
    );
  }

  // 환불 정책 계산 — refund-policy 유틸 사용 (KST 자정 기준 일수)
  const paidAmount = Number(payment.final_amount);
  let refund = calcRefundAmount(booking.start_at, paidAmount, now);

  // 운영자 취소 정책: 운영 사정으로 인한 강제 취소이므로 100% 환불 강제
  // 이유: 사용자가 잘못한 게 아니라 운영자가 취소했으므로 사용자 보호 차원에서 전액 환불
  if (result.isManager) {
    refund = {
      ratio: 1.0,
      amount: paidAmount, // 결제 전액
      daysBefore: refund.daysBefore, // 정보용으로 유지
      label: "D-3 이전", // 운영자 취소는 100% 환불 → 라벨도 100% 동일
    };
  }

  // ─────────────────────────────────────────────
  // 환불 비율 0 (당일 + 본인 취소): 토스 호출 X, DB만 cancelled
  // ─────────────────────────────────────────────
  if (refund.ratio === 0) {
    const updated = await prisma.court_bookings.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
        cancellation_reason: cancelReason,
        cancelled_at: now,
        // refunded_at은 환불 미발생이므로 null 유지
      },
      select: {
        id: true,
        status: true,
        cancellation_reason: true,
        cancelled_at: true,
      },
    });

    return apiSuccess({
      booking: {
        id: updated.id.toString(),
        status: updated.status,
        cancellation_reason: updated.cancellation_reason,
        cancelled_at: updated.cancelled_at?.toISOString() ?? null,
      },
      refund: {
        amount: 0,
        ratio: 0,
        label: refund.label, // "당일"
        days_before: refund.daysBefore,
      },
    });
  }

  // ─────────────────────────────────────────────
  // 환불 비율 > 0: 토스 cancel API 호출 → 성공 시 DB 트랜잭션
  // ─────────────────────────────────────────────
  const secretKey = process.env.TOSS_SECRET_KEY;

  // toss_payment_key가 있어야 실제 환불 호출 가능
  // (개발/테스트 환경에서 secretKey 또는 toss_payment_key가 없으면 DB만 갱신 — 기존 refund 라우트와 동일 fallback)
  const canCallToss = !!secretKey && !!payment.toss_payment_key;

  if (canCallToss) {
    try {
      const encoded = Buffer.from(`${secretKey}:`).toString("base64");
      // 토스 cancel API 호출 — cancelAmount 전달 시 부분 환불
      const tossRes = await fetch(
        `https://api.tosspayments.com/v1/payments/${payment.toss_payment_key}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${encoded}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancelReason,
            cancelAmount: refund.amount, // 부분/전액 환불 모두 동일 필드 사용
          }),
        }
      );

      if (!tossRes.ok) {
        const errBody = await tossRes.json().catch(() => ({}));
        console.error("[Booking Cancel - Toss Error]", {
          bookingId: bookingId.toString(),
          paymentId: paymentId.toString(),
          tossPaymentKey: payment.toss_payment_key,
          cancelAmount: refund.amount,
          errBody,
        });
        // 토스 실패 → DB 변경 없이 500 응답 (트랜잭션 밖이므로 롤백 자동)
        return apiError(
          "결제사 환불 처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
          500,
          "TOSS_CANCEL_FAILED"
        );
      }

      // (옵션) 토스 응답 cancels 배열 검증 — 부분 환불 시 cancelAmount 일치 확인
      // 운영 안정화 후 추가. 현재는 ok 상태만 신뢰.
    } catch (err) {
      console.error("[Booking Cancel - Toss Exception]", err);
      return apiError(
        "환불 처리 중 오류가 발생했습니다",
        500,
        "TOSS_CANCEL_ERROR"
      );
    }
  }

  // 토스 성공(또는 dev 환경 fallback) → DB 트랜잭션으로 동시 갱신
  // 이유: court_bookings 상태와 payments 상태가 어긋나면 정산/환불 이력이 깨진다.
  //       토스 호출은 외부 I/O라 트랜잭션 밖에 두고, 성공 후에만 DB 일괄 갱신.
  const isPartialRefund = refund.amount < paidAmount;
  const paymentNewStatus = isPartialRefund ? "partial_refunded" : "refunded";

  const [updatedBooking] = await prisma.$transaction([
    prisma.court_bookings.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
        cancellation_reason: cancelReason,
        cancelled_at: now,
        refunded_at: now, // 환불 발생했으므로 기록
      },
      select: {
        id: true,
        status: true,
        cancellation_reason: true,
        cancelled_at: true,
        refunded_at: true,
      },
    }),
    prisma.payments.update({
      where: { id: paymentId },
      data: {
        status: paymentNewStatus, // partial_refunded | refunded
        refund_amount: refund.amount,
        refund_reason: cancelReason,
        refund_status: "completed",
        refunded_at: now,
        updated_at: now,
      },
    }),
  ]);

  return apiSuccess({
    booking: {
      id: updatedBooking.id.toString(),
      status: updatedBooking.status,
      cancellation_reason: updatedBooking.cancellation_reason,
      cancelled_at: updatedBooking.cancelled_at?.toISOString() ?? null,
      refunded_at: updatedBooking.refunded_at?.toISOString() ?? null,
    },
    refund: {
      amount: refund.amount,
      ratio: refund.ratio,
      label: refund.label,
      days_before: refund.daysBefore,
      payment_status: paymentNewStatus, // UI 분기용 (부분/전액 표시)
    },
  });
}
