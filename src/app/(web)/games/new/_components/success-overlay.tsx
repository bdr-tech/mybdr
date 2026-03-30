"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface SuccessOverlayProps {
  gameId: string;
}

export function SuccessOverlay({ gameId }: SuccessOverlayProps) {
  const router = useRouter();

  // Auto-redirect after 1.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (gameId) {
        router.push(`/games/${gameId}`);
      } else {
        router.push("/games");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [gameId, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-card)]/95">
      <div className="text-center">
        {/* Success check animation */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-success)] animate-[scale-in_0.3s_ease-out]">
          <svg
            className="h-10 w-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">경기가 만들어졌어요!</h2>
        <p className="mb-6 text-sm text-[var(--color-text-secondary)]">참가 신청을 기다리는 중입니다</p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (gameId) router.push(`/games/${gameId}`);
              else router.push("/games");
            }}
            className="rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
          >
            경기 보러 가기
          </button>
          <button
            type="button"
            onClick={() => router.push("/games/new")}
            className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
          >
            또 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
