"use client";

import { useEffect } from "react";
import Link from "next/link";

export function ProfileIncompleteBanner() {
  // 페이지 로드 시 fire-and-forget으로 reminder 기록
  useEffect(() => {
    fetch("/api/web/me/profile-reminder", { method: "PATCH" }).catch(() => {});
  }, []);

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-[12px] bg-[#FFF8F0] px-4 py-3 border border-[#F4A261]/30">
      <p className="text-sm text-[#92400E]">
        🔔 프로필을 완성하면 경기 신청이 더 편리해요.
      </p>
      <Link
        href="/profile/edit"
        className="flex-shrink-0 rounded-[8px] bg-[#F4A261] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#E8935A] transition-colors"
      >
        지금 완성하기
      </Link>
    </div>
  );
}
