"use client";

/**
 * ShareButton - 공유 버튼 (클라이언트 컴포넌트)
 * 현재 페이지 URL을 클립보드에 복사
 */
export function ShareButton() {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  };

  return (
    <button
      className="p-2 transition-colors"
      style={{ color: "var(--color-text-muted)" }}
      title="링크 복사"
      onClick={handleShare}
    >
      <span className="material-symbols-outlined">share</span>
    </button>
  );
}
