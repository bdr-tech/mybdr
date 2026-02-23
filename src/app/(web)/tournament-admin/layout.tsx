"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Rails tournament_admin.html.erb 레이아웃 복제
const navItems = [
  { href: "/tournament-admin", label: "대시보드" },
  { href: "/tournament-admin/tournaments", label: "내 대회" },
  { href: "/tournament-admin/series", label: "시리즈" },
  { href: "/tournament-admin/templates", label: "템플릿" },
];

export default function TournamentAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Top Nav */}
      <header className="border-b border-[#E8ECF0] bg-[#FFFFFF]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/tournament-admin" className="font-bold text-[#F4A261]">대회 관리</Link>
            <nav className="hidden gap-1 md:flex">
              {navItems.map((item) => {
                const active = item.href === "/tournament-admin"
                  ? pathname === "/tournament-admin"
                  : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm transition-colors ${active ? "bg-[rgba(0,102,255,0.12)] font-medium text-[#F4A261]" : "text-[#6B7280] hover:text-[#111827]"}`}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <Link href="/" className="text-sm text-[#6B7280] hover:text-[#111827]">← 사이트로</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
