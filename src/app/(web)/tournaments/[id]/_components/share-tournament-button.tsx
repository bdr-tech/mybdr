"use client";

import { useToast } from "@/contexts/toast-context";

/* ============================================================
 * ShareTournamentButton — 대회 링크 공유 버튼
 * 클릭 시 현재 페이지 URL을 클립보드에 복사하고 토스트로 피드백
 * 서버 컴포넌트(tournament-sidebar.tsx)에서 사용하기 위해 별도 분리
 * ============================================================ */
export function ShareTournamentButton() {
  const { showToast } = useToast();

  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => showToast("링크가 복사되었습니다", "success"))
      .catch(() => showToast("링크 복사에 실패했습니다", "error"));
  };

  return (
    <button
      onClick={handleShare}
      className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
    >
      <span className="material-symbols-outlined text-base" style={{ color: "var(--color-info)" }}>
        link
      </span>
      링크 복사
    </button>
  );
}
