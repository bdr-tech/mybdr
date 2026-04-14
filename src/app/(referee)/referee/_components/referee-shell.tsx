"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 심판 플랫폼 독자 셸.
 *
 * 이유: (web) 레이아웃은 검색/알림/슬라이드메뉴 등 의존성이 많아 그대로 감싸면 referee 페이지에
 *      불필요한 복잡도가 딸려온다. referee 플랫폼은 사이드바 5항목짜리 단순 셸로 독립 운영.
 *
 * 구조:
 * - lg+: 좌측 240px 고정 사이드바 + 상단 56px 헤더
 * - mobile: 상단 56px 헤더 + 하단 탭바(4항목) — 본문 패딩 top/bottom 확보
 * - 다크/라이트는 루트 layout의 테마 토글이 html.dark/light 클래스를 제어 → 여기선 var(--color-*)만 사용
 */

type NavItem = {
  href: string;
  label: string;
  icon: string; // Material Symbols ligature
};

const NAV_ITEMS: NavItem[] = [
  { href: "/referee", label: "대시보드", icon: "dashboard" },
  { href: "/referee/profile", label: "내 프로필", icon: "badge" },
  { href: "/referee/certificates", label: "내 자격증", icon: "verified" },
  { href: "/referee/documents", label: "서류", icon: "description" },
  { href: "/referee/assignments", label: "내 배정", icon: "event" },
  // 배정 워크플로우 1차: 본인이 공고에 신청/내 신청 열람
  { href: "/referee/applications", label: "배정 신청", icon: "how_to_reg" },
  { href: "/referee/settlements", label: "내 정산", icon: "payments" },
  { href: "/referee/admin", label: "관리자", icon: "admin_panel_settings" },
  { href: "/referee/admin/assignments", label: "배정 관리", icon: "event_available" },
  // 배정 워크플로우 1차: 관리자가 신청 공고 게시/관리
  { href: "/referee/admin/announcements", label: "공고 관리", icon: "campaign" },
  // Excel 일괄 사전 등록 (심판/경기원 명단 대량 업로드 + 자동 매칭)
  { href: "/referee/admin/bulk-register", label: "일괄 등록", icon: "upload_file" },
  // 배정 워크플로우 2차: 대회별 일자별 풀 대시보드
  { href: "/referee/admin/pools", label: "일자별 운영", icon: "calendar_today" },
  // 정산 1차: 정산 관리 + 협회 단가표 (사무국장 위주)
  { href: "/referee/admin/settlements", label: "정산 관리", icon: "payments" },
  { href: "/referee/admin/fee-settings", label: "배정비 단가", icon: "monetization_on" },
  { href: "/referee/admin/settings", label: "설정", icon: "settings" },
];

// 모바일 하단 탭은 주요 4항목만 표시 (배정은 숨김)
const BOTTOM_TABS: NavItem[] = [
  { href: "/referee", label: "홈", icon: "dashboard" },
  { href: "/referee/profile", label: "프로필", icon: "badge" },
  { href: "/referee/certificates", label: "자격증", icon: "verified" },
  { href: "/referee/settlements", label: "정산", icon: "payments" },
];

export function RefereeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 현재 경로가 해당 nav 항목에 활성 상태인지 판정
  // /referee 자체는 startsWith로 잡으면 전부 활성되므로 정확히 일치하는 경우만
  const isActive = (href: string) => {
    if (href === "/referee") return pathname === "/referee";
    return pathname.startsWith(href);
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* ========================================
       * 좌측 사이드바 (lg 이상)
       * ======================================== */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-full w-60 flex-col border-r lg:flex"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-background)",
        }}
      >
        {/* 로고/타이틀 영역 */}
        <div className="p-6 pb-4">
          <Link
            href="/referee"
            className="flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ color: "var(--color-primary)" }}
            >
              sports
            </span>
            <span className="text-base font-black uppercase tracking-wider">
              심판 플랫폼
            </span>
          </Link>
        </div>

        {/* 네비 */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                // active: 좌측 4px primary border + 표면 톤 / 비활성: muted 텍스트
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors"
                style={{
                  borderLeft: active
                    ? "4px solid var(--color-primary)"
                    : "4px solid transparent",
                  backgroundColor: active
                    ? "var(--color-surface)"
                    : "transparent",
                  color: active
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                  borderRadius: 4,
                }}
              >
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

        {/* 하단: 본사이트 복귀 */}
        <div
          className="border-t p-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold"
            style={{
              color: "var(--color-text-muted)",
              borderRadius: 4,
            }}
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            MyBDR 홈으로
          </Link>
        </div>
      </aside>

      {/* ========================================
       * 상단 헤더 (모바일+데스크탑 공통, 56px)
       * ======================================== */}
      <header
        className="fixed top-0 z-50 flex h-14 items-center justify-between border-b px-4 backdrop-blur-xl left-0 right-0 lg:left-60"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor:
            "color-mix(in srgb, var(--color-background) 85%, transparent)",
        }}
      >
        {/* 모바일: 좌측 로고/타이틀 */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/referee"
            className="flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: "var(--color-primary)" }}
            >
              sports
            </span>
            <span className="text-sm font-black uppercase tracking-wider">
              심판 플랫폼
            </span>
          </Link>
        </div>

        {/* 우측: 본사이트 링크 */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="flex h-9 items-center gap-1 px-3 text-xs font-semibold"
            style={{
              color: "var(--color-text-muted)",
              borderRadius: 4,
            }}
          >
            <span className="material-symbols-outlined text-base">home</span>
            MyBDR
          </Link>
        </div>
      </header>

      {/* ========================================
       * 메인 콘텐츠
       * ======================================== */}
      <main
        className="min-h-screen flex-1 pt-14 pb-20 lg:ml-60 lg:pb-8"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div className="mx-auto max-w-[960px] px-5 py-4 lg:px-8">{children}</div>
      </main>

      {/* ========================================
       * 하단 탭바 (mobile, lg 미만)
       * ======================================== */}
      <nav
        className="fixed bottom-0 left-0 z-50 flex h-14 w-full items-center justify-around border-t backdrop-blur-xl lg:hidden"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor:
            "color-mix(in srgb, var(--color-background) 90%, transparent)",
          paddingBottom: "max(0px, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {BOTTOM_TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5"
              style={{
                color: active
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
              }}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={
                  active ? { fontVariationSettings: "'FILL' 1" } : undefined
                }
              >
                {tab.icon}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
