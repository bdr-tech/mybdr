"use client";

import { useState } from "react";
import Link from "next/link";

/* ============================================================
 * ProfileAccordion — 프로필 카테고리 메뉴 (아코디언 방식)
 *
 * 프로필 헤더 클릭 시 카테고리 목록 토글 (기본: 접힘)
 * 하위 메뉴 없음 — 카테고리가 곧 링크
 *
 * 사용처:
 * - PC 사이드네비 하단 (layout.tsx)
 * - 모바일 슬라이드 메뉴 (slide-menu.tsx)
 * ============================================================ */

// 카테고리 정의: 각 카테고리는 하나의 페이지 링크
interface Category {
  id: string;
  label: string;
  icon: string;   // Material Symbols 아이콘명
  href: string;    // 클릭 시 이동할 경로
}

// 카테고리별 이동 경로 — 아코디언 대신 바로 해당 페이지로 이동
const categories: Category[] = [
  { id: "basketball", label: "내 농구", icon: "sports_basketball", href: "/profile/basketball" },
  { id: "growth",     label: "내 성장", icon: "trending_up",       href: "/profile/growth" },
  { id: "info",       label: "내 정보", icon: "person",            href: "/profile/edit" },
  // Day 8: /profile/preferences → /profile/settings (맞춤 설정 + 알림 통합 허브) 로 이동
  { id: "preferences",label: "맞춤 설정", icon: "tune",            href: "/profile/settings" },
  // Day 8: /profile/subscription → /profile/billing (구독 + 결제 내역 통합 허브) 로 이동
  { id: "account",    label: "계정",    icon: "settings",          href: "/profile/billing" },
];

interface ProfileAccordionProps {
  name?: string;              // 유저 닉네임
  role?: string;              // 유저 역할 (admin/tournament_admin/super_admin 등)
  region?: string;            // 지역
  teamName?: string;          // 소속 팀
  position?: string;          // 포지션
  onNavigate?: () => void;    // 링크 클릭 후 콜백 (슬라이드 메뉴 닫기용)
}

export function ProfileAccordion({ name, region = "", teamName = "", position = "", onNavigate }: ProfileAccordionProps) {
  // 아코디언 열림/닫힘 상태 — 기본값: 접힘(false)
  const [isOpen, setIsOpen] = useState(false);

  // 이니셜 계산 (아바타용)
  const displayName = name?.trim() || "사용자";
  const initial = displayName[0]?.toUpperCase() || "U";

  // 부가 정보: 빈 값은 표시하지 않음
  const infoFragments = [region, teamName, position].filter(Boolean);
  const subInfo = infoFragments.length > 0 ? infoFragments.join(" · ") : "";

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await fetch("/api/web/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  return (
    <div className="space-y-1">
      {/* 프로필 헤더: 이름 클릭 → 프로필 이동, 화살표 클릭 → 아코디언 토글 */}
      <div className="flex w-full items-center gap-3.5 rounded-md px-2 py-3 transition-colors hover:bg-[var(--color-surface)]">
        {/* 아바타 + 텍스트: 클릭 시 프로필 페이지로 이동 */}
        <Link
          href="/profile/basketball"
          onClick={onNavigate}
          className="flex flex-1 items-center gap-3.5 min-w-0"
        >
          {/* 아바타 원형 */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-black text-white shadow-sm border border-[var(--color-primary)]/50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {initial}
          </div>

          {/* 텍스트 영역: 닉네임 + 부가 정보 */}
          <div className="flex-1 flex flex-col items-start truncate overflow-hidden">
            <span
              className="w-full truncate text-left text-sm font-black uppercase tracking-wide"
              style={{ color: "var(--color-text-primary)" }}
            >
              {displayName}
            </span>
            {subInfo && (
              <span className="w-full truncate text-left text-[10px] font-medium text-[var(--color-text-muted)] mt-0.5">
                {subInfo}
              </span>
            )}
          </div>
        </Link>

        {/* 화살표 버튼: 아코디언 토글 전용 */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="shrink-0 p-1 rounded-full hover:bg-[var(--color-elevated)] transition-colors"
        >
          <span
            className="material-symbols-outlined text-xl transition-transform duration-200"
            style={{
              color: "var(--color-text-muted)",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            expand_more
          </span>
        </button>
      </div>

      {/* 카테고리 목록: isOpen일 때만 표시 */}
      {isOpen && (
        <div className="space-y-0.5 pl-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              onClick={onNavigate}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-surface)]"
            >
              {/* 카테고리 아이콘 */}
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-text-muted)" }}
              >
                {cat.icon}
              </span>
              {/* 카테고리 라벨 */}
              <span
                className="flex-1 text-xs font-semibold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {cat.label}
              </span>
            </Link>
          ))}

          {/* 구분선: 카테고리 목록과 로그아웃을 시각적으로 분리 (PC 드롭다운과 일관성) */}
          <div className="my-1 border-t border-[var(--color-border)]" />

          {/* 로그아웃 버튼: 카테고리와 동일한 레이아웃, 빨간색 */}
          <button
            onClick={() => {
              handleLogout();
              onNavigate?.();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-surface)]"
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: "var(--color-error, #EF4444)" }}
            >
              logout
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-error, #EF4444)" }}
            >
              로그아웃
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
