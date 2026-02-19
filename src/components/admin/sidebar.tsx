"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Rails admin/shared/_sidebar.html.erb 완전 복제
const navItems = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/users", label: "유저 관리", icon: "👥" },
  { href: "/admin/tournaments", label: "토너먼트", icon: "🏆" },
  { href: "/admin/payments", label: "결제", icon: "💳" },
  { href: "/admin/suggestions", label: "건의사항", icon: "💡" },
  { href: "/admin/analytics", label: "분석", icon: "📈" },
  { href: "/admin/settings", label: "시스템 설정", icon: "⚙️" },
  { href: "/admin/logs", label: "활동 로그", icon: "📋" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-[#2A2A2A] bg-[#1A1A1A] p-4 lg:flex">
      <Link href="/admin" className="mb-8 flex items-center gap-2 px-3">
        <span className="text-xl font-bold text-[#F4A261]">MyBDR</span>
        <span className="rounded-full bg-[rgba(239,68,68,0.2)] px-2 py-0.5 text-[10px] font-bold text-[#EF4444]">Admin</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-[16px] px-4 py-3 text-sm transition-colors ${
                isActive ? "bg-[rgba(244,162,97,0.12)] text-[#F4A261] font-medium" : "text-[#A0A0A0] hover:bg-[#252525] hover:text-white"
              }`}
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#2A2A2A] pt-4">
        <Link href="/" className="flex items-center gap-3 rounded-[16px] px-4 py-3 text-sm text-[#A0A0A0] hover:bg-[#252525] hover:text-white">
          ← 사이트로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
