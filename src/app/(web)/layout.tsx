"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
       * 상단 헤더 (모바일+데스크탑 공통, 56px)
       * 토스 스타일: 미니멀 헤더, backdrop-blur
       * [뒤로가기]  MyBDR  [검색] [알림] [프로필]
       * ======================================== */}
      <header
        className="fixed top-0 z-50 flex h-14 w-full items-center justify-between border-b border-[var(--color-border)] px-4 backdrop-blur-xl"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-background) 85%, transparent)" }}
      >
        {/* 좌측: 뒤로가기 + 로고 텍스트 */}
        <div className="flex items-center gap-2">
          {/* 뒤로가기 버튼: 홈이 아닐 때만 표시 */}
          {pathname !== "/" && (
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-bright)]"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
          )}
          {/* 로고: 텍스트 "MyBDR" (토스 스타일: 작고 깔끔하게) */}
          <Link href="/" prefetch={true} className="text-lg font-bold text-[var(--color-text-primary)]">
            MyBDR
          </Link>
        </div>

        {/* 우측: 테마 + 글씨크기 + 검색 + 알림 + 프로필 */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <TextSizeToggle />
          {/* 검색 아이콘 */}
          <Link
            href="/games"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-bright)]"
          >
            <span className="material-symbols-outlined text-xl">search</span>
          </Link>
          {/* 알림 아이콘 (로그인 시) */}
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
          {/* 프로필 아바타 / 로그인 버튼 */}
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
      <main className="min-h-screen flex-1 pb-20 pt-14">
        <div className="mx-auto max-w-[640px] px-5 py-4">
          {children}
        </div>
      </main>

      {/* 푸터: 메인 콘텐츠 아래에 표시 */}
      <div className="mx-auto max-w-[640px] pb-20">
        <Footer />
      </div>

      {/* ========================================
       * 하단 탭 네비 (모바일+데스크탑 공통, 56px)
       * 토스 스타일: 5개 탭, 활성=블루, 비활성=회색
       * 상단 보더로 구분, 배경은 blur 처리
       * ======================================== */}
      <nav
        className="fixed bottom-0 left-0 z-50 flex h-14 w-full items-center justify-around border-t border-[var(--color-border)] backdrop-blur-xl"
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
