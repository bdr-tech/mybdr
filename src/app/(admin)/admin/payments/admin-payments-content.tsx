"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 서버에서 직렬화된 결제 타입
interface SerializedPayment {
  id: string;
  paymentCode: string;
  payableType: string;
  payableId: string;
  finalAmount: number;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  paid: "완료",
  failed: "실패",
  cancelled: "취소",
  refunded: "환불",
  // 부분 환불 — 결제 일부만 환불된 상태 (refund-policy: D-2~D-1 50% 등)
  partial_refunded: "부분 환불",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
  paid: "text-[var(--color-success)] bg-[var(--color-success)]/10",
  failed: "text-[var(--color-error)] bg-[var(--color-error)]/10",
  cancelled: "text-[var(--color-text-muted)] bg-[var(--color-elevated)]",
  refunded: "text-[var(--color-info)] bg-[var(--color-info)]/10",
  // 부분 환불은 환불(info)과 같은 톤 유지 — 시각적 일관성
  partial_refunded: "text-[var(--color-info)] bg-[var(--color-info)]/10",
};

interface Props {
  payments: SerializedPayment[];
  stats: {
    totalCount: number;
    paidCount: number;
    totalPaid: number;
  };
}

export function AdminPaymentsContent({ payments, stats }: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedPayment | null>(null);

  const filtered =
    activeTab === "all"
      ? payments
      : payments.filter((p) => p.status === activeTab);

  const tabs = [
    { key: "all", label: "전체", count: payments.length },
    { key: "pending", label: "대기", count: payments.filter((p) => p.status === "pending").length },
    { key: "paid", label: "완료", count: payments.filter((p) => p.status === "paid").length },
    { key: "failed", label: "실패", count: payments.filter((p) => p.status === "failed").length },
  ];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  return (
    <>
      {/* 통계 카드 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-[var(--color-text-muted)]">총 결제 건수</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl">{stats.totalCount.toLocaleString()}건</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-text-muted)]">완료 건수</p>
          <p className="mt-1 text-xl font-bold text-[var(--color-success)] sm:text-2xl">{stats.paidCount.toLocaleString()}건</p>
        </Card>
        <Card>
          <p className="text-xs text-[var(--color-text-muted)]">총 결제 금액</p>
          <p className="mt-1 text-xl font-bold sm:text-2xl">{stats.totalPaid.toLocaleString()}원</p>
        </Card>
      </div>

      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 축소된 테이블: 유저 / 금액 / 상태 / 날짜 (4칸) */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-5 py-4 font-medium">유저</th>
                <th className="w-[120px] px-5 py-4 font-medium">금액</th>
                <th className="w-[80px] px-5 py-4 font-medium">상태</th>
                <th className="w-[90px] px-5 py-4 font-medium">날짜</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="cursor-pointer border-b border-[var(--color-border-subtle)] transition-colors hover:bg-[var(--color-elevated)]"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {p.userName ?? "사용자"}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {p.userEmail ?? "-"}
                    </p>
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    {p.finalAmount.toLocaleString()}원
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLOR[p.status] ?? "text-[var(--color-text-muted)] bg-[var(--color-elevated)]"
                      }`}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {fmtDate(p.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">
            결제 내역이 없습니다.
          </div>
        )}
      </Card>

      {/* 상세 모달 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title="결제 상세"
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="결제 정보"
              rows={[
                ["결제 코드", selected.paymentCode],
                ["유저", selected.userName ?? selected.userEmail ?? "-"],
                ["대상", `${selected.payableType}#${selected.payableId}`],
                ["금액", `${selected.finalAmount.toLocaleString()}원`],
                ["결제 방법", selected.paymentMethod ?? "-"],
                ["상태", (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLOR[selected.status] ?? ""
                    }`}
                  >
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                )],
              ]}
            />
            <ModalInfoSection
              title="일시"
              rows={[["결제일", fmtDate(selected.createdAt)]]}
            />
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
