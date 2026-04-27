/* ============================================================
 * Booking Conflict — 코트 예약 시간 충돌 검사 + 동시성 제어 (Phase A)
 *
 * 이유:
 *   별도 court_slots 테이블 없이 court_bookings 자체에서 시간 범위 충돌만 검사.
 *   동시 예약 race condition 방지를 위해 Postgres FOR UPDATE pessimistic lock 사용.
 *
 * 충돌 조건 (시간 구간 겹침):
 *   A.start < B.end AND A.end > B.start
 *   (A=신규, B=기존 예약)
 *
 * 활성 status (충돌 검사 대상):
 *   - confirmed (확정 예약)
 *   - pending   (Phase B 결제 대기 — 잠금)
 *   - blocked   (운영자 차단 슬롯)
 *
 * 무시 status (검사 제외):
 *   - cancelled / refunded / completed
 *
 * 사용 패턴:
 *   await prisma.$transaction(async (tx) => {
 *     await acquireBookingLock(tx, courtInfoId);          // ① 코트 단위 락
 *     const conflict = await checkConflict(tx, ...);      // ② 충돌 검사
 *     if (conflict) throw new ConflictError(...);
 *     return tx.court_bookings.create({ ... });           // ③ 안전하게 INSERT
 *   });
 * ============================================================ */

import type { Prisma } from "@prisma/client";

export type PrismaTxClient = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// 충돌 검사 대상 상태 — 활성 슬롯만
const ACTIVE_STATUSES = ["confirmed", "pending", "blocked"] as const;

export interface ConflictResult {
  hasConflict: boolean;
  // 충돌난 기존 예약 (있으면) — UI에서 "이미 예약됨: 16:00~18:00" 안내용
  conflictingBooking?: {
    id: string;
    start_at: Date;
    end_at: Date;
    status: string;
    purpose: string;
  };
}

/**
 * 코트 단위 advisory lock 획득.
 * 이유: row-level FOR UPDATE 는 신규 INSERT 차단 못함 (해당 row 가 없으면 대기 안됨).
 *       court_info_id 를 키로 한 advisory lock 으로 코트 단위 직렬화.
 *
 * Postgres pg_advisory_xact_lock 은 트랜잭션 종료 시 자동 해제 → 별도 unlock 불필요.
 */
export async function acquireBookingLock(
  tx: PrismaTxClient,
  courtInfoId: bigint
): Promise<void> {
  // BigInt 를 Number 로 안전 변환 (advisory lock 은 bigint 1개 인자 받음)
  // court_info_id 는 PK 라 충돌 방지를 위해 그대로 사용 가능
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${courtInfoId})`;
}

/**
 * 시간 범위 충돌 검사.
 * @param tx Prisma 트랜잭션 클라이언트
 * @param courtInfoId 검사할 코트
 * @param startAt 신규 예약 시작 (UTC Date)
 * @param endAt 신규 예약 종료 (UTC Date)
 * @param excludeBookingId 본인 예약을 제외할 때 사용 (예: 수정 흐름)
 */
export async function checkConflict(
  tx: PrismaTxClient,
  courtInfoId: bigint,
  startAt: Date,
  endAt: Date,
  excludeBookingId?: bigint
): Promise<ConflictResult> {
  // A.start < B.end AND A.end > B.start 로 겹침 여부 검사
  // 인덱스 (court_info_id, start_at) 활용
  const conflict = await tx.court_bookings.findFirst({
    where: {
      court_info_id: courtInfoId,
      status: { in: [...ACTIVE_STATUSES] },
      start_at: { lt: endAt },
      end_at: { gt: startAt },
      ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
    },
    select: {
      id: true,
      start_at: true,
      end_at: true,
      status: true,
      purpose: true,
    },
    orderBy: { start_at: "asc" },
  });

  if (!conflict) return { hasConflict: false };

  return {
    hasConflict: true,
    conflictingBooking: {
      id: conflict.id.toString(),
      start_at: conflict.start_at,
      end_at: conflict.end_at,
      status: conflict.status,
      purpose: conflict.purpose,
    },
  };
}

/**
 * 특정 날짜의 활성 슬롯 전체 조회 — UI 슬롯 그리드 렌더링용.
 * @returns ISO start_at + end_at + status 배열 (시간순 정렬)
 */
export async function listActiveBookings(
  tx: PrismaTxClient,
  courtInfoId: bigint,
  dayStart: Date,
  dayEnd: Date
) {
  return tx.court_bookings.findMany({
    where: {
      court_info_id: courtInfoId,
      status: { in: [...ACTIVE_STATUSES] },
      // 해당 일자에 걸치는 모든 예약 (밤샘 케이스도 포함)
      start_at: { lt: dayEnd },
      end_at: { gt: dayStart },
    },
    select: {
      id: true,
      start_at: true,
      end_at: true,
      duration_hours: true,
      status: true,
      purpose: true,
      user_id: true,
    },
    orderBy: { start_at: "asc" },
  });
}

/**
 * 시간 정합성 검사 헬퍼 — 1시간 단위 정렬 + 1~4시간 범위.
 * @returns 에러 메시지 (있으면) / null (정상)
 */
export function validateBookingTime(
  startAt: Date,
  durationHours: number
): string | null {
  // 1) duration 1~4 범위 (시안)
  if (!Number.isInteger(durationHours) || durationHours < 1 || durationHours > 4) {
    return "이용 시간은 1~4시간 범위로 선택해주세요.";
  }
  // 2) 분/초 = 0 (1시간 단위 정렬 강제)
  if (startAt.getMinutes() !== 0 || startAt.getSeconds() !== 0) {
    return "예약 시작 시각은 정시(00분)여야 합니다.";
  }
  // 3) 과거 시각 차단
  if (startAt.getTime() < Date.now()) {
    return "이미 지난 시각은 예약할 수 없습니다.";
  }
  return null;
}
