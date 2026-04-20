"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ============================================================
 * ProfileDropdown — 헤더 우측 프로필 아이콘 클릭 시 드롭다운 메뉴
 *
 * 구조: B 아이콘 클릭 → 드롭다운 패널 (4카테고리 플랫 목록)
 * - 외부 클릭(mousedown) + ESC 키로 닫힘
 * - 각 링크 클릭 시 닫힘 + 페이지 이동
 * - z-50, var(--color-card) 배경, shadow-lg, rounded-md
 *
 * 사용처: layout.tsx 헤더 우측 프로필 아이콘 자리
 * ============================================================ */

// 5개 카테고리 (각각 페이지로 이동, 하위 항목 없음)
// "맞춤 설정"을 "내 정보"와 "계정" 사이에 단독 항목으로 배치
const menuItems = [
  { href: "/profile/basketball", label: "내 농구", icon: "sports_basketball", subtitle: "팀 · 경기 · 대회 · 주간 리포트" },
  { href: "/profile/growth", label: "내 성장", icon: "trending_up", subtitle: "XP · 레벨 · 뱃지 · 도장깨기" },
  { href: "/profile/edit", label: "내 정보", icon: "person", subtitle: "프로필 편집 · 소셜 계정" },
  // Day 8: /profile/preferences → /profile/settings (맞춤 설정 + 알림 통합 허브)
  { href: "/profile/settings", label: "맞춤 설정", icon: "tune", subtitle: "종별 · 경기유형 · 지역 · 실력" },
  // Day 8: /profile/subscription → /profile/billing (구독 + 결제 내역 통합 허브)
  { href: "/profile/billing", label: "계정", icon: "settings", subtitle: "구독 · 결제 · 알림 설정" },
];

interface ProfileDropdownProps {
  name?: string; // 유저 닉네임 (이니셜 표시용)
}

export function ProfileDropdown({ name }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // 이니셜 계산 (아바타 원형에 표시)
  const displayName = name?.trim() || "사용자";
  const initial = displayName[0]?.toUpperCase() || "U";

  // 외부 클릭 시 드롭다운 닫기 (mousedown으로 감지)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 페이지 이동 시 자동 닫힘
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    setIsOpen(false);
    await fetch("/api/web/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* 프로필 아이콘 버튼: 클릭 시 드롭다운 토글 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white transition-opacity hover:opacity-80"
        style={{ backgroundColor: "var(--color-primary)" }}
        aria-label="프로필 메뉴"
        aria-expanded={isOpen}
      >
        {initial}
      </button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-md border shadow-glow-primary"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
            zIndex: 50,
          }}
        >
          {/* 상단: 아바타 + 닉네임 + 레벨 */}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-4 transition-colors hover:bg-[var(--color-surface)]"
          >
            {/* 아바타 원형 */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[16px] font-black uppercase tracking-wide pr-1"
                style={{ color: "var(--color-text-primary)" }}
              >
                {displayName}
              </p>
              <p className="text-[10px] font-bold uppercase" style={{ color: "var(--color-text-muted)" }}>
                내 프로필 보기
              </p>
            </div>
            <span
              className="material-symbols-outlined text-base"
              style={{ color: "var(--color-text-muted)" }}
            >
              arrow_forward_ios
            </span>
          </Link>

          {/* 4개 카테고리: 각각 페이지로 이동하는 심플 링크 */}
          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface)]"
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-black uppercase tracking-wider pr-1" style={{ color: "var(--color-text-primary)" }}>
                    {item.label}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                    {item.subtitle}
                  </p>
                </div>
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ color: "var(--color-text-disabled)" }}
                >
                  chevron_right
                </span>
              </Link>
            ))}
          </div>

          {/* 구분선 + 로그아웃 */}
          <div
            className="border-t px-4 py-2"
            style={{ borderColor: "var(--color-border)" }}
          >
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-none px-0 py-2 transition-colors hover:bg-[var(--color-surface)]"
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ color: "var(--color-error, #EF4444)" }}
              >
                logout
              </span>
              <span
                className="text-[12px] font-black uppercase tracking-wider pr-1"
                style={{ color: "var(--color-error, #EF4444)" }}
              >
                로그아웃
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
