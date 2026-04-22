"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * HostActions — 경기 호스트에게만 보이는 수정/취소 버튼
 * - 수정: /games/[id]/edit 페이지로 이동
 * - 취소: 확인 모달 후 DELETE API 호출 (soft delete → status=5)
 */
export function HostActions({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // 경기 취소 핸들러 — DELETE /api/web/games/[uuid]
  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/web/games/${gameId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? "취소 처리 중 오류가 발생했습니다.");
        return;
      }
      // 취소 성공 → 경기 목록으로 이동
      router.push("/games");
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setCancelling(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      {/* 수정/취소 버튼 — 호스트 전용 */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => router.push(`/games/${gameId}/edit`)}
          className="flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">edit</span>
          경기 수정
        </Button>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-1.5 rounded px-4 py-2.5 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
        >
          <span className="material-symbols-outlined text-base">cancel</span>
          경기 취소
        </button>
      </div>

      {/* 취소 확인 모달 — 배경 클릭/ESC 닫기 */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !cancelling && setShowConfirm(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-[var(--color-card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 경고 아이콘 */}
            <div className="mb-4 flex justify-center">
              <span className="material-symbols-outlined text-4xl text-[var(--color-error)]">
                warning
              </span>
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-[var(--color-text-primary)]">
              경기를 취소하시겠습니까?
            </h3>
            <p className="mb-6 text-center text-sm text-[var(--color-text-muted)]">
              취소된 경기는 되돌릴 수 없으며, 참가 신청자에게 알림이 발송됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={cancelling}
                className="flex-1 rounded px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-elevated)] border border-[var(--color-border)]"
              >
                돌아가기
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 rounded bg-[var(--color-error)] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-error)]/90 disabled:opacity-50"
              >
                {cancelling ? "취소 처리중..." : "경기 취소"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
