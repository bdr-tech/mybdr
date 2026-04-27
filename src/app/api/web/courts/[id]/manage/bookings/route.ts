/* ============================================================
 * /api/web/courts/[id]/manage/bookings — 운영자용 예약 관리 API (Phase A)
 *
 * GET  : 본 코트의 예약 목록 (운영자 대시보드용 — 모든 status 포함)
 * POST : 운영자 차단 슬롯(blocked) 생성 — 점검·우천 등으로 시간대 막을 때
 *
 * 권한: court-manager-guard 의 isCourtManager() 통과 필수
 *   = court_infos.user_id == session.sub  AND  user_subscriptions.feature_key="court_rental" 활성
 * ============================================================ */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkCourtManager } from "@/lib/courts/court-manager-guard";
import {
  acquireBookingLock,
  checkConflict,
  validateBookingTime,
} from "@/lib/courts/booking-conflict";

const ONE_HOUR_MS = 60 * 60 * 1000;

// 운영자 차단 슬롯 생성 스키마
// purpose 는 항상 "block" 으로 강제, status="blocked"
const BlockSlotSchema = z.object({
  start_at: z.string().datetime({ offset: true }).or(z.string().datetime()),
  duration_hours: z.number().int().min(1).max(8), // 운영자는 최대 8시간 통차단 허용
  reason: z.string().max(200).optional(),
});

// ─────────────────────────────────────────────
// GET — 예약 목록 (운영자 대시보드용)
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD (선택, 기본=오늘~+30일)
//   ?status=confirmed,pending (선택, 콤마 구분)
// ─────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ① 인증
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError("유효하지 않은 코트 ID입니다", 400);
  const courtInfoId = BigInt(id);
  const userId = BigInt(session.sub);

  // ② 운영자 권한 검사
  const guard = await checkCourtManager(userId, courtInfoId);
  if (!guard.isManager) {
    if (guard.reason === "COURT_NOT_FOUND") {
      return apiError("존재하지 않는 코트입니다", 404, "NOT_FOUND");
    }
    if (guard.reason === "NO_SUBSCRIPTION") {
      return apiError(
        "코트 대관 멤버십이 필요합니다",
        403,
        "NO_SUBSCRIPTION"
      );
    }
    return apiError("이 코트의 운영자가 아닙니다", 403, "NOT_MANAGER");
  }

  // ③ 쿼리 파라미터 파싱
  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const statusParam = url.searchParams.get("status");

  const now = new Date();
  // 기본 범위: 오늘 KST 자정 ~ +30일
  const kstOffset = 9 * 60 * 60 * 1000;
  const todayKstMidnight = new Date(
    Math.floor((now.getTime() + kstOffset) / (24 * ONE_HOUR_MS)) *
      (24 * ONE_HOUR_MS) -
      kstOffset
  );
  const from = fromParam
    ? new Date(`${fromParam}T00:00:00+09:00`)
    : todayKstMidnight;
  const to = toParam
    ? new Date(`${toParam}T23:59:59+09:00`)
    : new Date(todayKstMidnight.getTime() + 30 * 24 * ONE_HOUR_MS);

  // status 필터 (디폴트: 활성 + 취소까지 모두)
  const statusFilter = statusParam
    ? statusParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["confirmed", "pending", "blocked", "cancelled", "refunded", "completed"];

  const bookings = await prisma.court_bookings.findMany({
    where: {
      court_info_id: courtInfoId,
      status: { in: statusFilter },
      start_at: { lt: to },
      end_at: { gt: from },
    },
    include: {
      // 예약자 정보 — 운영자 대시보드에서 누가 예약했는지 표시
      user: {
        select: {
          id: true,
          nickname: true,
          name: true,
          profile_image: true,
        },
      },
    },
    orderBy: { start_at: "asc" },
  });

  return apiSuccess({
    bookings: bookings.map((b) => ({
      id: b.id.toString(),
      start_at: b.start_at.toISOString(),
      end_at: b.end_at.toISOString(),
      duration_hours: b.duration_hours,
      purpose: b.purpose,
      status: b.status,
      expected_count: b.expected_count,
      amount: Number(b.amount),
      final_amount: Number(b.final_amount),
      cancellation_reason: b.cancellation_reason,
      cancelled_at: b.cancelled_at?.toISOString() ?? null,
      created_at: b.created_at.toISOString(),
      user: {
        id: b.user.id.toString(),
        nickname: b.user.nickname,
        name: b.user.name,
        profile_image: b.user.profile_image,
      },
    })),
  });
}

// ─────────────────────────────────────────────
// POST — 운영자 차단(blocked) 슬롯 생성
//   Body: { start_at, duration_hours, reason? }
//   응답: { booking: { ..., status: "blocked" } }
// ─────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");

  const { id } = await params;
  if (!/^\d+$/.test(id)) return apiError("유효하지 않은 코트 ID입니다", 400);
  const courtInfoId = BigInt(id);
  const userId = BigInt(session.sub);

  // 운영자 권한 검사
  const guard = await checkCourtManager(userId, courtInfoId);
  if (!guard.isManager) {
    return apiError(
      guard.reason === "NO_SUBSCRIPTION"
        ? "코트 대관 멤버십이 필요합니다"
        : "이 코트의 운영자가 아닙니다",
      403,
      guard.reason ?? "NOT_MANAGER"
    );
  }

  // Body 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("요청 본문이 올바르지 않습니다", 400, "INVALID_BODY");
  }
  const parsed = BlockSlotSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("입력값을 확인해주세요", 400, "VALIDATION_ERROR");
  }
  const { start_at, duration_hours, reason } = parsed.data;

  const startAt = new Date(start_at);
  if (Number.isNaN(startAt.getTime())) {
    return apiError("시작 시각이 올바르지 않습니다", 400);
  }
  const timeError = validateBookingTime(startAt, duration_hours);
  if (timeError) return apiError(timeError, 400, "INVALID_TIME");
  const endAt = new Date(startAt.getTime() + duration_hours * ONE_HOUR_MS);

  // 트랜잭션: lock + 충돌 검사 + INSERT (status="blocked")
  try {
    const created = await prisma.$transaction(async (tx) => {
      await acquireBookingLock(tx, courtInfoId);

      const conflict = await checkConflict(tx, courtInfoId, startAt, endAt);
      if (conflict.hasConflict) {
        const err = new Error("CONFLICT") as Error & { code: string };
        err.code = "SLOT_CONFLICT";
        throw err;
      }

      return tx.court_bookings.create({
        data: {
          court_info_id: courtInfoId,
          user_id: userId, // 운영자 본인
          start_at: startAt,
          end_at: endAt,
          duration_hours,
          purpose: "block",
          amount: 0,
          discount_amount: 0,
          final_amount: 0,
          status: "blocked",
          cancellation_reason: reason ?? null, // 차단 사유는 cancellation_reason 컬럼 재사용
        },
        select: {
          id: true,
          start_at: true,
          end_at: true,
          duration_hours: true,
          status: true,
          purpose: true,
          cancellation_reason: true,
        },
      });
    });

    return apiSuccess(
      {
        booking: {
          id: created.id.toString(),
          start_at: created.start_at.toISOString(),
          end_at: created.end_at.toISOString(),
          duration_hours: created.duration_hours,
          status: created.status,
          purpose: created.purpose,
          reason: created.cancellation_reason,
        },
      },
      201
    );
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.code === "SLOT_CONFLICT") {
      return apiError(
        "해당 시간대에 이미 예약/차단이 있습니다",
        409,
        "SLOT_CONFLICT"
      );
    }
    console.error(
      "[POST /api/web/courts/[id]/manage/bookings] error:",
      err.message
    );
    return apiError("차단 슬롯 생성 중 오류가 발생했습니다", 500, "INTERNAL_ERROR");
  }
}
