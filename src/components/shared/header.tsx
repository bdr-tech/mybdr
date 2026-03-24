"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
// lucide-react 제거 → Material Symbols Outlined 사용
import { SlideMenu } from "./slide-menu";
import { UserDropdown } from "./user-dropdown";
import { BellIcon } from "./bell-icon";
import { ThemeToggle } from "./theme-toggle";
import { TextSizeToggle } from "./text-size-toggle";
import { usePreferFilter } from "@/contexts/prefer-filter-context";

// 모바일 하단 내비 아이템 — Material Symbols 아이콘 이름으로 변경
const navItems = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/games", label: "경기", icon: "sports_basketball" },
  { href: "/tournaments", label: "대회", icon: "emoji_events" },
  { href: "/community", label: "게시판", icon: "forum" },
];

const desktopNavItems = [
  { href: "/", label: "홈" },
  { href: "/games", label: "경기" },
  { href: "/teams", label: "팀" },
  { href: "/tournaments", label: "대회" },
  { href: "/community", label: "커뮤니티" },
  // { href: "/pricing", label: "요금제" },
];

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  profile_image: string | null;
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // 전역 선호 필터 Context -- 로그인 상태를 Provider에 전달하고, 토글 함수를 받아옴
  const { preferFilter, togglePreferFilter, setLoggedIn } = usePreferFilter();

  // 마운트 시 1회: me + notifications 병렬 fetch (waterfall 제거)
  useEffect(() => {
    Promise.all([
      fetch("/api/web/me", { credentials: "include" })
        .then(async (r) => (r.ok ? (r.json() as Promise<SessionUser>) : null))
        .catch(() => null),
      fetch("/api/web/notifications", { credentials: "include" })
        .then(async (r) => (r.ok ? (r.json() as Promise<{ unreadCount: number }>) : null))
        .catch(() => null),
    ]).then(([userData, notifData]) => {
      setUser(userData);
      // 로그인 여부를 PreferFilterProvider에 전달
      setLoggedIn(!!userData);
      if (userData && notifData) setUnreadCount(notifData.unreadCount ?? 0);
    });
  }, [setLoggedIn]);

  // 페이지 이동 시: 알림 카운트만 갱신 (me 재호출 없음)
  useEffect(() => {
    if (!user) return;
    fetch("/api/web/notifications", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json() as { unreadCount: number };
          setUnreadCount(data.unreadCount ?? 0);
        }
      })
      .catch(() => {});
  }, [user, pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Top Navbar -- Kinetic Pulse 글래스모피즘: 반투명 배경 + backdrop-blur-xl + 하단 보더(글래스 경계 예외) */}
      <header
        className="fixed top-0 z-50 w-full backdrop-blur-xl border-b border-white/10"
        style={{ backgroundColor: 'rgba(19, 19, 19, 0.80)' }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo -- Kinetic Pulse: Electric Red + Space Grotesk italic bold */}
          <Link href="/" prefetch={true} className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="BDR"
              className="h-[55px] w-auto" /* 로고 크기 130% 확대 (42px → 55px) */
            />
          </Link>

          {/* Desktop Nav -- Kinetic Pulse: 활성=text-primary, 비활성=text-muted opacity-70, 활성 하단 바=primary(Electric Red) */}
          <nav className="hidden items-center lg:flex" style={{ fontFamily: "var(--font-heading)" }}>
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`relative px-5 py-4 text-[17px] font-semibold uppercase tracking-wide transition-colors ${
                  isActive(item.href) ? '' : 'opacity-70 hover:opacity-100'
                }`}
                style={isActive(item.href) ? { color: 'var(--color-text-primary)' } : { color: 'var(--color-text-primary)' }}
              >
                {item.label}
                {/* 활성 탭 하단 바: primary(Electric Red) 그라디언트 */}
                {isActive(item.href) && (
                  <span className="absolute bottom-1 left-1/2 h-[2.5px] w-6 -translate-x-1/2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                )}
              </Link>
            ))}
          </nav>

          {/* Right: PreferFilter + TextSize + Theme + Bell + Login/Profile */}
          <div className="flex items-center gap-1.5">
            {/* 선호 필터 토글 -- 로그인 유저에게만 표시 */}
            {/* Sparkles 토글: 활성 시 웜 오렌지, 비활성 시 muted 색상 */}
            {user && (
              <button
                onClick={togglePreferFilter}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                title={preferFilter ? "전체 보기" : "맞춤 보기"}
                style={{
                  color: preferFilter ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  backgroundColor: preferFilter ? 'var(--color-primary-light)' : 'transparent',
                }}
              >
                <span className="material-symbols-outlined text-xl">auto_awesome</span>
              </button>
            )}
            <TextSizeToggle />
            <ThemeToggle />
            {/* 비로그인 시 알림 벨 아이콘 숨김 -- 로그인 유저에게만 표시 */}
            {user && <BellIcon unreadCount={unreadCount} />}
            {user ? (
              <UserDropdown name={user.name} role={user.role} profileImage={user.profile_image} />
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 text-sm font-bold text-white transition-colors"
                style={{
                  fontFamily: "var(--font-heading)",
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: 'var(--radius-button)',
                }}
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav -- Kinetic Pulse: 글래스모피즘 배경 + 상단 보더(글래스 경계 예외), 활성 색상 primary(Red) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden backdrop-blur-xl border-t border-white/10"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          backgroundColor: 'rgba(19, 19, 19, 0.80)',
        }}
      >
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className="relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] transition-colors active:opacity-70"
                style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: active ? 600 : 400 }}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                )}
                {/* Material Symbols 아이콘: 활성 시 FILL 1 적용 */}
                <span
                  className="material-symbols-outlined text-2xl"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className="relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] active:opacity-70"
            style={{ color: menuOpen ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: menuOpen ? 600 : 400 }}
          >
            {menuOpen && (
              <span className="absolute top-0 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
            )}
            <span
              className="material-symbols-outlined text-2xl"
              style={menuOpen ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >menu</span>
            전체
          </button>
        </div>
      </nav>

      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} isLoggedIn={!!user} role={user?.role} name={user?.name} email={user?.email} />
    </>
  );
}
