"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileAccordion } from "@/components/shared/profile-accordion";

/* ============================================================
 * 슬라이드 메뉴 네비게이션 항목 정의
 * Material Symbols 아이콘명 사용
 * ============================================================ */
const menuItems = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/games", label: "경기찾기", icon: "sports_basketball" },
  { href: "/tournaments", label: "대회", icon: "emoji_events" },
  { href: "/organizations", label: "단체", icon: "corporate_fare" },
  { href: "/teams", label: "팀", icon: "groups" },
  { href: "/courts", label: "코트", icon: "location_on" },
  { href: "/rankings", label: "랭킹", icon: "leaderboard" },
  { href: "/community", label: "커뮤니티", icon: "forum" },
];

export function SlideMenu({
  open,
  onClose,
  isLoggedIn,
  role,
  name,
  hiddenMenus,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  role?: string;
  name?: string;
  email?: string; /* header.tsx 호환용: 현재 UI에서는 미사용 */
  hiddenMenus?: string[]; /* 숨긴 메뉴 slug 배열 — 맞춤 설정에서 지정 */
}) {
  const pathname = usePathname();

  /* 현재 경로가 활성 메뉴인지 판별 */
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  /* 로그아웃 핸들러 */
  const handleLogout = async () => {
    await fetch("/api/web/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  return (
    <>
      {/* 오버레이: 배경 어둡게 + 블러 */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* 패널: 왼쪽에서 슬라이드 (left-0) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="전체 메뉴"
        className={`fixed inset-y-0 left-0 z-[70] flex w-80 transform flex-col rounded-r-lg border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 프로필 섹션 */}
        <div className="border-b border-[var(--color-border)] p-6">
          {isLoggedIn ? (
            <>
              {/* PRO 업그레이드 한줄 알림 */}
              <Link
                href="/pricing"
                onClick={onClose}
                className="mb-4 flex items-center justify-between gap-2 rounded-md border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)] p-2 px-3"
              >
                <span className="text-[11px] font-semibold text-[var(--color-text-primary)] leading-tight">
                  PRO로 업그레이드하고 모든 기능 사용
                </span>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[8px] font-black text-white shadow-sm">
                  GO
                </div>
              </Link>

              {/* 프로필 4카테고리 아코디언 — role을 전달하여 관리자 메뉴 분기 */}
              <ProfileAccordion name={name} role={role} onNavigate={onClose} />
            </>
          ) : (
            /* 비로그인 상태: 로그인/회원가입 버튼 */
            <div className="flex flex-col gap-2">
              <p className="mb-2 text-lg font-bold text-[var(--color-primary)]">BDR</p>
              <p className="mb-4 text-xs text-[var(--color-text-secondary)]">농구인을 위한 농구 플랫폼</p>
              <Link
                href="/login"
                onClick={onClose}
                className="block w-full rounded bg-[var(--color-primary)] py-2.5 text-center text-sm font-bold text-white"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="block w-full rounded border border-[var(--color-border)] py-2.5 text-center text-sm font-bold text-[var(--color-text-primary)]"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>

        {/* 네비게이션 — hidden_menus에 포함된 메뉴는 숨김 */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems
            .filter((item) => !(hiddenMenus ?? []).includes(item.href))
            .map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-4 rounded-lg px-4 py-3 text-sm transition-colors ${
                  active
                    ? "bg-[var(--color-primary-light)] font-bold text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-elevated)]"
                }`}
              >
                {/* Material Symbols 아이콘: 활성 시 FILL 1 */}
                <span
                  className="material-symbols-outlined text-xl"
                  style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </>
  );
}
