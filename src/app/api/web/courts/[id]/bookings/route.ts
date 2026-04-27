/* ============================================================
 * /api/web/courts/[id]/bookings — 회원용 코트 예약 API (Phase B-2)
 *
 * GET  : 특정 일자의 활성 슬롯 목록 조회 (예약 가능 시간 표시용)
 * POST : 신규 예약 생성 (FOR UPDATE 락 + 충돌 검사 + 결제 분기)
 *
 * Phase B-2 정책 (결제 통합):
 *   - fee == 0 (무료) : status = "confirmed" 즉시 확정, final_amount = 0
 *   - fee > 0 (유료)  : status = "pending"  결제 대기, final_amount = amount
 *                      → 응답에 orderId 포함 (클라가 toss.requestPayment 호출)
 *                      → orderId 패턴: `BOOKING-${bookingId}-${userId}-${timestamp}`
 *                      → DB 변경 0 원칙: order_id 컬럼 없음. successUrl 콜백에서
 *                        orderId 파싱(bookingId 추출) → lookup
 *
 * 보존 항목 (Phase A → B-2 100% 유지):
 *   - getWebSession 인증, Zod 검증, validateBookingTime
 *   - booking_mode === "internal" 가드
 *   - acquireBookingLock(pg_advisory_xact_lock) + checkConflict
 *   - INSERT 트랜잭션 + 충돌 409 변환
 *
 * apiSuccess 자동 snake_case 변환 (errors.md 6회차 가드):
 *   클라이언트는 본 응답을 snake_case 로 접근. raw curl 검증 권장.
 * ============================================================ */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  acquireBookingLock,
  checkConflict,
  listActiveBookings,
  validateBookingTime,
} from "@/lib/courts/booking-conflict";

// 1시간 = 3600s × 1000ms
const ONE_HOUR_MS = 60 * 60 * 1000;

// 허용 purpose 값 (시안 4종)
const PURPOSES = ["pickup", "team", "scrim", "private"] as const;

// 예약 생성 요청 스키마
const CreateBookingSchema = z.object({
  // ISO 8601 (UTC). 클라이언트에서 KST 슬롯을 UTC 로 변환해 전송
  start_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
  duration_hours: z.number().int().min(1).max(4),
  purpose: z.enum(PURPOSES).default("pickup"),
  expected_count: z.number().int().min(1).max(100).optional(),
});

// ─────────────────────────────────────────────
// GET — 특정 일자의 활성 슬롯 목록
//   ?date=YYYY-MM-DD (KST 기준) — 미지정시 오늘
//   응답: { court: {...}, day: ISO, bookings: [{ start_at, end_at, status, purpose }, ...] }
// ─────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtInfoId = BigInt(id);

  // 코트 존재 + booking_mode 검사
  // 이유: external/none 모드 코트의 슬롯 조회는 의미 없음 → 명시적 에러
  const court = await prisma.court_infos.findUnique({
    where: { id: courtInfoId },
    select: {
      id: true,
      name: true,
      booking_mode: true,
      booking_fee_per_hour: true,
      operating_hours: true,
      rental_url: true,
    },
  });
  if (!court) return apiError("존재하지 않는 코트입니다", 404, "NOT_FOUND");

  // ?date 파싱 (KST). 클라이언트가 "2026-04-26" 형태로 전달
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  // KST 자정~익일 자정 구간을 UTC 로 변환 (UTC = KST - 9h)
  const dayStartKst = dateParam
    ? new Date(`${dateParam}T00:00:00+09:00`)
    : new Date(new Date().toLocaleDateString("en-US", { timeZone: "Asia/Seoul" }));
  // dateParam 미지정 시: 오늘 KST 자정 — JS Date 의 timezone 처리 한계로 dayStart 는 안전한 형태로 강제
  if (!dateParam) {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    dayStartKst.setTime(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate()
      ) - kstOffset
    );
  }
  const dayEndKst = new Date(dayStartKst.getTime() + 24 * ONE_HOUR_MS);

  const bookings = await prisma.court_bookings.findMany({
    where: {
      court_info_id: courtInfoId,
      status: { in: ["confirmed", "pending", "blocked"] },
      start_at: { lt: dayEndKst },
      end_at: { gt: dayStartKst },
    },
    select: {
      id: true,
      start_at: true,
      end_at: true,
      duration_hours: true,
      status: true,
      purpose: true,
    },
    orderBy: { start_at: "asc" },
  });

  return apiSuccess({
    court: {
      id: court.id.toString(),
      name: court.name,
      booking_mode: court.booking_mode,
      booking_fee_per_hour: court.booking_fee_per_hour
        ? Number(court.booking_fee_per_hour)
        : null,
      operating_hours: court.operating_hours,
      rental_url: court.rental_url,
    },
    day: dayStartKst.toISOString(),
    bookings: bookings.map((b) => ({
      id: b.id.toString(),
      start_at: b.start_at.toISOString(),
      end_at: b.end_at.toISOString(),
      duration_hours: b.duration_hours,
      status: b.status,
      purpose: b.purpose,
    })),
  });
}

// ─────────────────────────────────────────────
// POST — 신규 예약 생성
//   Body: { start_at, duration_hours, purpose, expected_count? }
//   응답: { booking: { id, start_at, end_at, status, final_amount, ... } }
// ─────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ① 인증
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtInfoId = BigInt(id);
  const userId = BigInt(session.sub);

  // ② Body 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("요청 본문이 올바르지 않습니다", 400, "INVALID_BODY");
  }
  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("입력값을 확인해주세요", 400, "VALIDATION_ERROR");
  }
  const { start_at, duration_hours, purpose, expected_count } = parsed.data;

  // ③ 시간 정합성 검사
  const startAt = new Date(start_at);
  if (Number.isNaN(startAt.getTime())) {
    return apiError("시작 시각이 올바르지 않습니다", 400);
  }
  const timeError = validateBookingTime(startAt, duration_hours);
  if (timeError) return apiError(timeError, 400, "INVALID_TIME");
  const endAt = new Date(startAt.getTime() + duration_hours * ONE_HOUR_MS);

  // ④ 코트 + booking_mode 사전 검증 (트랜잭션 밖)
  const court = await prisma.court_infos.findUnique({
    where: { id: courtInfoId },
    select: { id: true, booking_mode: true, booking_fee_per_hour: true },
  });
  if (!court) return apiError("존재하지 않는 코트입니다", 404, "NOT_FOUND");
  if (court.booking_mode !== "internal") {
    // internal 모드만 시스템 내 예약 가능. external/none 은 대관 신청 X
    return apiError(
      "이 코트는 자체 예약을 지원하지 않습니다",
      400,
      "BOOKING_NOT_SUPPORTED"
    );
  }

  // ⑤ 트랜잭션: advisory lock → 충돌 검사 → INSERT
  // 이유: 동시 요청 race condition 방지. lock 은 court_info_id 단위라 다른 코트와 무관.
  try {
    const created = await prisma.$transaction(async (tx) => {
      await acquireBookingLock(tx, courtInfoId);

      const conflict = await checkConflict(tx, courtInfoId, startAt, endAt);
      if (conflict.hasConflict) {
        // 트랜잭션 내부에서 throw → 외부 catch 로 409 변환
        const err = new Error("CONFLICT") as Error & {
          code: string;
          conflicting?: typeof conflict.conflictingBooking;
        };
        err.code = "SLOT_CONFLICT";
        err.conflicting = conflict.conflictingBooking;
        throw err;
      }

      // 금액 계산 — Phase B-2 결제 분기
      // 이유: feePerHour 가 0 또는 null 이면 무료 코트, 그 외엔 유료 코트.
      //       무료/유료에 따라 status 와 final_amount 가 달라짐.
      const feePerHour = court.booking_fee_per_hour
        ? Number(court.booking_fee_per_hour)
        : 0;
      const amount = feePerHour * duration_hours;

      // 분기: 유료(amount > 0) → pending + 실제 금액. 무료 → confirmed + 0
      const isPaid = amount > 0;
      const finalAmount = isPaid ? amount : 0;
      // 유료는 결제 완료 시 confirm. 무료는 즉시 확정 (Phase A 흐름 유지)
      const initialStatus = isPaid ? "pending" : "confirmed";

      return tx.court_bookings.create({
        data: {
          court_info_id: courtInfoId,
          user_id: userId,
          start_at: startAt,
          end_at: endAt,
          duration_hours,
          purpose,
          expected_count: expected_count ?? null,
          amount,
          discount_amount: 0,
          final_amount: finalAmount,
          // platform_fee 는 Phase C 이후 사용. Phase B 는 0 유지
          platform_fee: 0,
          status: initialStatus,
        },
        select: {
          id: true,
          start_at: true,
          end_at: true,
          duration_hours: true,
          purpose: true,
          status: true,
          amount: true,
          final_amount: true,
          expected_count: true,
        },
      });
    });

    // 결제 분기 응답
    // 이유: 유료 예약은 클라가 토스 결제창을 띄워야 하므로 orderId/amount 가 필요.
    //       무료 예약은 즉시 확정이라 결제 호출 불필요.
    const isPaid = Number(created.final_amount) > 0;

    // orderId — DB 저장하지 않고 응답으로만 전달 (DB 변경 0 원칙)
    // 패턴: BOOKING-{bookingId}-{userId}-{timestamp}
    // successUrl 콜백에서 bookingId 파싱하여 lookup → confirm
    const orderId = isPaid
      ? `BOOKING-${created.id.toString()}-${userId.toString()}-${Date.now()}`
      : null;

    const bookingPayload = {
      id: created.id.toString(),
      start_at: created.start_at.toISOString(),
      end_at: created.end_at.toISOString(),
      duration_hours: created.duration_hours,
      purpose: created.purpose,
      status: created.status,
      amount: Number(created.amount),
      final_amount: Number(created.final_amount),
      expected_count: created.expected_count,
    };

    if (isPaid) {
      // 유료: 결제 필요 플래그 + orderId + amount 동봉
      return apiSuccess(
        {
          booking: bookingPayload,
          requiresPayment: true,
          orderId,
          amount: Number(created.final_amount),
        },
        201
      );
    }

    // 무료: 결제 불필요. Phase A 와 동일한 응답에 플래그만 추가
    return apiSuccess(
      {
        booking: bookingPayload,
        requiresPayment: false,
      },
      201
    );
  } catch (error) {
    // 충돌 에러 → 409
    const err = error as Error & {
      code?: string;
      conflicting?: { id: string; start_at: Date; end_at: Date; status: string };
    };
    if (err.code === "SLOT_CONFLICT") {
      return apiError(
        "이미 예약된 시간대입니다",
        409,
        "SLOT_CONFLICT",
        err.conflicting
          ? {
              conflicting_start_at: err.conflicting.start_at.toISOString(),
              conflicting_end_at: err.conflicting.end_at.toISOString(),
              conflicting_status: err.conflicting.status,
            }
          : undefined
      );
    }
    console.error("[POST /api/web/courts/[id]/bookings] error:", err.message);
    return apiError("예약 처리 중 오류가 발생했습니다", 500, "INTERNAL_ERROR");
  }
}
