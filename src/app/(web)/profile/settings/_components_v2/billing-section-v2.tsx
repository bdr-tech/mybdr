"use client";

/* ============================================================
 * BillingSectionV2 — Settings "결제·멤버십" 섹션
 *
 * 왜:
 *  - 시안: 상단 그라디언트 카드(현재 플랜) + 3행 Row(결제수단/결제 내역/세금계산서) + 하단 2버튼(플랜 변경/구독 취소).
 *  - 실 데이터 fetch 신규 0건 — 부모(page.tsx)에서 받은 user/subscription 요약만 표시.
 *  - 동작: "플랜 변경" → /pricing, "결제 내역 보기" → /profile/payments, "구독 관리/취소" → /profile/subscription.
 *  - 미구현: 결제수단 변경 / 영수증 발급 / 세금계산서 — disabled "준비 중".
 *
 * 어떻게:
 *  - 부모가 BillingSummary prop 으로 plan_label / next_billing_at / monthly_price / payment_method_masked 등을 내려줌.
 *  - 데이터가 없으면 시안의 placeholder 문구로 대체 (자리 유지).
 * ============================================================ */

import { useRouter } from "next/navigation";
import { SettingsHeader, SettingsRow } from "./settings-ui";

export interface BillingSummary {
  // 표시용 — 없으면 "BDR 베이직" 으로 표시
  plan_label?: string | null;
  // "₩4,900/월 · 다음 결제 2026.05.20" 같은 라인. 없으면 "결제 정보 없음"
  next_billing_caption?: string | null;
  // 활성 유료 멤버십 여부 — 그라디언트 카드 적용 결정
  is_paid_member?: boolean;
  // 결제수단 마스킹 (예: "**** 8822"). 없으면 "준비 중"
  payment_method_masked?: string | null;
}

export function BillingSectionV2({ summary }: { summary: BillingSummary | null }) {
  const router = useRouter();

  const planLabel = summary?.plan_label ?? "BDR 베이직";
  const billingCaption = summary?.next_billing_caption ?? "무료 플랜 사용 중";
  const isPaid = summary?.is_paid_member ?? false;
  const paymentMethod = summary?.payment_method_masked ?? "등록된 결제수단 없음";

  return (
    <>
      <SettingsHeader
        title="멤버십·결제"
        desc="현재 구독 중인 플랜과 결제 정보"
      />

      {/* 시안 상단 그라디언트 카드 — 유료 회원이면 cafe-blue 그라디언트, 무료면 알트 배경 */}
      <div
        style={{
          padding: "18px 20px",
          background: isPaid
            ? "linear-gradient(135deg, var(--cafe-blue), var(--cafe-blue-deep))"
            : "var(--bg-alt)",
          color: isPaid ? "#fff" : "var(--ink)",
          borderRadius: 8,
          marginBottom: 16,
          border: isPaid ? "0" : "1px solid var(--border)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".1em",
            fontWeight: 800,
            opacity: isPaid ? 0.9 : 0.7,
          }}
        >
          현재 플랜
        </div>
        <div
          style={{
            // 시안: ff-display 26px 900
            fontFamily: "var(--ff-display)",
            fontSize: 26,
            fontWeight: 900,
            margin: "4px 0",
          }}
        >
          {planLabel}
        </div>
        <div style={{ fontSize: 13, opacity: isPaid ? 0.9 : 0.75 }}>
          {billingCaption}
        </div>
      </div>

      {/* 4행 Row */}
      {/* 1. 결제수단 — DB 미지원, 자리 유지 */}
      <SettingsRow
        label="결제수단"
        value={paymentMethod}
        action="변경"
        disabled
      />
      {/* 2. 결제 내역 — 기존 /profile/payments 로 이동 */}
      <SettingsRow
        label="결제 내역"
        value="최근 결제 내역 보기"
        action="보기"
        onAction={() => router.push("/profile/payments")}
      />
      {/* 3. 영수증·세금계산서 — 자동 발급 미구현 */}
      <SettingsRow
        label="영수증·세금계산서"
        value="준비 중"
        action="발급"
        disabled
      />
      {/* 4. 구독 관리 — 기존 /profile/subscription 로 이동 (시안의 "플랜 변경" 자리 보강) */}
      <SettingsRow
        label="구독 관리"
        value={isPaid ? "활성 구독" : "구독 없음"}
        action="관리"
        onAction={() => router.push("/profile/subscription")}
      />

      {/* 시안 하단 2버튼: 플랜 변경 / 구독 취소 */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => router.push("/pricing")}
        >
          플랜 변경
        </button>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => router.push("/profile/subscription")}
          // 무료 플랜이면 "구독 취소" 의미 없음 → 비활성
          disabled={!isPaid}
          style={!isPaid ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          title={!isPaid ? "활성 구독이 없습니다" : undefined}
        >
          구독 취소
        </button>
      </div>
    </>
  );
}
