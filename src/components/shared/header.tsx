"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SlideMenu } from "./slide-menu";
import { UserDropdown } from "./user-dropdown";

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

  useEffect(() => {
    // JWT만 검증하는 가벼운 엔드포인트 (DB 쿼리 없음)
    fetch("/api/web/me", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setUser(data);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-md">
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
                    ? "bg-[rgba(244,162,97,0.12)] font-medium text-[#F4A261]"
                    : "text-[#A0A0A0] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: Notifications + User */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/notifications"
                  className="relative rounded-full p-2 text-[#A0A0A0] hover:bg-[#252525] hover:text-white"
                >
                  🔔
                </Link>
                <UserDropdown name={user.name} />
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-[#F4A261] px-4 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E8934E]"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2A2A2A] bg-[#1A1A1A] lg:hidden">
        <div className="grid grid-cols-5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
                isActive(item.href)
                  ? "text-[#F4A261]"
                  : "text-[#666666]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] ${
              menuOpen ? "text-[#F4A261]" : "text-[#666666]"
            }`}
          >
            <span className="text-lg">☰</span>
            전체
          </button>
        </div>
      </nav>

      <SlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} isLoggedIn={!!user} />
    </>
  );
}
