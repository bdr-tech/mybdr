"use client";

import { useToast } from "@/contexts/toast-context";

/* ============================================================
 * ShareTournamentButton — 대회 링크 공유 버튼
 * 클릭 시 현재 페이지 URL을 클립보드에 복사하고 토스트로 피드백
 *
 * variant:
 * - "default" (기본): 사이드바용 — 전체 너비, 테두리, 큰 버튼
 * - "inline": 히어로 액션 바용 — 작고 컴팩트한 인라인 버튼
 * ============================================================ */
export function ShareTournamentButton({ variant = "default" }: { variant?: "default" | "inline" }) {
  const { showToast } = useToast();

  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => showToast("링크가 복사되었습니다", "success"))
      .catch(() => showToast("링크 복사에 실패했습니다", "error"));
  };

  // 인라인 variant: 히어로 배너 하단 액션 바에서 사용
  if (variant === "inline") {
    return (
      <button
        onClick={handleShare}
        className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
        style={{ color: "inherit" }}
      >
        <span className="material-symbols-outlined text-sm">link</span>
        <span className="hidden sm:inline">복사</span>
      </button>
    );
  }

  // 기본 variant: 사이드바에서 사용
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
