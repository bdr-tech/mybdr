"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 디자인 시스템 통일: 이모지 아이콘 -> Material Symbols Outlined
const navItems = [
  { href: "/admin", label: "대시보드", icon: "dashboard" },
  { href: "/admin/users", label: "유저 관리", icon: "group" },
  { href: "/admin/tournaments", label: "토너먼트", icon: "emoji_events" },
  { href: "/admin/plans", label: "요금제 관리", icon: "payments" },
  { href: "/admin/payments", label: "결제", icon: "credit_card" },
  { href: "/admin/suggestions", label: "건의사항", icon: "lightbulb" },
  { href: "/admin/analytics", label: "분석", icon: "analytics" },
  { href: "/admin/settings", label: "시스템 설정", icon: "settings" },
  { href: "/admin/logs", label: "활동 로그", icon: "list_alt" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    // 사이드바: CSS 변수 기반 배경/보더 (다크모드 자동 전환)
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:flex">
      {/* 로고: "BDR SPORTS" + ADMIN 빨간 배지 */}
      <Link href="/admin" className="mb-8 flex items-center gap-2 px-3">
        <span
          className="text-xl font-bold text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          BDR SPORTS
        </span>
        <span className="rounded bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
          Admin
        </span>
      </Link>

      {/* 내비게이션 메뉴 */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          // 대시보드는 정확히 /admin일 때만 활성, 나머지는 startsWith
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? // 활성 메뉴: BDR Red 배경 + 흰색 텍스트
                    "bg-[var(--color-primary)] font-bold text-white shadow-sm"
                  : // 비활성 메뉴: 뮤트 텍스트 + 호버 시 서피스 배경
                    "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {/* Material Symbols Outlined 아이콘 */}
              <span className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 하단: 사이트로 돌아가기 */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-[var(--color-text-muted)] transition-all duration-200 hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          사이트로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
