"use client";

/* ============================================================
 * /pricing/checkout — 결제 페이지 (BDR v2 스타일 정렬)
 *
 * 왜 이렇게:
 * - PM 지시: v2 토큰(.page/.card/var(--accent) 등)으로 정렬, breadcrumb·약관 라벨·me readOnly 노출 추가.
 * - 토스 SDK requestPayment 인자(method/amount/orderId/orderName/successUrl/failUrl/customerEmail/customerName)
 *   는 한 글자도 변경하지 않음. (PM 강조 포인트)
 *
 * 변경 요약:
 *   1) breadcrumb: 홈 › 요금제 › 결제
 *   2) 약관 라벨 4종 (UI 박제 — 결제 차단 X)
 *   3) /api/web/me 를 useEffect 로 미리 fetch → email/이름 readOnly input 노출
 *      (실패 시 무시, 빈 값은 "(미등록)" placeholder)
 *   4) plan_type 라벨: 기존 그대로 (monthly→"월 구독", 그 외→"1회 구매")
 *   5) loading / error / Suspense fallback 도 v2 spinner + .card 정렬
 * ============================================================ */

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Breadcrumb } from "@/components/shared/breadcrumb";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TossPayments: (clientKey: string) => any;
  }
}

// /api/web/me 응답 중 결제에 사용할 필드만 부분 타입으로 선언
// (id 는 Toss orderId 생성에 필요. email/nickname/name 은 결제 customer 식별용)
type MeInfo = {
  id?: string | number | null;
  email?: string | null;
  nickname?: string | null;
  name?: string | null;
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("planId");
  const [plan, setPlan] = useState<{ id: string; name: string; price: number; plan_type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const sdkLoaded = useRef(false);

  // 약관 동의 상태 — PM 지시: agreed=true 일 때만 결제 가능 (reviewer 지적 반영)
  // 이유: 필수 약관 3종(pg/third/refund) 모두 체크되어야 결제 버튼이 활성화됨.
  //       marketing 은 선택이므로 결제 차단 조건에서 제외.
  const [agreedTerms, setAgreedTerms] = useState<{
    pg: boolean;
    third: boolean;
    refund: boolean;
    marketing: boolean;
  }>({ pg: false, third: false, refund: false, marketing: false });

  // 필수 3종 모두 동의했는지 — 결제 버튼 disabled 판정에 사용
  const allRequiredAgreed = agreedTerms.pg && agreedTerms.third && agreedTerms.refund;

  // me 정보를 readOnly 표시용으로 미리 받아둔다.
  // 이유: 사용자가 결제 직전에 본인 이메일·이름이 맞는지 시각적으로 확인하길 원함(PM 지시).
  // 실패(401 등)는 무시 — handlePay 흐름에서 다시 검증하므로 readOnly 미표시여도 결제 진행 가능.
  const [me, setMe] = useState<MeInfo | null>(null);

  useEffect(() => {
    if (!planId) {
      router.replace("/pricing");
      return;
    }
    fetch(`/api/web/plans/${planId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setPlan(data);
      })
      .catch(() => setError("요금제 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [planId, router]);

  // 토스 SDK 스크립트 로드 (한 번만)
  useEffect(() => {
    if (sdkLoaded.current) return;
    sdkLoaded.current = true;
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // me 미리 fetch — readOnly input 표시용. 실패해도 결제 진행에는 영향 없음.
  useEffect(() => {
    fetch("/api/web/me")
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data) setMe(data);
      })
      .catch(() => {
        // 무시 — readOnly 미표시 상태로 결제는 가능
      });
  }, []);

  async function handlePay() {
    if (!plan || !planId) return;
    setPaying(true);
    setError(null);

    try {
      // ⚠️ 아래 로직(특히 toss.requestPayment 인자)은 한 글자도 건드리지 말 것
      const meRes = await fetch("/api/web/me");
      if (!meRes.ok) { router.push("/login"); return; }
      const me = await meRes.json();

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) throw new Error("결제 설정 오류");

      const toss = window.TossPayments(clientKey);
      const orderId = `PLAN-${planId}-${me.id}-${Date.now()}`;

      await toss.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: plan.price },
        orderId,
        orderName: plan.name,
        successUrl: `${window.location.origin}/api/web/payments/confirm?planId=${planId}`,
        failUrl: `${window.location.origin}/pricing/fail`,
        customerEmail: me.email ?? undefined,
        customerName: me.nickname ?? me.name ?? undefined,
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== "결제 취소") {
        setError(e.message || "결제 중 오류가 발생했습니다.");
      }
      setPaying(false);
    }
  }

  // ── v2 스타일 로딩 스피너 ─────────────────────────────
  // 이유: PM 지시 — Suspense fallback / loading 도 v2 톤으로(spinner는 var(--accent)).
  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid var(--accent)",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── v2 스타일 에러 카드 ─────────────────────────────
  if (error || !plan) {
    return (
      <div className="page">
        <div
          className="card"
          style={{
            maxWidth: 440,
            margin: "40px auto",
            padding: 32,
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: 16, color: "var(--accent)" }}>
            {error ?? "요금제를 찾을 수 없습니다."}
          </p>
          <a
            href="/pricing"
            style={{
              fontSize: 14,
              color: "var(--cafe-blue)",
              textDecoration: "underline",
            }}
          >
            요금제 목록으로
          </a>
        </div>
      </div>
    );
  }

  // me 응답에서 readOnly 표시할 값 추출 (없으면 "(미등록)" placeholder)
  const displayEmail = me?.email ?? "";
  const displayName = me?.nickname ?? me?.name ?? "";

  // plan_type 라벨 — 기존 규칙 보존 (PM 지시 4번)
  const planTypeLabel = plan.plan_type === "monthly" ? "월 구독 (30일)" : "1회 구매";

  return (
    <div className="page">
      {/* breadcrumb — 홈 › 요금제 › 결제 (PM 지시 1번) */}
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "요금제", href: "/pricing" },
            { label: "결제" },
          ]}
        />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.015em",
            marginBottom: 24,
            color: "var(--ink)",
          }}
        >
          결제하기
        </h1>

        {/* 요금제 요약 카드 */}
        <div
          className="card"
          style={{
            padding: 24,
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 4,
              color: "var(--ink)",
            }}
          >
            {plan.name}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--ink-mute)",
              marginBottom: 16,
            }}
          >
            {planTypeLabel}
          </p>
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 14, color: "var(--ink-mute)" }}>
              결제 금액
            </span>
            <span
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 22,
                fontWeight: 800,
                color: "var(--accent)",
              }}
            >
              {plan.price.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 결제자 정보 (readOnly) — PM 지시 3번 */}
        {/* 이유: 사용자가 결제 직전에 자기 이메일·이름이 맞는지 확인. 수정은 불가(readOnly). */}
        <div
          className="card"
          style={{
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 12,
            }}
          >
            결제자 정보
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                이메일
              </span>
              <input
                type="text"
                readOnly
                value={displayEmail}
                placeholder="(미등록)"
                className="input"
                // readOnly 시각적 구분: 살짝 흐린 배경
                style={{
                  background: "var(--bg-alt)",
                  color: displayEmail ? "var(--ink)" : "var(--ink-dim)",
                  cursor: "default",
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                이름
              </span>
              <input
                type="text"
                readOnly
                value={displayName}
                placeholder="(미등록)"
                className="input"
                style={{
                  background: "var(--bg-alt)",
                  color: displayName ? "var(--ink)" : "var(--ink-dim)",
                  cursor: "default",
                }}
              />
            </label>
          </div>
        </div>

        {/* 약관 4종 — PM 지시 2번 (UI 박제, 결제 차단 X) */}
        <div
          className="card"
          style={{
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 12,
            }}
          >
            약관 동의
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {([
              { key: "pg", label: "결제 대행 (필수)" },
              { key: "third", label: "개인정보 제3자 (필수)" },
              { key: "refund", label: "구독·환불 정책 (필수)" },
              { key: "marketing", label: "마케팅 정보 수신 (선택)" },
            ] as const).map((t) => (
              <li
                key={t.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--ink-soft)",
                }}
              >
                <input
                  type="checkbox"
                  // 체크 상태를 agreedTerms state 와 동기화 (reviewer 지적 반영)
                  checked={agreedTerms[t.key]}
                  onChange={(e) =>
                    setAgreedTerms((prev) => ({ ...prev, [t.key]: e.target.checked }))
                  }
                  style={{ accentColor: "var(--accent)" }}
                />
                {t.label}
              </li>
            ))}
          </ul>
        </div>

        {/* 에러 메시지 (결제 시도 중 발생) */}
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 8,
              fontSize: 13,
              background: "var(--accent-soft)",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
            }}
          >
            {error}
          </div>
        )}

        {/* 필수 약관 미체크 안내 — PM 지시 (reviewer 지적): 미체크일 때만 노출 */}
        {!allRequiredAgreed && (
          <p
            style={{
              marginBottom: 8,
              textAlign: "center",
              fontSize: 12,
              color: "var(--ink-dim)",
            }}
          >
            필수 약관 3건 동의 시 결제 가능
          </p>
        )}

        {/* 결제 버튼 — v2 .btn .btn--accent .btn--xl
            disabled: paying 중이거나 필수 약관 3종 미체크 시 비활성화 (reviewer 지적 반영) */}
        <button
          onClick={handlePay}
          disabled={paying || !allRequiredAgreed}
          className="btn btn--accent btn--xl"
        >
          {paying ? "결제 진행 중..." : `${plan.price.toLocaleString()}원 결제하기`}
        </button>

        <p
          style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 12,
            color: "var(--ink-mute)",
          }}
        >
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
        </p>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <a
            href="/pricing"
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              textDecoration: "none",
            }}
          >
            ← 요금제 목록으로
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        // Suspense fallback 도 v2 spinner (PM 지시: 추가 항목)
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: "2px solid var(--accent)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
