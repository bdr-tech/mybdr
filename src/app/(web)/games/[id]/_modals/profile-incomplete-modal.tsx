"use client";

import Link from "next/link";

interface ProfileIncompleteModalProps {
  missingFields: string[];
  onClose: () => void;
}

export function ProfileIncompleteModal({
  missingFields,
  onClose,
}: ProfileIncompleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-[20px] bg-[var(--color-card)] p-6 shadow-xl">
        <div className="mb-4 text-center text-3xl">👤</div>
        <h3 className="mb-2 text-center text-lg font-bold text-[var(--color-text-primary)]">
          프로필을 완성해주세요
        </h3>
        <p className="mb-4 text-center text-sm text-[var(--color-text-muted)]">
          참가 신청을 위해 아래 정보를 입력해야 합니다.
        </p>
        {missingFields.length > 0 && (
          <div className="mb-4 rounded-[12px] bg-[var(--color-warning)]/10 px-4 py-3">
            <p className="text-xs font-medium text-[var(--color-warning)]">미입력 항목</p>
            <p className="mt-1 text-sm text-[var(--color-warning)]">
              {missingFields.join(", ")}
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-[12px] border border-[var(--color-border)] py-2.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
          >
            나중에
          </button>
          <Link
            href="/profile/edit"
            className="flex-1 rounded-[12px] bg-[var(--color-accent)] py-2.5 text-center text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
          >
            프로필 완성하기
          </Link>
        </div>
      </div>
    </div>
  );
}
