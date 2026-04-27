/* ============================================================
 * /api/web/court-bookings/[id]/payment-cancel — 결제 실패/취소 정리 (Phase B-4)
 *
 * POST: 토스 결제창에서 사용자가 실패/취소한 경우 failUrl 측에서 호출.
 *       pending 상태인 예약을 cancelled 로 전환.
 *
 * 이유:
 *   - 토스 결제창 진입 전에 만든 booking 은 status="pending" 으로 DB 에 남는다.
 *   - 결제창에서 실패/취소되면 successUrl 콜백이 안 오므로 별도 정리 API 가 필요.
 *   - 결제 자체가 미완료이므로 토스 cancel API 호출은 불필요 (B-3 와 다른 점).
 *
 * 보안 가드:
 *   - 본인 예약만 취소 가능 (user_id === session.userId)
 *   - pending → cancelled 만 허용 (다른 status 는 409 ALREADY_PROCESSED)
 *   - updateMany + where.status="pending" 으로 동시성 차단
 * ============================================================ */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

// 취소 사유 입력 스키마 — 최대 200자, 선택 (body 자체가 없어도 OK)
const CancelSchema = z.object({
  reason: z.string().max(200).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ---- 1) 인증 ----
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");

  // ---- 2) params.id 검증 + BigInt 변환 ----
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 예약 ID입니다", 400, "INVALID_ID");
  }
  const bookingId = BigInt(id);
  const userId = BigInt(session.sub);

  // ---- 3) Body Zod 파싱 (옵셔널) ----
  // 이유: failUrl 콜백은 reason 을 안 보낼 수도 있으므로 body 없는 호출도 허용.
  let reason: string | undefined;
  const body = await req.json().catch(() => null);
  if (body) {
    const parsed = CancelSchema.safeParse(body);
    if (parsed.success) reason = parsed.data.reason;
  }

  // ---- 4) booking 조회 ----
  const booking = await prisma.court_bookings.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      user_id: true,
      status: true,
    },
  });

  if (!booking) {
    return apiError("존재하지 않는 예약입니다", 404, "NOT_FOUND");
  }

  // ---- 5) 본인 예약 검증 ----
  // 이유: 다른 사용자의 pending 예약을 임의로 cancelled 처리 못 하게 차단.
  if (booking.user_id !== userId) {
    return apiError("이 예약을 취소할 권한이 없습니다", 403, "FORBIDDEN");
  }

  // ---- 6) status 검증 (pending 만 허용) ----
  // 이유: 이미 결제 완료(confirmed) 또는 cancelled/refunded 상태는 별도 흐름.
  if (booking.status !== "pending") {
    return apiError(
      "이미 처리된 예약입니다",
      409,
      "ALREADY_PROCESSED"
    );
  }

  // ---- 7) updateMany 로 동시성 가드 + 업데이트 ----
  // 이유: 같은 booking 에 대해 successUrl/failUrl 콜백이 동시에 들어와도
  //       where.status="pending" 으로 한쪽만 통과시킨다.
  const cancelledAt = new Date();
  const finalReason = reason ?? "결제 실패";

  const updateRes = await prisma.court_bookings.updateMany({
    where: { id: bookingId, status: "pending" },
    data: {
      status: "cancelled",
      cancelled_at: cancelledAt,
      cancellation_reason: finalReason,
      // updated_at 은 @updatedAt 으로 자동 갱신
    },
  });

  // 동시 콜백으로 다른 요청이 먼저 처리한 경우 — 409 로 응답
  if (updateRes.count !== 1) {
    return apiError(
      "이미 처리된 예약입니다",
      409,
      "ALREADY_PROCESSED"
    );
  }

  // ---- 8) 성공 응답 (apiSuccess 가 snake_case 자동 변환) ----
  return apiSuccess({
    booking: {
      id: bookingId.toString(),
      status: "cancelled",
      cancelled_at: cancelledAt.toISOString(),
      cancellation_reason: finalReason,
    },
  });
}
