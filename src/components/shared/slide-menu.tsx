"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { TextSizeToggle } from "@/components/shared/text-size-toggle";
import { PushNotificationToggle } from "@/components/shared/push-notification-toggle";

/* ============================================================
 * 슬라이드 메뉴 네비게이션 항목 정의
 * Material Symbols 아이콘명 사용
 * ============================================================ */
const menuItems = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/games", label: "경기찾기", icon: "sports_basketball" },
  { href: "/tournaments", label: "대회", icon: "emoji_events" },
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
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  role?: string;
  name?: string;
  email?: string; /* header.tsx 호환용: 현재 UI에서는 미사용 */
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
              {/* 로그인 상태: 아바타 + 이름 + 역할 */}
              <div className="flex items-center gap-4">
                {/* 아바타: 이름 첫 글자, 빨간 테두리 */}
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-card)] text-xl font-bold text-[var(--color-text-primary)]">
                  {name?.trim() ? name.trim()[0].toUpperCase() : "U"}
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">{name || "사용자"}</p>
                  {/* 역할 뱃지 */}
                  <p className="text-xs font-medium text-[var(--color-primary)]">
                    {role === "super_admin" ? "관리자" : role === "tournament_admin" ? "대회 운영자" : "플레이어"}
                  </p>
                </div>
              </div>

              {/* PRO 업그레이드 배너 */}
              <div className="mt-4 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)] p-3">
                <p className="mb-2 text-xs text-[var(--color-text-primary)]">PRO로 업그레이드하고 모든 기능을 사용하세요</p>
                <Link
                  href="/pricing"
                  onClick={onClose}
                  className="block w-full rounded bg-[var(--color-primary)] py-2 text-center text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
                >
                  프로 업그레이드
                </Link>
              </div>
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

        {/* 네비게이션: 6개 메뉴 */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => {
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

        {/* 하단: 유틸리티 버튼 + Settings + Logout */}
        <div className="border-t border-[var(--color-border)] p-4">
          {/* 테마 전환 + 글씨 크기 버튼 (모바일 슬라이드 메뉴용) */}
          <div className="mb-2 flex items-center gap-2 px-2">
            <ThemeToggle />
            <TextSizeToggle />
          </div>
          {/* 푸시 알림 권한 요청 토글 (브라우저 지원 시에만 표시) */}
          <div className="mb-2">
            <PushNotificationToggle />
          </div>
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            <span>설정</span>
          </Link>
          {isLoggedIn && (
            <button
              onClick={() => { handleLogout(); onClose(); }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>로그아웃</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
