"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Dribbble, Trophy, MessageSquare, Menu, Sparkles } from "lucide-react";
import { SlideMenu } from "./slide-menu";
import { UserDropdown } from "./user-dropdown";
import { BellIcon } from "./bell-icon";
import { ThemeToggle } from "./theme-toggle";
import { TextSizeToggle } from "./text-size-toggle";
import { usePreferFilter } from "@/contexts/prefer-filter-context";

const navItems = [
  { href: "/", label: "홈", Icon: Home },
  { href: "/games", label: "경기", Icon: Dribbble },
  { href: "/tournaments", label: "대회", Icon: Trophy },
  { href: "/community", label: "게시판", Icon: MessageSquare },
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
      {/* Top Navbar -- 테두리 CSS 변수, 배경은 bg-white/95 유지 (다크모드는 globals.css backdrop-blur 오버라이드가 처리) */}
      <header
        className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" prefetch={true} className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo.png"
              alt="BDR"
              className="h-[42px] w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center lg:flex" style={{ fontFamily: "var(--font-heading)" }}>
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className="relative px-5 py-4 text-[17px] font-semibold uppercase tracking-wide transition-colors"
                /* inline style의 CSS 변수가 우선 적용되므로, className에서 하드코딩 색상 제거 */
                style={isActive(item.href) ? { color: 'var(--color-text-primary)' } : { color: 'var(--color-text-muted)' }}
              >
                {item.label}
                {/* 활성 탭 하단 바: 빨강(#E31B23) -> 웜 오렌지(--color-accent) */}
                {isActive(item.href) && (
                  <span className="absolute bottom-1 left-1/2 h-[2.5px] w-6 -translate-x-1/2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
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
                title={preferFilter ? "전체 보기" : "내 선호만 보기"}
                style={{
                  color: preferFilter ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  backgroundColor: preferFilter ? 'var(--color-accent-light)' : 'transparent',
                }}
              >
                <Sparkles size={20} />
              </button>
            )}
            <TextSizeToggle />
            <ThemeToggle />
            <BellIcon unreadCount={unreadCount} />
            {user ? (
              <UserDropdown name={user.name} role={user.role} profileImage={user.profile_image} />
            ) : (
              <Link
                href="/login"
                className="rounded-[10px] px-5 py-2 text-sm font-bold text-white transition-colors"
                style={{
                  fontFamily: "var(--font-heading)",
                  backgroundColor: 'var(--color-accent)',
                }}
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav -- 배경/테두리 CSS 변수, 활성 색상 웜 오렌지 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-primary)',
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
                style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: active ? 600 : 400 }}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
                )}
                <item.Icon size={24} strokeWidth={active ? 2.5 : 1.5} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className="relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] active:opacity-70"
            style={{ color: menuOpen ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: menuOpen ? 600 : 400 }}
          >
            {menuOpen && (
              <span className="absolute top-0 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
            )}
            <Menu size={24} strokeWidth={menuOpen ? 2.5 : 1.5} />
            전체
          </button>
        </div>
      </nav>

      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} isLoggedIn={!!user} role={user?.role} name={user?.name} email={user?.email} />
    </>
  );
}
