"use client";

/**
 * 결제 성공 페이지 (/pricing/success)
 *
 * 기존 단순 체크 아이콘 → 영수증 형태로 개선.
 * URL searchParams에서 orderId, amount, method 등을 읽어 표시.
 * 인쇄 버튼 포함.
 */

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

// 금액 포맷 (천 단위 콤마 + 원)
function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

function ReceiptContent() {
  const searchParams = useSearchParams();

  // URL에서 결제 정보 추출
  const orderId = searchParams.get("orderId") ?? "-";
  const paymentKey = searchParams.get("paymentKey") ?? "";
  const amount = Number(searchParams.get("amount")) || 0;
  const method = searchParams.get("method") ?? "카드";

  // 현재 시각을 결제 시각으로 표시
  const paidAt = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 브라우저 인쇄 기능 호출
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 px-4">
      {/* 영수증 카드 */}
      <div
        className="w-full max-w-[400px] rounded-lg overflow-hidden"
        style={{
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* 상단 성공 헤더 */}
        <div
          className="flex flex-col items-center py-6 px-4"
          style={{ backgroundColor: "var(--color-primary-light)" }}
        >
          <div
            className="mb-3 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ color: "var(--color-text-on-primary)" }}
            >
              check
            </span>
          </div>
          <h1
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            결제 완료
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            구독이 활성화되었습니다
          </p>
        </div>

        {/* 구분선 (영수증 느낌의 점선) */}
        <div
          className="border-t border-dashed"
          style={{ borderColor: "var(--color-border)" }}
        />

        {/* 결제 상세 */}
        <div className="px-5 py-5 space-y-4">
          {/* 금액 (큰 글씨로 강조) */}
          {amount > 0 && (
            <div className="text-center pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {formatAmount(amount)}
              </p>
            </div>
          )}

          {/* 상세 항목들 */}
          <div className="space-y-3">
            {/* 주문 번호 */}
            <div className="flex justify-between items-center">
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                주문번호
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {orderId}
              </span>
            </div>

            {/* 결제 수단 */}
            <div className="flex justify-between items-center">
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                결제수단
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {method}
              </span>
            </div>

            {/* 결제 일시 */}
            <div className="flex justify-between items-center">
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                결제일시
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {paidAt}
              </span>
            </div>

            {/* 결제 키 (일부만 표시) */}
            {paymentKey && (
              <div className="flex justify-between items-center">
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  승인번호
                </span>
                <span
                  className="text-xs font-medium font-mono"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {paymentKey.slice(0, 12)}...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div
          className="border-t border-dashed"
          style={{ borderColor: "var(--color-border)" }}
        />

        {/* 하단 버튼들 */}
        <div className="px-5 py-4 flex gap-3">
          {/* 인쇄 버튼 */}
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded text-sm font-bold transition-colors"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-secondary)",
            }}
          >
            <span className="material-symbols-outlined text-lg">print</span>
            인쇄
          </button>
          {/* 홈으로 */}
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded text-sm font-bold transition-colors"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-on-primary)",
            }}
          >
            <span className="material-symbols-outlined text-lg">home</span>
            홈으로
          </Link>
        </div>
      </div>

      {/* 카드 아래 보조 링크 */}
      <div className="mt-6 flex gap-4">
        <Link
          href="/pricing"
          className="text-xs transition-colors hover:underline"
          style={{ color: "var(--color-text-muted)" }}
        >
          요금제 보기
        </Link>
        {/* Day 8: /profile/payments → /profile/billing?tab=payments (결제 허브 통합) */}
        <Link
          href="/profile/billing?tab=payments"
          className="text-xs transition-colors hover:underline"
          style={{ color: "var(--color-text-muted)" }}
        >
          결제 내역
        </Link>
      </div>
    </div>
  );
}

// useSearchParams는 Suspense boundary가 필요
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            불러오는 중...
          </p>
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  );
}
