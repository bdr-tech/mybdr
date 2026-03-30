"use client";

/**
 * 프로필 완성 유도 배너
 *
 * 로그인 상태에서 프로필이 미완성(이름 없음)이면 상단에 배너를 표시한다.
 * "완성하기" 클릭 시 /profile/complete로 이동.
 * X 버튼 클릭 시 localStorage에 저장하여 24시간 동안 숨긴다.
 *
 * 토스 스타일: primary 배경 + 흰 텍스트 + rounded-xl
 */

import { useState, useEffect } from "react";
import Link from "next/link";

const DISMISS_KEY = "profile_banner_dismissed";
// 24시간(밀리초) — 닫기 후 하루 동안 안 보이게
const DISMISS_DURATION = 24 * 60 * 60 * 1000;

interface ProfileCompletionBannerProps {
  /** 유저 이름 (null이거나 빈 문자열이면 미완성으로 판단) */
  userName: string | null | undefined;
}

export function ProfileCompletionBanner({ userName }: ProfileCompletionBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 이름이 있으면 프로필 완성 상태 → 배너 불필요
    if (userName && userName.trim().length > 0) return;

    // localStorage에서 닫기 시간 확인 (24시간 이내면 숨김)
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DURATION) return;
    }

    setVisible(true);
  }, [userName]);

  if (!visible) return null;

  /** 닫기 버튼: localStorage에 현재 시간 저장 후 숨김 */
  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div
      className="mb-4 flex items-center justify-between rounded-xl px-4 py-3"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      {/* 좌측: 안내 텍스트 + 완성하기 링크 */}
      <div className="flex items-center gap-3 text-white">
        <span className="material-symbols-outlined text-xl">person</span>
        <span className="text-sm font-medium">
          프로필을 완성하고 경기에 참여하세요
        </span>
        <Link
          href="/profile/complete"
          className="ml-1 rounded-lg px-3 py-1 text-sm font-bold text-white underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          완성하기 &rarr;
        </Link>
      </div>

      {/* 우측: 닫기 버튼 (24시간 안 보기) */}
      <button
        onClick={handleDismiss}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        aria-label="배너 닫기"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}
