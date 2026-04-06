"use client";

/**
 * 결제 내역 페이지 (/profile/payments)
 *
 * - 본인 결제 내역 목록 표시
 * - 각 건에 환불 버튼 (7일 이내 + paid 상태)
 * - 환불 확인 모달 포함
 */

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { TossCard } from "@/components/toss/toss-card";
import { TossSectionHeader } from "@/components/toss/toss-section-header";

// 결제 건 타입
interface PaymentItem {
  id: string;
  order_id: string;
  payable_type: string;
  amount: number;
  final_amount: number;
  payment_method: string | null;
  status: string;
  paid_at: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  created_at: string;
  description: string | null;
  can_refund: boolean;
}

interface PaymentsResponse {
  payments: PaymentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// 결제 상태 라벨 + 색상
function getStatusInfo(status: string): { label: string; color: string } {
  switch (status) {
    case "paid":
      return { label: "결제완료", color: "var(--color-success, #22C55E)" };
    case "refunded":
      return { label: "환불완료", color: "var(--color-text-muted)" };
    case "pending":
      return { label: "대기중", color: "var(--color-accent)" };
    case "failed":
      return { label: "실패", color: "var(--color-error, #EF4444)" };
    default:
      return { label: status, color: "var(--color-text-muted)" };
  }
}

// 금액 포맷 (천 단위 콤마)
function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  // 환불 모달 상태
  const [refundTarget, setRefundTarget] = useState<PaymentItem | null>(null);
  const [refunding, setRefunding] = useState(false);

  const { data, isLoading } = useSWR<PaymentsResponse>(
    `/api/web/profile/payments?page=${page}&limit=20`,
    { revalidateOnFocus: false }
  );

  // 환불 실행
  const handleRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      const res = await fetch(`/api/web/payments/${refundTarget.id}/refund`, {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json();
      if (res.ok) {
        // 목록 새로고침
        mutate(`/api/web/profile/payments?page=${page}&limit=20`);
        setRefundTarget(null);
        alert("환불이 완료되었습니다.");
      } else {
        alert(body.error || "환불에 실패했습니다.");
      }
    } catch {
      alert("환불 처리 중 오류가 발생했습니다.");
    } finally {
      setRefunding(false);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          불러오는 중...
        </p>
      </div>
    );
  }

  const payments = data?.payments ?? [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-[640px] mx-auto space-y-6 py-4">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-3 px-1">
        <Link href="/profile">
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: "var(--color-text-secondary)" }}
          >
            arrow_back
          </span>
        </Link>
        <h1
          className="text-lg font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          결제 내역
        </h1>
      </div>

      {/* 결제 내역 목록 */}
      {payments.length === 0 ? (
        <TossCard>
          <div className="py-12 text-center">
            <span
              className="material-symbols-outlined text-4xl mb-3 block"
              style={{ color: "var(--color-text-disabled)" }}
            >
              receipt_long
            </span>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              결제 내역이 없습니다
            </p>
          </div>
        </TossCard>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const statusInfo = getStatusInfo(p.status);
            const dateStr = p.paid_at
              ? new Date(p.paid_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : new Date(p.created_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

            return (
              <TossCard key={p.id}>
                <div className="flex items-start justify-between">
                  {/* 좌: 결제 정보 */}
                  <div className="flex-1 min-w-0">
                    {/* 결제 상태 배지 */}
                    <span
                      className="inline-block text-xs font-bold px-2 py-0.5 rounded mb-2"
                      style={{
                        color: statusInfo.color,
                        backgroundColor: "var(--color-surface)",
                      }}
                    >
                      {statusInfo.label}
                    </span>
                    {/* 결제 설명 또는 타입 */}
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {p.description || p.payable_type}
                    </p>
                    {/* 날짜 + 결제수단 */}
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {dateStr}
                      {p.payment_method ? ` · ${p.payment_method}` : ""}
                    </p>
                    {/* 환불 정보 */}
                    {p.status === "refunded" && p.refunded_at && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        환불일:{" "}
                        {new Date(p.refunded_at).toLocaleDateString("ko-KR")}
                        {p.refund_amount
                          ? ` · ${formatAmount(p.refund_amount)}`
                          : ""}
                      </p>
                    )}
                  </div>

                  {/* 우: 금액 + 환불 버튼 */}
                  <div className="text-right shrink-0 ml-4">
                    <p
                      className="text-base font-bold"
                      style={{
                        color:
                          p.status === "refunded"
                            ? "var(--color-text-muted)"
                            : "var(--color-text-primary)",
                        textDecoration:
                          p.status === "refunded" ? "line-through" : "none",
                      }}
                    >
                      {formatAmount(p.final_amount)}
                    </p>
                    {/* 결제완료 건에 영수증 보기 링크 */}
                    {p.status === "paid" && (
                      <Link
                        href={`/pricing/success?orderId=${encodeURIComponent(p.order_id)}&amount=${p.final_amount}&method=${encodeURIComponent(p.payment_method ?? "카드")}`}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: "var(--color-primary)" }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                          receipt
                        </span>
                        영수증
                      </Link>
                    )}
                    {/* 환불 가능하면 환불 버튼 표시 */}
                    {p.can_refund && (
                      <button
                        className="mt-2 text-xs font-bold px-3 py-1 rounded"
                        style={{
                          color: "var(--color-error, #EF4444)",
                          backgroundColor: "var(--color-surface)",
                          border: "1px solid var(--color-error, #EF4444)",
                        }}
                        onClick={() => setRefundTarget(p)}
                      >
                        환불
                      </button>
                    )}
                  </div>
                </div>
              </TossCard>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="text-sm font-bold px-3 py-1 rounded disabled:opacity-30"
            style={{ color: "var(--color-primary)" }}
          >
            이전
          </button>
          <span
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            {page} / {pagination.total_pages}
          </span>
          <button
            disabled={page >= pagination.total_pages}
            onClick={() => setPage(page + 1)}
            className="text-sm font-bold px-3 py-1 rounded disabled:opacity-30"
            style={{ color: "var(--color-primary)" }}
          >
            다음
          </button>
        </div>
      )}

      {/* ============ 환불 확인 모달 ============ */}
      {refundTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => !refunding && setRefundTarget(null)}
        >
          <div
            className="w-[90%] max-w-[360px] rounded-md p-6"
            style={{ backgroundColor: "var(--color-bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 아이콘 */}
            <div className="flex justify-center mb-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ color: "var(--color-error, #EF4444)" }}
                >
                  currency_exchange
                </span>
              </div>
            </div>

            <h2
              className="text-center text-lg font-bold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              환불하시겠습니까?
            </h2>
            <p
              className="text-center text-sm mb-6"
              style={{ color: "var(--color-text-muted)" }}
            >
              {formatAmount(refundTarget.final_amount)}이 환불됩니다.
              <br />
              환불 후에는 되돌릴 수 없습니다.
            </p>

            {/* 버튼 그룹 */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-secondary)",
                }}
                onClick={() => setRefundTarget(null)}
                disabled={refunding}
              >
                취소
              </button>
              <button
                className="flex-1 py-3 rounded text-sm font-bold text-white"
                style={{
                  backgroundColor: "var(--color-error, #EF4444)",
                  opacity: refunding ? 0.6 : 1,
                }}
                onClick={handleRefund}
                disabled={refunding}
              >
                {refunding ? "처리중..." : "환불하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
