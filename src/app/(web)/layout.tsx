"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferFilterProvider, usePreferFilter } from "@/contexts/prefer-filter-context";
import { SlideMenu } from "@/components/shared/slide-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { TextSizeToggle } from "@/components/shared/text-size-toggle";

/* ============================================================
 * 하단 탭 네비바 항목: 5개 탭 (모바일+데스크탑 공통)
 * 토스 스타일: 모든 화면에서 하단 탭 네비 표시
 * ============================================================ */
/* ============================================================
 * PC 좌측 사이드 네비 항목 (lg 이상에서만 표시)
 * 모바일 하단 탭에는 없는 랭킹/커뮤니티/알림도 포함
 * ============================================================ */
const sideNavItems = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/games", label: "경기", icon: "sports_basketball" },
  { href: "/tournaments", label: "대회", icon: "emoji_events" },
  { href: "/teams", label: "팀", icon: "groups" },
  { href: "/rankings", label: "랭킹", icon: "leaderboard" },
  { href: "/community", label: "커뮤니티", icon: "forum" },
  { href: "/notifications", label: "알림", icon: "notifications" },
];

const bottomNavItems = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/games", label: "경기", icon: "sports_basketball" },
  { href: "/tournaments", label: "대회", icon: "emoji_events" },
  { href: "/teams", label: "팀", icon: "groups" },
  { href: "#", label: "더보기", icon: "menu" },
];

/* ============================================================
 * WebLayoutInner — 토스 스타일 레이아웃
 * 구조: 상단 미니멀 헤더(56px) + 메인 콘텐츠(중앙 정렬) + 하단 탭 네비(56px)
 * 사이드바 완전 제거, 모바일/데스크탑 동일 구조
 * ============================================================ */
function WebLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setLoggedIn } = usePreferFilter();
  const [user, setUser] = useState<{ name: string; role: string; prefer_filter_enabled?: boolean } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  /* 슬라이드 메뉴 열림/닫힘 상태 ("더보기" 탭용) */
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

  /* 알림 카운트 30초 간격 폴링 */
  useEffect(() => {
    if (!user) return;

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

    pollNotifications();
    const intervalId = setInterval(pollNotifications, 30000);
    return () => clearInterval(intervalId);
  }, [user]);

  /* 현재 경로가 활성 메뉴인지 판별 */
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">

      {/* ========================================
       * PC 사이드 네비 (lg 이상에서만 표시)
       * 좌측 고정, 너비 240px, 로고+메뉴+프로필
       * ======================================== */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-60 flex-col border-r border-[var(--color-border)] bg-[var(--color-background)] lg:flex">
        {/* 로고 */}
        <div className="p-6 pb-4">
          <Link href="/">
            <Image src="/images/logo.png" alt="BDR" width={100} height={30} className="h-7 w-auto" />
          </Link>
        </div>

        {/* 메인 네비게이션 */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {sideNavItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} prefetch={true}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                }`}
              >
                <span className="material-symbols-outlined text-xl"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 하단: 프로필 + 로그아웃 */}
        <div className="border-t border-[var(--color-border)] p-4 space-y-2">
          {user ? (
            <>
              <Link href="/profile" className="flex items-center gap-3 px-2 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
                  {user.name?.trim()?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{user.name || "사용자"}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>프로필 보기</p>
                </div>
              </Link>
              <button onClick={async () => { await fetch("/api/web/logout", { method: "POST", credentials: "include" }); window.location.href = "/login"; }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login" className="block w-full rounded-xl bg-[var(--color-primary)] py-3 text-center text-sm font-bold text-white">
              로그인
            </Link>
          )}
        </div>
      </aside>

      {/* ========================================
       * 상단 헤더 (모바일+데스크탑 공통, 56px)
       * 토스 스타일: 미니멀 헤더, backdrop-blur
       * [뒤로가기]  MyBDR  [검색] [알림] [프로필]
       * ======================================== */}
      <header
        className="fixed top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4 backdrop-blur-xl left-0 right-0 lg:left-60"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-background) 85%, transparent)" }}
      >
        {/* 좌측: 모바일=뒤로+로고, PC=검색바 */}
        <div className="flex items-center gap-2">
          {/* 모바일: 뒤로가기 + 로고 */}
          <div className="flex items-center gap-2 lg:hidden">
            {pathname !== "/" && (
              <button
                onClick={() => router.back()}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-bright)]"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
            )}
            <Link href="/" prefetch={true}>
              <Image src="/images/logo.png" alt="BDR" width={100} height={30} className="h-7 w-auto" />
            </Link>
          </div>
          {/* PC: 검색바 */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="relative w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: "var(--color-text-muted)" }}>search</span>
              <input
                placeholder="경기, 대회, 팀 검색..."
                className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
              />
            </div>
          </div>
        </div>

        {/* 우측: 테마+검색+알림+프로필 */}
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <TextSizeToggle />
          {/* 모바일 검색 아이콘 (PC에서는 좌측 검색바 사용) */}
          <Link
            href="/games"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-bright)] lg:hidden"
          >
            <span className="material-symbols-outlined text-xl">search</span>
          </Link>
          {/* 알림 (PC에서도 표시 — 사이드네비 알림과 별개로 빠른 접근) */}
          {user && (
            <Link
              href="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-bright)]"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
              )}
            </Link>
          )}
          {/* 프로필 (PC에서도 유지) */}
          {user ? (
            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white"
            >
              {user.name?.trim() ? user.name.trim()[0].toUpperCase() : "U"}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              로그인
            </Link>
          )}
        </div>
      </header>

      {/* ========================================
       * 메인 콘텐츠 영역
       * 토스 스타일: max-width 640px (모바일 앱 느낌), mx-auto 중앙 정렬
       * pt-14 (헤더 56px) + pb-20 (하단 네비 80px)
       * ======================================== */}
      <main className="min-h-screen flex-1 pb-20 pt-14 lg:ml-60 lg:pb-8">
        <div className="mx-auto max-w-[640px] px-5 py-4 lg:max-w-[960px] lg:px-8">
          {children}
        </div>
      </main>

      {/* 푸터 */}
      <div className="pb-20 lg:ml-60 lg:pb-8">
        <div className="mx-auto max-w-[640px] px-5 lg:max-w-[960px] lg:px-8">
          <Footer />
        </div>
      </div>

      {/* ========================================
       * 하단 탭 네비 (모바일+데스크탑 공통, 56px)
       * 토스 스타일: 5개 탭, 활성=블루, 비활성=회색
       * 상단 보더로 구분, 배경은 blur 처리
       * ======================================== */}
      <nav
        className="fixed bottom-0 left-0 z-50 flex h-14 w-full items-center justify-around border-t border-[var(--color-border)] backdrop-blur-xl lg:hidden"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-background) 90%, transparent)",
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
                className="flex flex-col items-center justify-center gap-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
              >
                <span className="material-symbols-outlined text-2xl">menu</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {/* Material Symbols 아이콘: 활성 시 FILL 1 */}
              <span
                className="material-symbols-outlined text-2xl"
                style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 슬라이드 메뉴: "더보기" 탭에서 열림 (랭킹, 커뮤니티, 프로필, 설정 등) */}
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
