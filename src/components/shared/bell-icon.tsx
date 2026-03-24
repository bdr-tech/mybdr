"use client";

import Link from "next/link";
// lucide-react 제거 → Material Symbols Outlined 사용

interface BellIconProps {
  unreadCount: number;
}

export function BellIcon({ unreadCount }: BellIconProps) {
  return (
    <Link
      href="/notifications"
      // 하드코딩 색상 -> CSS 변수 기반 Tailwind 테마 클래스로 전환
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-primary-light hover:text-text-primary transition-colors"
      aria-label={unreadCount > 0 ? `알림 ${unreadCount}개 읽지 않음` : "알림"}
    >
      {/* Material Symbols 알림 아이콘 -- 20px 크기 */}
      <span className="material-symbols-outlined text-xl" aria-hidden="true">notifications</span>
      {/* 읽지 않은 알림 뱃지 -- bg-error로 CSS 변수 기반 색상 사용 */}
      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-xs font-bold leading-none text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
