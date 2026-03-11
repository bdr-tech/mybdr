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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95">
      <div className="text-center">
        {/* Success check animation */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#22C55E] animate-[scale-in_0.3s_ease-out]">
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

        <h2 className="mb-2 text-xl font-bold text-[#111827]">경기가 만들어졌어요!</h2>
        <p className="mb-6 text-sm text-[#9CA3AF]">참가 신청을 기다리는 중입니다</p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (gameId) router.push(`/games/${gameId}`);
              else router.push("/games");
            }}
            className="rounded-full bg-[#0066FF] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0052CC]"
          >
            경기 보러 가기
          </button>
          <button
            type="button"
            onClick={() => router.push("/games/new")}
            className="rounded-full border border-[#E8ECF0] px-6 py-3 text-sm text-[#6B7280] hover:bg-[#F5F7FA]"
          >
            또 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
