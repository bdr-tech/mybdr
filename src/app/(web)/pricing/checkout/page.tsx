"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TossPayments: (clientKey: string) => any;
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("planId");
  const [plan, setPlan] = useState<{ id: string; name: string; price: number; plan_type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const sdkLoaded = useRef(false);

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

  useEffect(() => {
    if (sdkLoaded.current) return;
    sdkLoaded.current = true;
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  async function handlePay() {
    if (!plan || !planId) return;
    setPaying(true);
    setError(null);

    try {
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0066FF] border-t-transparent" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-[#EF4444]">{error ?? "요금제를 찾을 수 없습니다."}</p>
        <a href="/pricing" className="text-sm text-[#F4A261] underline">요금제 목록으로</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-6 text-2xl font-bold">결제하기</h1>

      <div className="mb-6 rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-6">
        <h2 className="mb-1 text-lg font-semibold">{plan.name}</h2>
        <p className="mb-4 text-sm text-[#6B7280]">
          {plan.plan_type === "monthly" ? "월 구독 (30일)" : "1회 구매"}
        </p>
        <div className="border-t border-[#E8ECF0] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">결제 금액</span>
            <span className="text-xl font-bold text-[#F4A261]">{plan.price.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={paying}
        className="w-full rounded-[14px] bg-[#0066FF] py-4 font-semibold text-black transition-colors hover:bg-[#0052CC] disabled:opacity-50"
      >
        {paying ? "결제 진행 중..." : `${plan.price.toLocaleString()}원 결제하기`}
      </button>

      <p className="mt-4 text-center text-xs text-[#9CA3AF]">
        결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
      </p>

      <div className="mt-4 text-center">
        <a href="/pricing" className="text-sm text-[#6B7280] hover:text-[#111827]">
          ← 요금제 목록으로
        </a>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0066FF] border-t-transparent" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
