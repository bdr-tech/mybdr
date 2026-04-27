"use client";

/* ============================================================
 * /courts/[id]/booking/payment-fail — 코트 대관 결제 실패 랜딩 (Phase B-6)
 *
 * 이유:
 *   - 토스페이먼츠 결제창에서 사용자가 취소/실패 시 failUrl 로 이동.
 *   - 이때 booking 은 status="pending" 으로 DB 에 남아있으므로
 *     B-4 API(POST /api/web/court-bookings/{id}/payment-cancel)
 *     를 호출해 즉시 cancelled 로 정리한다.
 *   - 동시에 사용자에게 "왜 실패했는지" + "다음 액션" 을 안내한다.
 *
 * 흐름:
 *   1. 진입 시 useEffect 한 번만 실행 (StrictMode 더블 호출 가드)
 *   2. bookingId 가 있으면 B-4 API 호출 → 결과(성공/실패/이미처리) 무관, 안내만 표시
 *   3. bookingId 없으면 API 호출 스킵 (직접 URL 진입한 사용자 대비)
 *
 * 토스 fail query 파라미터 (자동 추가):
 *   - code: 에러 코드 (PAY_PROCESS_CANCELED, USER_CANCEL 등)
 *   - message: 에러 메시지 (URL 디코딩됨)
 *   - bookingId: B-5 booking-client 가 failUrl 에 미리 붙임
 *
 * 추가 query (B-3 confirm/booking 측에서 검증 실패 시 사용):
 *   - reason: 영문 코드 (missing_params, owner_mismatch, amount_mismatch 등)
 *
 * 시안 패턴 (v2):
 *   - .page / .card / var(--accent) / var(--ff-display) / .btn / .btn--primary
 *   - safety/help 페이지와 동일한 톤 (BDR Red 강조 + 중앙 정렬 카드)
 * ============================================================ */

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";

// reason/code 코드 → 사용자 친화적 한글 메시지 매핑
// 이유: 토스가 내려주는 영문 code 와 confirm/booking 의 영문 reason 을
//       그대로 노출하면 사용자가 이해하지 못함. 자주 발생하는 5종만 정리.
const REASON_LABELS: Record<string, string> = {
  // 사용자가 결제창 X 또는 취소 버튼을 누른 경우 (가장 흔함)
  USER_CANCEL: "사용자가 결제를 취소했습니다",
  PAY_PROCESS_CANCELED: "결제가 취소되었습니다",
  // 결제창 진입 후 일정 시간 내 미결제
  TIMEOUT: "결제 시간이 초과되었습니다",
  // confirm/booking 의 reason 들 — 영문이라도 사용자가 보면 당황하므로 한글화
  amount_mismatch: "결제 금액이 일치하지 않아 취소되었습니다",
  owner_mismatch: "예약자 정보가 일치하지 않습니다",
  already_processed: "이미 처리된 예약입니다",
};

// 매핑되지 않은 모든 코드의 폴백 안내문
const FALLBACK_LABEL = "결제 처리 중 오류가 발생했습니다";

export default function PaymentFailPage() {
  // courtId — useParams 로 동적 세그먼트 추출 (App Router 클라이언트 컴포넌트)
  const params = useParams<{ id: string }>();
  const courtId = params?.id ?? "";

  // 쿼리 파라미터 — 토스 code/message + 우리쪽 reason + bookingId
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const code = searchParams.get("code");
  const reason = searchParams.get("reason");

  // useEffect 1회 실행 가드 — React StrictMode(개발) 더블 호출 방지
  // 이유: 결제 취소 API 호출은 idempotent 하지만(이미 cancelled 면 409 반환) 굳이 2회 호출할 필요 없음
  const cancelCalledRef = useRef(false);

  useEffect(() => {
    // bookingId 없으면 정리할 대상이 없음 → 안내만 표시
    if (!bookingId) return;
    if (cancelCalledRef.current) return;
    cancelCalledRef.current = true;

    // B-4 API 호출 — pending 인 예약을 cancelled 로 전환
    // 결과(성공/실패/이미처리)는 사용자에게 직접 노출하지 않음.
    // 이유: failUrl 도착 자체가 "결제 안 됨" 신호이므로 안내문구는 일관되게 유지.
    //       fetch 실패해도 cron(/api/cron/expire-pending-bookings)이 15분 뒤 정리.
    fetch(`/api/web/court-bookings/${bookingId}/payment-cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // reason 우선순위: query.reason → query.code → 기본값
        reason: reason ?? code ?? "결제 취소",
      }),
    }).catch((err) => {
      // 네트워크 실패만 console 기록 (사용자 안내는 동일)
      console.error("[payment-fail] payment-cancel API 호출 실패", err);
    });
  }, [bookingId, code, reason]);

  // 표시할 사유 메시지 — code 우선, 없으면 reason, 둘 다 없으면 폴백
  // 이유: 토스가 보내는 code 가 가장 구체적. 우리쪽 reason 은 백업.
  const reasonKey = code ?? reason ?? "";
  const reasonLabel = REASON_LABELS[reasonKey] ?? FALLBACK_LABEL;

  return (
    <div className="page" style={{ padding: "60px 20px" }}>
      {/* 중앙 정렬 카드 — max-width 640 (요구사항) */}
      <div
        className="card"
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        {/* 실패 아이콘 — Material Symbols Outlined error (lucide-react 금지) */}
        <div
          style={{
            width: 72,
            height: 72,
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: "var(--bg-alt)",
            border: "2px solid var(--accent)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 40,
              color: "var(--accent)",
            }}
            aria-hidden
          >
            error
          </span>
        </div>

        {/* eyebrow — v2 시안 패턴 (대문자 + spaced + dim) */}
        <div
          className="eyebrow"
          style={{ justifyContent: "center", color: "var(--accent)" }}
        >
          PAYMENT FAILED
        </div>

        {/* 제목 — display 폰트 (Space Grotesk) + 강한 무게 */}
        <h1
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "8px 0 12px",
            color: "var(--ink)",
          }}
        >
          결제가 완료되지 않았습니다
        </h1>

        {/* 사유 메시지 — 매핑된 한글 또는 폴백 */}
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 15,
            color: "var(--ink-soft)",
            lineHeight: 1.6,
          }}
        >
          {reasonLabel}
        </p>

        {/* 안내 문구 — 항상 동일 (예약 자동 취소됨) */}
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 13,
            color: "var(--ink-mute)",
            lineHeight: 1.6,
          }}
        >
          예약은 자동으로 취소 처리됩니다. 다시 시도해주세요.
        </p>

        {/* 디버깅용 원본 정보 — 매핑 못 한 code/reason 만 표시 (문의 시 활용) */}
        {reasonKey && !REASON_LABELS[reasonKey] && (
          <div
            style={{
              margin: "0 auto 24px",
              maxWidth: 380,
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid var(--border)",
              background: "var(--bg-alt)",
              fontFamily: "var(--ff-mono)",
              fontSize: 11,
              color: "var(--ink-dim)",
            }}
          >
            code: {reasonKey}
          </div>
        )}

        {/* 액션 버튼 2개 — primary(코트로 돌아가기) + secondary(내 예약) */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {/* 코트로 돌아가기 — 동일 코트의 booking 페이지로 즉시 재시도 가능 */}
          {/* courtId 없을 때(이론상 없음) 안전 폴백: /courts 목록 */}
          <Link
            href={courtId ? `/courts/${courtId}/booking` : "/courts"}
            className="btn btn--primary"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
              aria-hidden
            >
              refresh
            </span>
            코트로 돌아가기
          </Link>
          {/* 내 예약 — 취소된 예약 확인용 */}
          <Link href="/profile/bookings" className="btn">
            내 예약
          </Link>
        </div>
      </div>
    </div>
  );
}
