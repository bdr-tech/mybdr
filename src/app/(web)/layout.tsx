"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferFilterProvider, usePreferFilter } from "@/contexts/prefer-filter-context";
import { SlideMenu } from "@/components/shared/slide-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { TextSizeToggle } from "@/components/shared/text-size-toggle";

/* ============================================================
 * 사이드바 네비게이션 항목 정의
 * Material Symbols 아이콘명 사용
 * ============================================================ */
const sideNavItems = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/games", label: "경기찾기", icon: "sports_basketball" },
  { href: "/tournaments", label: "대회", icon: "emoji_events" },
  { href: "/teams", label: "팀", icon: "groups" },
  { href: "/rankings", label: "랭킹", icon: "leaderboard" },
  { href: "/community", label: "커뮤니티", icon: "forum" },
];

/* 모바일 하단 네비바 항목: 5개 탭 */
const bottomNavItems = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/games", label: "경기", icon: "sports_basketball" },
  { href: "/tournaments", label: "대회", icon: "emoji_events" },
  { href: "/teams", label: "팀", icon: "groups" },
  { href: "#", label: "더보기", icon: "menu" },
];

/* ============================================================
 * WebLayoutInner — PreferFilterProvider 내부에서 usePreferFilter 사용
 * 레이아웃: 좌측 사이드바(데스크탑) + 상단 헤더(모바일) + 하단 네비(모바일) + FAB
 * ============================================================ */
function WebLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setLoggedIn } = usePreferFilter();
  const [user, setUser] = useState<{ name: string; role: string; prefer_filter_enabled?: boolean } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  /* 슬라이드 메뉴 열림/닫힘 상태 (모바일 "더보기" 탭용) */
  const [slideMenuOpen, setSlideMenuOpen] = useState(false);

  /* 마운트 시 로그인 + 알림 병렬 fetch (waterfall 방지) */
  useEffect(() => {
    Promise.all([
      fetch("/api/web/me", { credentials: "include" })
        .then(async (r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/web/notifications", { credentials: "include" })
        .then(async (r) => (r.ok ? (r.json() as Promise<{ unreadCount: number }>) : null))
        .catch(() => null),
    ]).then(([userData, notifData]) => {
      setUser(userData);
      // DB의 선호 설정 여부를 preferFilter 기본값으로 전달
      setLoggedIn(!!userData, userData?.prefer_filter_enabled ?? false);
      if (userData && notifData) setUnreadCount(notifData.unreadCount ?? 0);
    });
  }, [setLoggedIn]);

  /* 알림 카운트 30초 간격 폴링 (페이지 이동마다 호출하지 않고 주기적으로만) */
  useEffect(() => {
    if (!user) return;

    // 폴링 함수: 알림 API를 호출하여 미읽 수 갱신
    const pollNotifications = () => {
      fetch("/api/web/notifications", { credentials: "include" })
        .then(async (r) => {
          if (r.ok) {
            const data = (await r.json()) as { unreadCount: number };
            setUnreadCount(data.unreadCount ?? 0);
          }
        })
        .catch(() => {});
    };

    // 마운트 시 즉시 1회 호출 + 30초 간격 반복
    pollNotifications();
    const intervalId = setInterval(pollNotifications, 30000);

    // 언마운트 시 타이머 정리 (메모리 누수 방지)
    return () => clearInterval(intervalId);
  }, [user]);

  /* 현재 경로가 활성 메뉴인지 판별 */
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  /* 로그아웃 핸들러 */
  const handleLogout = async () => {
    await fetch("/api/web/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">

      {/* ========================================
       * 데스크탑 좌측 사이드바 (lg 이상에서만 표시)
       * fixed left-0, w-64, 어두운 배경
       * ======================================== */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-background)] overflow-hidden lg:flex">

        {/* sidebar-scaled: 내부 컨텐츠를 80%로 축소하여 더 많은 요소 수용 */}
        <div className="sidebar-scaled p-8 flex flex-col h-full">

        {/* 상단: BDR 로고 (중앙 배치, 236px 확대) + 서브텍스트 */}
        <div className="mb-12 flex flex-col items-center">
          <Link href="/" prefetch={true}>
            <Image
              src="/images/logo.png"
              alt="BDR"
              width={165}
              height={50}
              className="w-[165px] h-auto"
              priority
            />
          </Link>
          {/* 서브텍스트: 브랜드 슬로건 */}
          <span className="mt-1 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            Elite Athletics
          </span>
        </div>

        {/* 메인 네비게이션 메뉴 (6개) */}
        <nav className="flex flex-1 flex-col gap-2">
          {sideNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-4 rounded-lg px-4 py-3 text-base font-medium transition-all ${
                  active
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {/* Material Symbols 아이콘: 활성 시 FILL 1 */}
                <span
                  className="material-symbols-outlined text-xl"
                  style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 하단 영역: 플레이어 카드 + Upgrade Pro + Settings/Logout */}
        <div className="mt-auto flex flex-col gap-3 border-t border-[var(--color-border)] pt-4">

          {/* 플레이어 카드: 로그인 상태에서만 표시 */}
          {user && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 아바타: 이름 첫 글자 */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
                    {user.name?.trim() ? user.name.trim()[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{user.name || "사용자"}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Level 1</p>
                  </div>
                </div>
                {/* 알림 벨 아이콘 (빨간 점 표시) */}
                <Link href="/notifications" className="relative p-1">
                  <span className="material-symbols-outlined text-xl text-[var(--color-text-muted)]">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                  )}
                </Link>
              </div>
              {/* "경기 시작하기" 버튼 */}
              <Link
                href="/games/new"
                className="mt-3 block w-full rounded-lg bg-[var(--color-primary)] py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                경기 시작하기
              </Link>
            </div>
          )}

          {/* 비로그인 시 로그인 버튼 */}
          {!user && (
            <Link
              href="/login"
              className="block w-full rounded-lg bg-[var(--color-primary)] py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              로그인
            </Link>
          )}

          {/* Upgrade Pro 버튼 */}
          <Link
            href="/pricing"
            className="block w-full rounded-lg bg-[var(--color-accent)] py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Upgrade Pro
          </Link>

          {/* Settings / Logout 링크 */}
          <div className="flex flex-col gap-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
              <span>Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
        </div>{/* sidebar-scaled 래퍼 닫기 */}
      </aside>

      {/* ========================================
       * 모바일 상단 헤더 (lg 이하에서만 표시)
       * fixed top, h-16, 어두운 배경
       * ======================================== */}
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 lg:hidden">
        {/* 좌: BDR 로고 */}
        <Link href="/" prefetch={true}>
          <Image
            src="/images/logo.png"
            alt="BDR"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* 우: 다크모드 + 큰글씨 + 검색 + 알림 */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <TextSizeToggle />
          <Link href="/games" className="rounded p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]">
            <span className="material-symbols-outlined text-xl">search</span>
          </Link>
          {user && (
            <Link href="/notifications" className="relative rounded p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]">
              <span className="material-symbols-outlined text-xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
              )}
            </Link>
          )}
        </div>
      </header>

      {/* ========================================
       * 데스크탑 상단 우측 (lg 이상에서만 표시)
       * 사이드바 너비(left-64) 오른쪽 영역, 배경 투명
       * pointer-events-none으로 클릭 통과, 내부 요소만 클릭 가능
       * ======================================== */}
      {/* 데스크탑 상단 헤더바: 배경+blur로 콘텐츠와 구분, sticky 효과 */}
      <div
        className="pointer-events-none fixed right-0 top-0 z-40 hidden items-center justify-end gap-3 border-b border-[var(--color-border)] px-6 py-2 backdrop-blur-xl lg:flex"
        style={{ left: "16rem", backgroundColor: "color-mix(in srgb, var(--color-background) 80%, transparent)" }}
      >
        {/* 다크/라이트 모드 토글 */}
        <div className="pointer-events-auto"><ThemeToggle /></div>
        {/* 글씨 크기 조절 토글 */}
        <div className="pointer-events-auto"><TextSizeToggle /></div>
        {/* 검색 아이콘 */}
        <Link href="/games" className="pointer-events-auto rounded p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]">
          <span className="material-symbols-outlined text-xl">search</span>
        </Link>
        {/* 알림 아이콘 (빨간 점) */}
        {user && (
          <Link href="/notifications" className="pointer-events-auto relative rounded p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]">
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
            )}
          </Link>
        )}
        {/* 프로필 아바타 */}
        {user ? (
          <Link href="/profile" className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-elevated)] text-sm font-bold text-[var(--color-text-primary)]">
            {user.name?.trim() ? user.name.trim()[0].toUpperCase() : "U"}
          </Link>
        ) : (
          <Link
            href="/login"
            className="pointer-events-auto rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]"
          >
            로그인
          </Link>
        )}
      </div>

      {/* ========================================
       * 메인 콘텐츠 영역
       * lg:ml-64 (사이드바 너비만큼 좌측 여백)
       * pt-16 (모바일 헤더) / lg:pt-20 (데스크탑 여유)
       * pb-20 (모바일 하단 네비) / lg:pb-8 (데스크탑)
       * ======================================== */}
      <main className="min-h-screen flex-1 pb-20 pt-16 lg:ml-64 lg:pb-12 lg:pt-12">
        <div className="mx-auto p-4 lg:px-6 lg:py-4">
          {children}
        </div>
      </main>

      {/* 푸터: 데스크탑에서만 표시 (모바일은 하단 네비바가 있으므로 숨김) */}
      <div className="mt-auto hidden lg:ml-64 lg:block">
        <Footer />
      </div>

      {/* ========================================
       * 모바일 하단 네비바 (lg 이하에서만 표시)
       * 5개 탭, 활성=빨간색+scale-110, 비활성=회색
       * ======================================== */}
      <nav
        className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around rounded-t-xl border-t border-[var(--color-border)] bg-[var(--color-surface)] px-2 lg:hidden"
        style={{
          boxShadow: "0 -4px 12px rgba(0,0,0,0.5)",
          paddingBottom: "max(0px, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          /* "더보기" 탭은 슬라이드 메뉴를 여는 버튼으로 동작 */
          const isMoreTab = item.icon === "menu";

          if (isMoreTab) {
            return (
              <button
                key="more-tab"
                onClick={() => setSlideMenuOpen(true)}
                className="flex flex-col items-center justify-center text-[var(--color-text-muted)] transition-all"
              >
                <span className="material-symbols-outlined text-2xl">menu</span>
                <span className="mt-0.5 text-xs font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center transition-all ${
                active
                  ? "scale-110 text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              {/* Material Symbols 아이콘: 활성 시 FILL 1 */}
              <span
                className="material-symbols-outlined text-2xl"
                style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
              >
                {item.icon}
              </span>
              <span className="mt-0.5 text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ========================================
       * FAB (모바일 전용, lg 이하에서만 표시)
       * 빠른 경기 생성 버튼
       * ======================================== */}
      <Link
        href="/games/new"
        className="fixed z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg transition-transform active:scale-90 lg:hidden"
        style={{ bottom: "5rem", right: "1.5rem" }}
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </Link>

      {/* 슬라이드 메뉴: "더보기" 탭에서 열림 */}
      <SlideMenu
        open={slideMenuOpen}
        onClose={() => setSlideMenuOpen(false)}
        isLoggedIn={!!user}
        role={user?.role}
        name={user?.name}
      />
    </div>
  );
}

/* ============================================================
 * WebLayout — 최상위 레이아웃
 * SWRProvider + PreferFilterProvider로 감싸고 WebLayoutInner 렌더
 * ============================================================ */
export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <PreferFilterProvider>
        <WebLayoutInner>{children}</WebLayoutInner>
      </PreferFilterProvider>
    </SWRProvider>
  );
}
