"use client";

import Link from "next/link";

type UpgradeReason = "pickup_hosting" | "team_creation";

interface UpgradeModalProps {
  reason: UpgradeReason;
  onClose: () => void;
}

const UPGRADE_INFO: Record<UpgradeReason, { title: string; description: string; plan: string; price: string }> = {
  pickup_hosting: {
    title: "픽업 호스트 계정이 필요합니다",
    description: "픽업 게임을 개설하려면 픽업 호스트 이상 계정이 필요합니다.",
    plan: "픽업 호스트",
    price: "₩50,000/월",
  },
  team_creation: {
    title: "팀장 계정이 필요합니다",
    description: "팀 대결을 개설하려면 팀장 이상 계정이 필요합니다.",
    plan: "팀장",
    price: "₩3,900/월",
  },
};

export function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const info = UPGRADE_INFO[reason];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-[20px] bg-[var(--color-card)] p-6 shadow-xl mx-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{info.title}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{info.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 flex-shrink-0 text-xl leading-none text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            ✕
          </button>
        </div>

        <div className="mb-5 rounded-[16px] bg-[var(--color-surface-bright)] px-4 py-3">
          <p className="text-sm text-[var(--color-text-primary)]">
            <span className="font-semibold">{info.plan}</span>
            <span className="ml-2 text-[var(--color-primary)]">{info.price}</span>
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">현재 관리자 승인으로 이용 가능합니다.</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[12px] border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
          >
            닫기
          </button>
          <Link
            href="/upgrade"
            className="flex-1 rounded-[12px] bg-[var(--color-accent)] py-2.5 text-center text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
          >
            플랜 알아보기
          </Link>
        </div>
      </div>
    </div>
  );
}
