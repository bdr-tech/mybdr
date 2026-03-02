"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SlideMenu } from "./slide-menu";
import { UserDropdown } from "./user-dropdown";
import { BellIcon } from "./bell-icon";

const navItems = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/games", label: "경기", icon: "🏀" },
  { href: "/tournaments", label: "대회", icon: "🏆" },
  { href: "/community", label: "게시판", icon: "💬" },
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

  useEffect(() => {
    // JWT만 검증하는 가벼운 엔드포인트 (DB 쿼리 없음)
    fetch("/api/web/me", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json() as SessionUser;
          setUser(data);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    fetch("/api/web/notifications", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json() as { unreadCount: number };
          setUnreadCount(data.unreadCount);
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
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-[#F4A261]">BDR</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
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
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors active:opacity-70 ${
                isActive(item.href)
                  ? "text-[#F4A261]"
                  : "text-[#9CA3AF]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] active:opacity-70 ${
              menuOpen ? "text-[#F4A261]" : "text-[#9CA3AF]"
            }`}
          >
            <span className="text-lg">☰</span>
            전체
          </button>
        </div>
      </nav>

      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} isLoggedIn={!!user} role={user?.role} />
    </>
  );
}
