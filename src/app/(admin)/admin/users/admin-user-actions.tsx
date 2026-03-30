"use client";

import { useState } from "react";

interface Props {
  userId: string;
  nickname: string;
  isWithdrawn: boolean;
  forceWithdrawAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function AdminUserActions({ userId, nickname, isWithdrawn, forceWithdrawAction, deleteAction }: Props) {
  const [confirm, setConfirm] = useState<"withdraw" | "delete" | null>(null);
  const [pending, setPending] = useState(false);

  const handleAction = async (action: (formData: FormData) => Promise<void>) => {
    setPending(true);
    const fd = new FormData();
    fd.set("user_id", userId);
    await action(fd);
    setPending(false);
    setConfirm(null);
  };

  if (confirm) {
    const isDelete = confirm === "delete";
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-[var(--color-error)]">
          {isDelete ? "삭제" : "탈퇴"}?
        </span>
        <button
          onClick={() => handleAction(isDelete ? deleteAction : forceWithdrawAction)}
          disabled={pending}
          className="rounded-full bg-[var(--color-error)] px-2 py-0.5 text-xs font-semibold text-white hover:bg-[var(--color-error-hover,#DC2626)] disabled:opacity-50"
        >
          {pending ? "..." : "확인"}
        </button>
        <button
          onClick={() => setConfirm(null)}
          disabled={pending}
          className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {!isWithdrawn && (
        <button
          onClick={() => setConfirm("withdraw")}
          className="rounded-full bg-[var(--color-warning)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-warning)] hover:bg-[var(--color-warning)]/20"
        >
          강제탈퇴
        </button>
      )}
      <button
        onClick={() => setConfirm("delete")}
        className="rounded-full bg-[var(--color-error)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-error)] hover:bg-[var(--color-error)]/20"
      >
        삭제
      </button>
    </div>
  );
}
