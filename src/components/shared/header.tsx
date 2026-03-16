"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Dribbble, Trophy, MessageSquare, Menu } from "lucide-react";
import { SlideMenu } from "./slide-menu";
import { UserDropdown } from "./user-dropdown";
import { BellIcon } from "./bell-icon";

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
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
      if (userData && notifData) setUnreadCount(notifData.unreadCount ?? 0);
    });
  }, []);

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
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-[#E8ECF0] bg-[#FFFFFF]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" prefetch={true} className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-[#F4A261]">BDR</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-[rgba(0,102,255,0.12)] font-medium text-[#0066FF]"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: Bell + User */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <BellIcon unreadCount={unreadCount} />
                <UserDropdown name={user.name} role={user.role} />
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0052CC]"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E8ECF0] bg-[#FFFFFF] lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors active:opacity-70 ${
                  active
                    ? "text-[#F4A261] font-semibold"
                    : "text-[#9CA3AF]"
                }`}
              >
                <item.Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] active:opacity-70 ${
              menuOpen ? "text-[#F4A261] font-semibold" : "text-[#9CA3AF]"
            }`}
          >
            <Menu size={22} strokeWidth={menuOpen ? 2.5 : 1.5} />
            전체
          </button>
        </div>
      </nav>

      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} isLoggedIn={!!user} role={user?.role} name={user?.name} email={user?.email} />
    </>
  );
}
