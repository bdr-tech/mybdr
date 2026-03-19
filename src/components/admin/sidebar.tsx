"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Rails admin/shared/_sidebar.html.erb 완전 복제
const navItems = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/users", label: "유저 관리", icon: "👥" },
  { href: "/admin/tournaments", label: "토너먼트", icon: "🏆" },
  { href: "/admin/plans", label: "요금제 관리", icon: "💰" },
  { href: "/admin/payments", label: "결제", icon: "💳" },
  { href: "/admin/suggestions", label: "건의사항", icon: "💡" },
  { href: "/admin/analytics", label: "분석", icon: "📈" },
  { href: "/admin/settings", label: "시스템 설정", icon: "⚙️" },
  { href: "/admin/logs", label: "활동 로그", icon: "📋" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-[#E8ECF0] bg-[#FFFFFF] p-4 lg:flex">
      <Link href="/admin" className="mb-8 flex items-center gap-2 px-3">
        <span className="text-xl font-bold text-[#E31B23]" style={{ fontFamily: "var(--font-heading)" }}>MyBDR</span>
        <span className="rounded-[6px] bg-[rgba(239,68,68,0.2)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#EF4444]">Admin</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-[12px] px-4 py-3 text-sm transition-all duration-200 ${
                isActive ? "bg-[#111827] text-white font-bold shadow-sm" : "text-[#374151] hover:bg-[#F5F7FA] hover:text-[#111827] hover:pl-5"
              }`}
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#E8ECF0] pt-4">
        <Link href="/" className="flex items-center gap-3 rounded-[12px] px-4 py-3 text-sm text-[#374151] transition-all duration-200 hover:bg-[#F5F7FA] hover:text-[#111827] hover:pl-5">
          ← 사이트로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
