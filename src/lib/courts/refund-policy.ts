/* ============================================================
 * Refund Policy — 코트 예약 환불 정책 룰 엔진 (Phase B B-1)
 *
 * 정책 (TournamentEnroll 시안과 통일):
 *   - D-3 이전 (예약 시작일 기준 3일 이상 전): 100% 환불
 *   - D-2 ~ D-1 (1~2일 전):                    50% 환불
 *   - 당일 (D-0):                              0% (환불 불가)
 *
 * ⏰ 타임존 = 한국 시간(Asia/Seoul, UTC+9) 자정 기준
 *
 * 이유:
 *   사용자 체감 "D-3"은 시계 시각(시/분)이 아니라 한국 달력 날짜 차이.
 *   예) 2026-04-30 14:00(KST) 시작 예약을 2026-04-27 23:30(KST)에 취소하면
 *       UTC 시각으로는 "약 62시간 전"이지만 KST 달력 기준 "3일 전"이므로 100% 환불.
 *   → KST로 보정한 뒤 자정으로 자르고 일수 차이만 계산.
 *
 * KST 자정 변환 방식:
 *   1) Date의 UTC 타임스탬프에 +9시간 더한다 → KST 시간이 UTC 표현으로 들어옴
 *   2) setUTCHours(0,0,0,0)으로 UTC 자정을 자른다 → 실제로는 KST 자정
 *   (코드베이스 다수 위치에서 동일 패턴 사용 중. 예: bookings/route.ts, weekly-report)
 *
 * 사용 예:
 *   const result = calcRefundAmount(booking.start_at, booking.final_amount, new Date());
 *   if (result.ratio > 0) {
 *     await tossCancel(payment.payment_code, { cancelAmount: result.amount });
 *   }
 * ============================================================ */

// 한국 표준시 오프셋 (UTC+9, ms 단위)
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 하루(ms)
const DAY_MS = 24 * 60 * 60 * 1000;

/** 환불 사유/단계 라벨 — UI 안내 텍스트에 그대로 사용 */
export type RefundLabel = "D-3 이전" | "D-2 ~ D-1" | "당일";

/**
 * 주어진 Date를 한국 시간(Asia/Seoul) 자정으로 절단하여 반환한다.
 *
 * 이유:
 *   환불 정책의 "며칠 전"은 KST 달력 날짜 차이로 판단해야 한다.
 *   시각(시/분)이 다른 두 시점을 비교할 때 KST 자정으로 정렬하면
 *   "23:59에 취소"와 "00:01에 취소"가 같은 일자로 간주된다.
 *
 * 방법:
 *   UTC 타임스탬프에 +9h를 더해 KST 시각이 UTC 표현으로 보이도록 만든 뒤,
 *   setUTCHours(0,0,0,0)으로 자정을 자른다.
 *   (반환된 Date의 getTime()은 "KST 자정의 실제 UTC 시각보다 9시간 빠른" 값이지만,
 *    동일 함수로 가공한 두 Date끼리의 차분에는 영향이 없으므로 일수 비교에는 안전하다.)
 *
 * @param d 임의의 Date
 * @returns 같은 KST 일자의 자정으로 정렬된 Date
 */
export function toKstMidnight(d: Date): Date {
  // 1) UTC ms에 +9h → KST 벽시계 시각이 UTC 표현으로 들어옴
  const kst = new Date(d.getTime() + KST_OFFSET_MS);
  // 2) UTC 자정으로 자르기 (실질적으로 KST 자정)
  kst.setUTCHours(0, 0, 0, 0);
  return kst;
}

/**
 * 예약 시작일까지 남은 KST 달력 일수를 계산한다.
 *
 * 반환 예:
 *   - 시작일이 오늘이면     0  (D-0, 당일)
 *   - 시작일이 내일이면     1  (D-1)
 *   - 시작일이 모레면       2  (D-2)
 *   - 시작일이 3일 뒤면     3  (D-3)
 *   - 이미 지난 예약        음수
 *
 * @param bookingStartAt 예약 시작 시각 (UTC Date — DB에서 그대로)
 * @param now 현재 시각 (테스트 주입 가능, 기본 new Date())
 */
export function calcDaysBeforeBookingKst(
  bookingStartAt: Date,
  now: Date = new Date()
): number {
  const startKst = toKstMidnight(bookingStartAt);
  const nowKst = toKstMidnight(now);
  // ms 차이 → 일수 (정수). DAY_MS는 24h 고정이라 DST 없음(KST는 DST 미적용)
  const diffMs = startKst.getTime() - nowKst.getTime();
  return Math.round(diffMs / DAY_MS);
}

/**
 * 일수에 따른 환불 비율(0 ~ 1)과 라벨을 반환한다.
 *
 * 정책표:
 *   daysBefore >= 3 → 1.0 (100%, "D-3 이전")
 *   daysBefore >= 1 → 0.5 (50%, "D-2 ~ D-1")
 *   daysBefore <= 0 → 0.0 (0%,  "당일")
 *
 * @param daysBefore calcDaysBeforeBookingKst()의 반환값
 */
export function getRefundRatio(daysBefore: number): {
  ratio: number;
  label: RefundLabel;
} {
  if (daysBefore >= 3) {
    return { ratio: 1.0, label: "D-3 이전" };
  }
  if (daysBefore >= 1) {
    return { ratio: 0.5, label: "D-2 ~ D-1" };
  }
  // 당일(0) 또는 이미 지난 예약(음수) — 환불 불가
  return { ratio: 0.0, label: "당일" };
}

/** calcRefundAmount() 의 반환 타입 */
export interface RefundCalculation {
  /** 환불 비율 (0.0 / 0.5 / 1.0) */
  ratio: number;
  /** 환불 금액 (원). Math.floor로 절단. */
  amount: number;
  /** KST 기준 예약 시작까지 남은 일수 (음수 가능) */
  daysBefore: number;
  /** UI 안내용 라벨 */
  label: RefundLabel;
}

/**
 * 결제 금액과 예약 시작일을 받아 실제 환불 금액을 계산한다.
 *
 * 이 함수가 핵심 진입점:
 *   - DELETE /api/web/bookings/[id]: 토스 cancel API의 cancelAmount로 그대로 사용
 *   - UI 취소 모달: "환불 예상 금액 N원" 표시
 *
 * 절단 규칙:
 *   - 50% 환불 시 소수점이 발생하면 Math.floor (원 단위 절사) — 사업자 유리
 *
 * @param bookingStartAt 예약 시작 시각 (UTC Date)
 * @param paidAmount 실결제 금액 (court_bookings.final_amount 또는 payments.final_amount)
 * @param now 현재 시각 (테스트 주입 가능, 기본 new Date())
 */
export function calcRefundAmount(
  bookingStartAt: Date,
  paidAmount: number,
  now: Date = new Date()
): RefundCalculation {
  const daysBefore = calcDaysBeforeBookingKst(bookingStartAt, now);
  const { ratio, label } = getRefundRatio(daysBefore);
  // 무료 예약(paidAmount=0) 또는 음수 안전 처리
  const safePaid = Math.max(0, paidAmount);
  const amount = Math.floor(safePaid * ratio);
  return { ratio, amount, daysBefore, label };
}
