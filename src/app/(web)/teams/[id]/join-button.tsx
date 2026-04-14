"use client";

import { useState } from "react";

// 입단 신청 + 매치 제안 + 공유 버튼 그룹
// 기존 입단 신청/탈퇴 로직 100% 유지, 스타일만 변경
export function TeamJoinButton({ teamId }: { teamId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // 기존 입단 신청 API 호출 로직 유지
  async function handleJoin() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/join`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message ?? "완료!", type: "success" });
      } else {
        setMessage({ text: data.error ?? "오류가 발생했습니다.", type: "error" });
      }
    } catch {
      setMessage({ text: "네트워크 오류가 발생했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // 공유 기능 — Web Share API 또는 클립보드 복사
  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "BDR 팀 페이지", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setMessage({ text: "링크가 복사되었습니다!", type: "success" });
        setTimeout(() => setMessage(null), 2000);
      }).catch(() => {});
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {/* 결과 메시지 */}
      {message && (
        <p className={`text-xs font-medium ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      <div className="flex items-center gap-3">
        {/* 공유 아이콘 버튼 */}
        <button
          type="button"
          onClick={handleShare}
          className="flex h-10 w-10 items-center justify-center rounded border border-white/30 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          title="공유하기"
        >
          <span className="material-symbols-outlined text-xl">share</span>
        </button>

        {/* 매치 제안 버튼 (아웃라인 스타일) */}
        <button
          type="button"
          className="rounded border border-[var(--color-primary)] px-3 sm:px-6 py-2 sm:py-2.5 text-sm font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10 whitespace-nowrap"
        >
          매치 제안
        </button>

        {/* 입단 신청 버튼 (메인 CTA) — 기존 로직 유지 */}
        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="flex items-center gap-2 rounded bg-[var(--color-primary)] px-3 sm:px-6 py-2 sm:py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[var(--color-primary-hover)] disabled:opacity-50 whitespace-nowrap"
          style={{ boxShadow: "0 4px 14px var(--color-primary-light)" }}
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          {loading ? "신청 중..." : "입단 신청"}
        </button>
      </div>
    </div>
  );
}
