"use client";

/* ============================================================
 * ProfileBillingPage — 결제 허브 (구독 + 결제 내역 탭 통합)
 *
 * 왜 (M1 Day 8):
 *  - 기존 /profile/subscription + /profile/payments 두 페이지가 좌측 네비 "결제" 하나로 묶여 있었지만
 *    실제로는 별도 페이지라 사용자가 구독/내역을 오가기 위해 네비를 다시 눌러야 했음.
 *  - 한 페이지에 탭 2개로 통합 + 구 경로는 redirect 보존.
 *
 * 어떻게:
 *  - 탭 상태는 URL ?tab=subscription | payments 로 관리
 *  - 탭 전환은 router.replace(..., { scroll: false })
 *  - 비활성 탭 섹션은 조건부 렌더 → 해당 API(useSWR /api/web/profile/subscription 또는 /payments) 호출 절약
 *  - 기존 페이지들의 "뒤로" 버튼 (← /profile) 과 개별 h1 은 제거. 허브 단일 헤더 "결제"만.
 * ============================================================ */

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { TossCard } from "@/components/toss/toss-card";

type TabKey = "subscription" | "payments";
const VALID_TABS: TabKey[] = ["subscription", "payments"];

export default function ProfileBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL ?tab 우선, 없으면 subscription 기본
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey =
    rawTab && (VALID_TABS as string[]).includes(rawTab)
      ? (rawTab as TabKey)
      : "subscription";

  const handleTabChange = useCallback(
    (tab: TabKey) => {
      router.replace(`/profile/billing?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  return (
    <div className="max-w-[640px] mx-auto space-y-6 py-4 px-4">
      {/* ============ 허브 단일 헤더 ============ */}
      <h1
        className="text-2xl font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        결제
      </h1>

      {/* ============ 탭 바 (border-b-2 절제형) ============ */}
      <div
        role="tablist"
        aria-label="결제 카테고리"
        className="flex gap-6 border-b"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <TabButton
          label="구독"
          active={activeTab === "subscription"}
          onClick={() => handleTabChange("subscription")}
          controls="panel-subscription"
        />
        <TabButton
          label="결제 내역"
          active={activeTab === "payments"}
          onClick={() => handleTabChange("payments")}
          controls="panel-payments"
        />
      </div>

      {/* ============ 탭 패널 (조건부 렌더) ============ */}
      {activeTab === "subscription" && (
        <div
          role="tabpanel"
          id="panel-subscription"
          aria-labelledby="tab-subscription"
        >
          <SubscriptionSection />
        </div>
      )}

      {activeTab === "payments" && (
        <div
          role="tabpanel"
          id="panel-payments"
          aria-labelledby="tab-payments"
        >
          <PaymentsSection />
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * TabButton — 공통 탭 버튼 (Settings 페이지와 동일 스타일)
 * ============================================================ */
function TabButton({
  label,
  active,
  onClick,
  controls,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  controls: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className="relative -mb-px py-3 text-sm font-semibold transition-colors"
      style={{
        color: active
          ? "var(--color-primary)"
          : "var(--color-text-secondary)",
        borderBottom: active
          ? "2px solid var(--color-primary)"
          : "2px solid transparent",
      }}
    >
      {label}
    </button>
  );
}

/* ============================================================
 * SubscriptionSection — 구독 서브 섹션 (기존 /profile/subscription 이식)
 *
 * 원본: src/app/(web)/profile/subscription/page.tsx
 * 변경: 상단 "뒤로" + h1 제거, 나머지 동일
 * ============================================================ */

interface SubscriptionItem {
  id: string;
  plan: {
    id: string;
    name: string;
    description: string | null;
    plan_type: string;
    price: number;
    feature_key: string;
  };
  status: string;
  feature_key: string;
  started_at: string;
  expires_at: string | null;
  is_usable: boolean;
  created_at: string;
}

interface SubscriptionsResponse {
  subscriptions: SubscriptionItem[];
}

function getSubStatusInfo(
  status: string,
  isUsable: boolean
): { label: string; color: string } {
  if (status === "active") {
    return { label: "이용중", color: "var(--color-success, #22C55E)" };
  }
  if (status === "cancelled" && isUsable) {
    return { label: "해지 예정", color: "var(--color-accent)" };
  }
  if (status === "cancelled") {
    return { label: "해지됨", color: "var(--color-text-muted)" };
  }
  return { label: status, color: "var(--color-text-muted)" };
}

function SubscriptionSection() {
  const [cancelTarget, setCancelTarget] = useState<SubscriptionItem | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // useSWR: 이 섹션이 렌더될 때만 호출 (탭 조건부 렌더와 결합 = 결제 탭 활성일 땐 구독 API 호출 안됨)
  const { data, isLoading } = useSWR<SubscriptionsResponse>(
    "/api/web/profile/subscription",
    { revalidateOnFocus: false }
  );

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/web/profile/subscription", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: cancelTarget.id }),
      });
      const body = await res.json();
      if (res.ok) {
        mutate("/api/web/profile/subscription");
        setCancelTarget(null);
        alert("구독이 해지되었습니다. 만료일까지 계속 이용 가능합니다.");
      } else {
        alert(body.error || "해지에 실패했습니다.");
      }
    } catch {
      alert("해지 처리 중 오류가 발생했습니다.");
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          불러오는 중...
        </p>
      </div>
    );
  }

  const subscriptions = data?.subscriptions ?? [];

  return (
    <div className="space-y-4">
      {subscriptions.length === 0 ? (
        <TossCard>
          <div className="py-12 text-center">
            <span
              className="material-symbols-outlined text-4xl mb-3 block"
              style={{ color: "var(--color-text-disabled)" }}
            >
              card_membership
            </span>
            <p
              className="text-sm mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              구독 중인 요금제가 없습니다
            </p>
            <Link
              href="/pricing"
              className="inline-block text-sm font-bold px-4 py-2 rounded"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary, #FFFFFF)",
              }}
            >
              요금제 보기
            </Link>
          </div>
        </TossCard>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const statusInfo = getSubStatusInfo(sub.status, sub.is_usable);
            const canCancel = sub.status === "active";

            return (
              <TossCard key={sub.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3
                      className="text-base font-bold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {sub.plan.name}
                    </h3>
                    {sub.plan.description && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {sub.plan.description}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      color: statusInfo.color,
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                <div
                  className="space-y-2 text-xs sm:text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <div className="flex justify-between">
                    <span>요금</span>
                    <span
                      className="font-bold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {sub.plan.price.toLocaleString("ko-KR")}원 /{" "}
                      {sub.plan.plan_type === "monthly" ? "월" : "회"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>시작일</span>
                    <span>
                      {new Date(sub.started_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  {sub.expires_at && (
                    <div className="flex justify-between">
                      <span>만료일</span>
                      <span>
                        {new Date(sub.expires_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  )}
                </div>

                {canCancel && (
                  <button
                    className="w-full mt-4 py-2.5 rounded text-sm font-bold"
                    style={{
                      color: "var(--color-error, #EF4444)",
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border-subtle)",
                    }}
                    onClick={() => setCancelTarget(sub)}
                  >
                    구독 해지
                  </button>
                )}

                {sub.status === "cancelled" && sub.is_usable && sub.expires_at && (
                  <div
                    className="mt-4 p-3 rounded text-xs"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-sm align-text-bottom mr-1"
                      style={{ color: "var(--color-accent)" }}
                    >
                      info
                    </span>
                    {new Date(sub.expires_at).toLocaleDateString("ko-KR")}까지
                    계속 이용 가능합니다.
                  </div>
                )}
              </TossCard>
            );
          })}
        </div>
      )}

      {/* 해지 확인 모달 */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => !cancelling && setCancelTarget(null)}
        >
          <div
            className="w-[90%] max-w-[360px] rounded-md p-6"
            style={{ backgroundColor: "var(--color-bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ color: "var(--color-error, #EF4444)" }}
                >
                  cancel
                </span>
              </div>
            </div>

            <h2
              className="text-center text-lg font-bold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              구독을 해지하시겠습니까?
            </h2>
            <p
              className="text-center text-sm mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              <strong>{cancelTarget.plan.name}</strong> 구독이 해지됩니다.
            </p>
            {cancelTarget.expires_at && (
              <p
                className="text-center text-sm mb-6"
                style={{ color: "var(--color-text-muted)" }}
              >
                {new Date(cancelTarget.expires_at).toLocaleDateString("ko-KR")}
                까지는 계속 이용할 수 있습니다.
              </p>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-secondary)",
                }}
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                취소
              </button>
              <button
                className="flex-1 py-3 rounded text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-error, #EF4444)",
                  color: "var(--color-on-primary, #FFFFFF)",
                  opacity: cancelling ? 0.6 : 1,
                }}
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "처리중..." : "해지하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * PaymentsSection — 결제 내역 서브 섹션 (기존 /profile/payments 이식)
 *
 * 원본: src/app/(web)/profile/payments/page.tsx
 * 변경: 상단 "뒤로" + h1 제거, 나머지 동일
 * ============================================================ */

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

function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

function PaymentsSection() {
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<PaymentItem | null>(null);
  const [refunding, setRefunding] = useState(false);

  const { data, isLoading } = useSWR<PaymentsResponse>(
    `/api/web/profile/payments?page=${page}&limit=20`,
    { revalidateOnFocus: false }
  );

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
    <div className="space-y-6">
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
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block text-xs font-bold px-2 py-0.5 rounded mb-2"
                      style={{
                        color: statusInfo.color,
                        backgroundColor: "var(--color-surface)",
                      }}
                    >
                      {statusInfo.label}
                    </span>
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {p.description || p.payable_type}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {dateStr}
                      {p.payment_method ? ` · ${p.payment_method}` : ""}
                    </p>
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
                    {p.status === "paid" && (
                      <Link
                        href={`/pricing/success?orderId=${encodeURIComponent(p.order_id)}&amount=${p.final_amount}&method=${encodeURIComponent(p.payment_method ?? "카드")}`}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: "var(--color-primary)" }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "14px" }}
                        >
                          receipt
                        </span>
                        영수증
                      </Link>
                    )}
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

      {/* 환불 확인 모달 */}
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
                className="flex-1 py-3 rounded text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-error, #EF4444)",
                  color: "var(--color-on-primary, #FFFFFF)",
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
