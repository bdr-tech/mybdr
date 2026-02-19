"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/tournaments", label: "토너먼트" },
  { href: "/teams", label: "팀" },
  { href: "/games", label: "픽업 게임" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#0A0A0A]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-[#F4A261]">
          MyBDR
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-[rgba(244,162,97,0.12)] text-[#F4A261] font-medium"
                  : "text-[#A0A0A0] hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full bg-[#F4A261] px-5 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E8934E] transition-colors"
          >
            로그인
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[#2A2A2A] bg-[#1A1A1A] md:hidden">
        {[
          { href: "/", label: "홈", icon: "🏠" },
          ...navItems.map((n) => ({
            ...n,
            icon: n.href === "/tournaments" ? "🏆" : n.href === "/teams" ? "👕" : "🏀",
          })),
          { href: "/profile", label: "더보기", icon: "👤" },
        ].map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] ${
                isActive ? "text-[#F4A261]" : "text-[#666666]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
