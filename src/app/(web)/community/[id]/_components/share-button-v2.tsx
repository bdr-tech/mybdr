"use client";

import { useToast } from "@/contexts/toast-context";

/**
 * ShareButtonV2 — BDR v2 시안 박제용
 * - 시안 위치: PostDetail.jsx Reactions 섹션의 .btn.btn--lg "공유"
 * - 데이터 로직(URL 클립보드 복사)은 ShareButton 과 100% 동일 — 박제(UI)만 새로 작성
 */
export function ShareButtonV2() {
  const { showToast } = useToast();

  // 현재 페이지 URL을 클립보드에 복사
  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => showToast("링크가 복사되었습니다", "success"))
      .catch(() => showToast("링크 복사에 실패했습니다", "error"));
  };

  return (
    // 시안 .btn.btn--lg — Material Symbols share 아이콘
    <button
      onClick={handleShare}
      className="btn btn--lg"
      aria-label="링크 복사"
      title="링크 복사"
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, verticalAlign: -3, marginRight: 6 }}
      >
        share
      </span>
      공유
    </button>
  );
}
