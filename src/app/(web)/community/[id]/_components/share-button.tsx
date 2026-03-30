"use client";

import { useToast } from "@/contexts/toast-context";

/**
 * ShareButton - 공유 버튼 (클라이언트 컴포넌트)
 * 현재 페이지 URL을 클립보드에 복사 후 토스트로 피드백
 */
export function ShareButton() {
  const { showToast } = useToast();

  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => showToast("링크가 복사되었습니다", "success"))
      .catch(() => showToast("링크 복사에 실패했습니다", "error"));
  };

  return (
    <button
      className="p-2 transition-colors"
      style={{ color: "var(--color-text-muted)" }}
      aria-label="링크 복사"
      title="링크 복사"
      onClick={handleShare}
    >
      <span className="material-symbols-outlined">share</span>
    </button>
  );
}
