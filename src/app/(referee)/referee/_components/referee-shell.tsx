"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
// 헤더 우측에 알림 벨 — referee 플랫폼 전용 컴포넌트
import { NotificationBell } from "./notification-bell";

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
 *
 * 메뉴 가시성:
 * - 본인 메뉴(requires: null)는 모두 표시
 * - 관리자 메뉴(requires: permission 키)는 /api/web/me 호출로 admin_info를 받아
 *   해당 role이 가진 permissions에 포함된 항목만 표시
 * - 보안은 서버의 requirePermission()이 담당. 여기서는 UX 개선 용도
 */

// 관리자 정보 타입 — /api/web/me의 admin_info 응답과 동일
// 이유: 타입 안전성 확보 + 재사용
type AdminInfo = {
  is_admin: true;
  association_id: number;
  role: string;
  is_executive: boolean;
  permissions: string[];
} | null;

type NavItem = {
  href: string;
  label: string;
  icon: string; // Material Symbols ligature
  // 이 메뉴에 필요한 권한 키. null이면 본인 메뉴(모두 표시)
  // "admin"은 특수 키 — 관리자이기만 하면 표시(대시보드)
  requires: string | null;
};

const NAV_ITEMS: NavItem[] = [
  // ── 본인 메뉴 (모두에게 표시) ──
  { href: "/referee", label: "대시보드", icon: "dashboard", requires: null },
  { href: "/referee/profile", label: "내 프로필", icon: "badge", requires: null },
  { href: "/referee/certificates", label: "내 자격증", icon: "verified", requires: null },
  { href: "/referee/documents", label: "서류", icon: "description", requires: null },
  { href: "/referee/assignments", label: "내 배정", icon: "event", requires: null },
  // 배정 워크플로우 1차: 본인이 공고에 신청/내 신청 열람
  { href: "/referee/applications", label: "배정 신청", icon: "how_to_reg", requires: null },
  { href: "/referee/settlements", label: "내 정산", icon: "payments", requires: null },

  // ── 관리자 메뉴 (역할별 필터) ──
  // 관리자 대시보드 — 관리자이기만 하면 표시(임원 포함)
  { href: "/referee/admin", label: "관리자", icon: "admin_panel_settings", requires: "admin" },
  { href: "/referee/admin/assignments", label: "배정 관리", icon: "event_available", requires: "assignment_manage" },
  // 배정 워크플로우 1차: 관리자가 신청 공고 게시/관리
  { href: "/referee/admin/announcements", label: "공고 관리", icon: "campaign", requires: "assignment_manage" },
  // Excel 일괄 사전 등록 (심판/경기원 명단 대량 업로드 + 자동 매칭)
  { href: "/referee/admin/bulk-register", label: "일괄 등록", icon: "upload_file", requires: "excel_upload" },
  // 배정 워크플로우 2차: 대회별 일자별 풀 대시보드
  { href: "/referee/admin/pools", label: "일자별 운영", icon: "calendar_today", requires: "assignment_manage" },
  // 정산 1차: 정산 관리 + 협회 단가표 (사무국장 위주)
  { href: "/referee/admin/settlements", label: "정산 관리", icon: "payments", requires: "settlement_view" },
  // 정산 3차: 통계 대시보드 (사무국장/팀장/임원 열람)
  { href: "/referee/admin/settlements/dashboard", label: "정산 대시보드", icon: "insights", requires: "settlement_view" },
  { href: "/referee/admin/fee-settings", label: "배정비 단가", icon: "monetization_on", requires: "settlement_manage" },
  { href: "/referee/admin/settings", label: "설정", icon: "settings", requires: "admin_manage" },
];

// 임원(회장/부회장/이사)에게 보여줄 권한 키 화이트리스트
// 이유: 임원은 열람만 — 관리 메뉴는 가시성에서 제외해야 혼란 방지
//      (서버 권한 체크와는 별개로 UX 차원)
const EXECUTIVE_VISIBLE: string[] = [
  "admin", // 관리자 대시보드
  "assignment_view",
  "settlement_view",
];

/**
 * 현재 admin_info 기준으로 NAV 항목 가시성 판정.
 * - requires === null: 항상 표시 (본인 메뉴)
 * - admin_info === null: 관리자 아님 → admin 메뉴 전부 숨김
 * - is_executive: EXECUTIVE_VISIBLE에 포함된 항목만
 * - 일반 관리자: permissions에 requires가 포함되면 표시
 */
function isNavVisible(item: NavItem, adminInfo: AdminInfo): boolean {
  if (item.requires === null) return true;
  if (!adminInfo?.is_admin) return false;
  // 임원은 열람용 화이트리스트만
  if (adminInfo.is_executive) {
    return EXECUTIVE_VISIBLE.includes(item.requires);
  }
  // "admin"은 모든 관리자에게 표시
  if (item.requires === "admin") return true;
  // 일반 관리자: 권한 매트릭스 검사
  return adminInfo.permissions.includes(item.requires);
}

// 모바일 하단 탭은 주요 4항목만 표시 (배정은 숨김)
// 이유: 하단 탭은 본인 메뉴 고정이라 권한 필터(requires) 불필요 → NavItem 타입에서 제외
type BottomTabItem = {
  href: string;
  label: string;
  icon: string;
};
const BOTTOM_TABS: BottomTabItem[] = [
  { href: "/referee", label: "홈", icon: "dashboard" },
  { href: "/referee/profile", label: "프로필", icon: "badge" },
  { href: "/referee/certificates", label: "자격증", icon: "verified" },
  { href: "/referee/settlements", label: "정산", icon: "payments" },
];

export function RefereeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 관리자 정보 상태 — 초기에는 null(로딩 중 또는 비관리자)
  // 이유: 로그인 직후 admin 메뉴가 잠깐 보였다 사라지는 깜빡임을 방지하려면
  //      초기값을 null로 두고 fetch 완료 후에만 관리자 메뉴를 표시
  const [adminInfo, setAdminInfo] = useState<AdminInfo>(null);

  useEffect(() => {
    // /api/web/me 호출 — 응답의 data.admin_info 필드를 사용
    // 이미 다른 곳에서 이 API를 호출하고 있을 수 있지만, 셸 자체가 개별 상태를 관리
    fetch("/api/web/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        // apiSuccess 응답 형식: { success: true, data: {...} }
        const info = json?.data?.admin_info ?? null;
        setAdminInfo(info);
      })
      .catch(() => {
        // 실패 시 비관리자로 간주 — 본인 메뉴만 표시되어 안전함
        setAdminInfo(null);
      });
  }, []);

  // 필터링된 메뉴 목록 — adminInfo 변경 시 자동 재계산
  const visibleItems = NAV_ITEMS.filter((item) => isNavVisible(item, adminInfo));
  // 관리자 메뉴 표시 여부 — 하나라도 있으면 구분선 렌더
  const hasAdminItems = visibleItems.some((item) => item.requires !== null);

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

        {/* 네비
            이유: 본인 메뉴와 관리자 메뉴 사이에 구분선 + 라벨을 넣어
                 역할을 시각적으로 구분. 관리자 메뉴가 0개면 구분선도 숨김 */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {visibleItems.map((item, idx) => {
            const active = isActive(item.href);
            // 이 항목이 관리자 섹션의 첫 항목인지 판정 — 앞에 구분선을 삽입
            const prev = idx > 0 ? visibleItems[idx - 1] : null;
            const isFirstAdmin =
              item.requires !== null && (prev === null || prev.requires === null);

            return (
              <div key={item.href}>
                {/* 본인 메뉴와 관리자 메뉴 경계 구분선 + 라벨 */}
                {isFirstAdmin && hasAdminItems && (
                  <div
                    className="mt-3 mb-2 px-4 pt-3 border-t text-[10px] font-black uppercase tracking-widest"
                    style={{
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    관리자
                  </div>
                )}
                <Link
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
              </div>
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

        {/* 우측: 알림 벨 + 본사이트 링크
            이유: 벨은 모바일/데스크톱 공통으로 보여야 하므로 헤더 우측에 배치.
                 MyBDR 홈 링크는 그 다음 */}
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
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
