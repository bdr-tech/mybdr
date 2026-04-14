"use client";

/**
 * 구독 관리 페이지 (/profile/subscription)
 *
 * - 내 구독 현황 표시 (활성/해지/만료)
 * - 해지 버튼 + 확인 모달
 * - 해지해도 만료일까지 이용 가능하다는 안내
 */

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { TossCard } from "@/components/toss/toss-card";

// 구독 아이템 타입
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

// 구독 상태 라벨 + 색상
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

export default function SubscriptionPage() {
  // 해지 모달 상태
  const [cancelTarget, setCancelTarget] = useState<SubscriptionItem | null>(
    null
  );
  const [cancelling, setCancelling] = useState(false);

  const { data, isLoading } = useSWR<SubscriptionsResponse>(
    "/api/web/profile/subscription",
    { revalidateOnFocus: false }
  );

  // 해지 실행
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

  // 로딩
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
          구독 관리
        </h1>
      </div>

      {/* 구독 목록 */}
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
                color: "#FFFFFF",
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
                {/* 상단: 플랜명 + 상태 */}
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

                {/* 상세 정보 */}
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

                {/* 해지 버튼 (active 상태만) */}
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

                {/* 해지 예정 안내 */}
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

      {/* ============ 해지 확인 모달 ============ */}
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

            {/* 버튼 그룹 */}
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
                className="flex-1 py-3 rounded text-sm font-bold text-white"
                style={{
                  backgroundColor: "var(--color-error, #EF4444)",
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
