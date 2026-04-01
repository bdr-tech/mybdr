"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// 권한별 메뉴 접근 정의
// "all" = 모든 관리자 권한에서 노출
type AdminRole = "super_admin" | "site_admin" | "tournament_admin" | "partner_member" | "org_member";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: AdminRole[] | "all"; // 어떤 역할이 이 메뉴를 볼 수 있는지
}

// 전체 관리 메뉴 정의 + 역할별 접근 권한
const navItems: NavItem[] = [
  { href: "/admin", label: "대시보드", icon: "dashboard", roles: "all" },
  { href: "/admin/users", label: "유저 관리", icon: "group", roles: ["super_admin", "site_admin"] },
  { href: "/admin/tournaments", label: "토너먼트", icon: "emoji_events", roles: ["super_admin", "site_admin"] },
  { href: "/admin/games", label: "경기 관리", icon: "sports_basketball", roles: ["super_admin", "site_admin"] },
  { href: "/admin/teams", label: "팀 관리", icon: "groups", roles: ["super_admin", "site_admin"] },
  { href: "/admin/courts", label: "코트 관리", icon: "location_on", roles: ["super_admin", "site_admin"] },
  { href: "/admin/community", label: "커뮤니티", icon: "forum", roles: ["super_admin", "site_admin"] },
  { href: "/admin/plans", label: "요금제 관리", icon: "payments", roles: ["super_admin"] },
  { href: "/admin/payments", label: "결제", icon: "credit_card", roles: ["super_admin"] },
  { href: "/admin/suggestions", label: "건의사항", icon: "lightbulb", roles: ["super_admin"] },
  { href: "/admin/analytics", label: "분석", icon: "analytics", roles: ["super_admin", "site_admin"] },
  { href: "/admin/settings", label: "시스템 설정", icon: "settings", roles: ["super_admin"] },
  { href: "/admin/logs", label: "활동 로그", icon: "list_alt", roles: ["super_admin"] },
  // tournament_admin 전용: 대회 관리 페이지로 이동하는 링크
  { href: "/tournament-admin", label: "대회 관리", icon: "emoji_events", roles: ["tournament_admin"] },
  // partner_member 전용: 파트너 관리 페이지로 이동하는 링크
  { href: "/partner-admin", label: "협력업체 관리", icon: "storefront", roles: ["partner_member"] },
  // partner_member: 캠페인 + 대관
  { href: "/admin/campaigns", label: "광고 캠페인", icon: "campaign", roles: ["super_admin", "partner_member"] },
  // tournament_admin + org_member: 시리즈, 단체
  { href: "/admin/partners", label: "파트너 관리", icon: "handshake", roles: ["super_admin"] },
];

// 역할 배열에서 해당 역할에게 보일 메뉴만 필터링
function filterMenuByRoles(roles: AdminRole[]): NavItem[] {
  return navItems.filter((item) => {
    if (item.roles === "all") return true;
    // 유저가 가진 역할 중 하나라도 메뉴의 허용 역할에 포함되면 표시
    return roles.some((r) => item.roles.includes(r));
  });
}

interface AdminSidebarProps {
  // 이 유저가 가진 관리 역할들 (복수 가능)
  roles: AdminRole[];
}

export function AdminSidebar({ roles }: AdminSidebarProps) {
  const pathname = usePathname();

  // 유저 역할에 맞는 메뉴만 필터링
  const visibleItems = filterMenuByRoles(roles);

  return (
    // 사이드바: CSS 변수 기반 배경/보더 (다크모드 자동 전환)
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:flex">
      {/* 로고: BDR 이미지 + ADMIN 배지 */}
      <Link href="/admin" className="mb-8 flex items-center gap-3 px-3">
        <Image src="/images/logo.png" alt="BDR" width={120} height={36} className="h-9 w-auto" />
        <span className="rounded bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
          Admin
        </span>
      </Link>

      {/* 내비게이션 메뉴: 역할별로 필터링된 항목만 표시 */}
      <nav className="flex flex-1 flex-col gap-1">
        {visibleItems.map((item) => {
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
