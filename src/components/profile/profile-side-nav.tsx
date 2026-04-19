"use client";

/* ============================================================
 * ProfileSideNav — 프로필 서브페이지 네비게이션
 *
 * 왜:
 *  - /profile 하위 6개 서브페이지(edit/basketball/growth/preferences/subscription/weekly-report)를
 *    하나의 반응형 컴포넌트로 통합해, 어디서든 동일한 자리에서 좌측(데스크탑) 또는 상단(모바일)
 *    네비게이션이 보이게 한다.
 *  - 기존 (web)/layout.tsx의 sideNavItems 패턴(border-l-4 + bg-surface)을 그대로 따라
 *    BDR 전체 디자인 일관성 유지.
 *
 * 어떻게:
 *  - lg(1024px) 이상: 좌측 고정폭 aside, border-l-4 활성 표시.
 *  - lg 미만: sticky top-14(헤더 56px 바로 아래) 가로 스크롤 chip.
 *  - 활성 판정은 matchPaths 배열을 받아 다중 경로 매칭 (예: 설정 = preferences + notification-settings).
 * ============================================================ */

import Link from "next/link";
import { usePathname } from "next/navigation";

/* 네비게이션 항목 타입 정의
 * - matchPaths를 배열로 받는 이유: 한 메뉴가 여러 실제 경로를 포함할 수 있다
 *   (예: "설정" = /profile/preferences 와 /profile/notification-settings 둘 다 활성). */
type NavItem = {
  label: string;
  href: string;
  icon: string; // Material Symbols Outlined 이름
  matchPaths: string[];
  /* exactOnly: true 이면 matchPaths 는 정확 일치만 허용 (startsWith 하위 매칭 금지).
   * 왜: "내 정보" 가 /profile 을 포함하면 /profile/basketball 같은 하위 경로도 startsWith 로 걸려
   *    다른 네비 항목과 동시 활성되는 버그가 생긴다. /profile 처럼 루트 경로는 정확 일치만. */
  exactOnly?: boolean;
};

/* 6개 서브페이지 매핑.
 * PM 지정 매핑을 그대로 따른다. 순서 = 사용 빈도 + 사용자 멘탈 모델 우선. */
const NAV_ITEMS: NavItem[] = [
  {
    label: "내 정보",
    // Day 7: /profile 허브가 통합 대시보드("내 정보")로 재편됨에 따라 href를 /profile로 변경.
    // /profile/edit 는 상세 편집 화면으로 남아있으므로 matchPaths에 함께 포함해 둘 다 "내 정보" 활성.
    // exactOnly: true 가 필수 — 그렇지 않으면 /profile/basketball 등 하위 경로 전체가 startsWith("/profile/") 에 걸려 오작동.
    href: "/profile",
    icon: "person",
    matchPaths: ["/profile", "/profile/edit"],
    exactOnly: true,
  },
  {
    label: "내 농구",
    href: "/profile/basketball",
    icon: "sports_basketball",
    matchPaths: ["/profile/basketball"],
  },
  {
    label: "내 성장",
    href: "/profile/growth",
    icon: "trending_up",
    matchPaths: ["/profile/growth"],
  },
  {
    label: "설정",
    // Day 8: 맞춤 설정 + 알림 설정을 /profile/settings 허브 (탭 2개)로 통합. href 는 허브 루트.
    href: "/profile/settings",
    icon: "settings",
    // matchPaths: 신 경로(/profile/settings) + 구 경로(/profile/preferences, /profile/notification-settings).
    // 왜 구 경로까지 포함? redirect() 가 즉시 실행되더라도 네비게이션 중간 상태에서 활성 표시가 끊기지 않도록,
    // 그리고 외부 링크로 구 경로 진입 시에도 메뉴 활성 유지.
    matchPaths: [
      "/profile/settings",
      "/profile/preferences",
      "/profile/notification-settings",
    ],
  },
  {
    label: "결제",
    // Day 8: 구독 + 결제 내역을 /profile/billing 허브 (탭 2개)로 통합.
    href: "/profile/billing",
    icon: "payments",
    // 신 경로 + 구 경로 양쪽 매칭 (redirect 구간에도 활성 유지)
    matchPaths: [
      "/profile/billing",
      "/profile/subscription",
      "/profile/payments",
    ],
  },
  {
    label: "주간 리포트",
    href: "/profile/weekly-report",
    icon: "summarize",
    matchPaths: ["/profile/weekly-report"],
  },
];

export function ProfileSideNav() {
  const pathname = usePathname();

  /* 활성 판정 로직.
   * - 정확 일치 (pathname === p): /profile/edit
   * - 하위 경로 (pathname.startsWith(p + '/')): /profile/edit/avatar 같은 미래 확장 대비
   * - exactOnly 플래그가 true 면 하위 경로 매칭 금지 (/profile 루트처럼 광범위한 경로 방어)
   * - matchPaths 중 하나라도 매칭되면 활성 */
  const isActive = (matchPaths: string[], exactOnly?: boolean): boolean =>
    matchPaths.some((p) => {
      if (pathname === p) return true;
      if (exactOnly) return false;
      return pathname.startsWith(p + "/");
    });

  return (
    <>
      {/* ============================================================
       * PC 좌측 사이드 네비 (lg 이상)
       * - 너비 220px, sticky로 스크롤 시 헤더 아래 고정
       * - (web)/layout.tsx의 sideNavItems 디자인을 그대로 따름
       *   (font-black uppercase tracking-wide + border-l-4 활성 표시)
       * ============================================================ */}
      <aside
        className="hidden shrink-0 lg:block lg:w-[220px]"
        aria-label="프로필 메뉴"
      >
        <nav className="sticky top-20 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.matchPaths, item.exactOnly);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-black uppercase tracking-wide transition-all rounded-none ${
                  active
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] border-l-4 border-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] border-l-4 border-transparent hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {/* 활성 시 아이콘 FILL 1 (글로벌 layout 패턴과 동일) */}
                <span
                  className="material-symbols-outlined text-xl"
                  style={
                    active ? { fontVariationSettings: "'FILL' 1" } : undefined
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ============================================================
       * 모바일 상단 chip 네비 (lg 미만)
       * - sticky top-14: (web) 헤더 높이(h-14 = 56px) 바로 아래에 붙음
       * - 가로 스크롤로 6개 항목 모두 접근 가능
       * - chip 디자인: rounded 4px (BDR 컨벤션) + 활성 시 primary 배경
       * ============================================================ */}
      <div
        className="sticky top-14 z-30 -mx-5 mb-4 border-b border-[var(--color-border)] bg-[var(--color-background)] lg:hidden"
        style={{
          // 헤더와 동일한 backdrop-blur 톤으로 자연스러운 연결
          backgroundColor:
            "color-mix(in srgb, var(--color-background) 90%, transparent)",
        }}
      >
        <nav
          className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-none"
          aria-label="프로필 메뉴"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.matchPaths, item.exactOnly);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  active
                    // conventions.md: primary 배경 위 텍스트는 --color-on-primary 사용 (text-white 금지)
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bright)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <span
                  className="material-symbols-outlined text-base"
                  style={
                    active ? { fontVariationSettings: "'FILL' 1" } : undefined
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
