"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferFilterProvider, usePreferFilter } from "@/contexts/prefer-filter-context";
import { ToastProvider } from "@/contexts/toast-context";
import { ProfileCompletionBanner } from "@/components/shared/profile-completion-banner";

/* ============================================================
 * dynamic import: 초기 번들 크기를 줄이기 위해
 * SSR이 불필요한 클라이언트 전용 컴포넌트를 lazy load 한다.
 * - SlideMenu: "더보기" 탭을 눌러야만 보이므로 지연 로딩
 * - ThemeToggle / TextSizeToggle: 작지만 SSR 불필요
 * ============================================================ */
const SlideMenu = dynamic(
  () => import("@/components/shared/slide-menu").then((m) => m.SlideMenu),
  { ssr: false }
);
const ThemeToggle = dynamic(
  () => import("@/components/shared/theme-toggle").then((m) => m.ThemeToggle),
  { ssr: false }
);
const TextSizeToggle = dynamic(
  () => import("@/components/shared/text-size-toggle").then((m) => m.TextSizeToggle),
  { ssr: false }
);

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
  { href: "/courts", label: "코트", icon: "location_on" },
  { href: "/rankings", label: "랭킹", icon: "leaderboard" },
  { href: "/community", label: "커뮤니티", icon: "forum" },
  { href: "/notifications", label: "알림", icon: "notifications" },
];

const bottomNavItems = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/games", label: "경기", icon: "sports_basketball" },
  { href: "/tournaments", label: "대회", icon: "emoji_events" },
  { href: "/community", label: "커뮤니티", icon: "forum" },
  { href: "#", label: "더보기", icon: "menu" },
];

/* ============================================================
 * PreferFilterToggleButton — 헤더 우측 선호 필터 토글 아이콘 버튼
 * ON: 파란색 tune 아이콘 / OFF: 회색 tune 아이콘
 * 클릭 시 usePreferFilter()의 togglePreferFilter() 호출
 * ============================================================ */
function PreferFilterToggleButton() {
  const { preferFilter, togglePreferFilter } = usePreferFilter();
  return (
    <button
      onClick={togglePreferFilter}
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-surface-bright)]"
      aria-label={preferFilter ? "맞춤 필터 켜짐" : "맞춤 필터 꺼짐"}
      title={preferFilter ? "맞춤 필터 켜짐" : "맞춤 필터 꺼짐"}
    >
      <span
        className="material-symbols-outlined text-xl"
        style={{
          color: preferFilter ? "var(--color-primary)" : "var(--color-text-muted)",
          fontVariationSettings: preferFilter ? "'FILL' 1" : undefined,
        }}
      >
        star
      </span>
    </button>
  );
}

/* ============================================================
 * SearchAutocomplete — PC 검색바 + 실시간 자동완성 드롭다운
 * 타이핑 시 디바운스 300ms 후 /api/web/search?q= 호출
 * 결과를 카테고리(경기/대회/팀/커뮤니티)별 최대 3건씩 드롭다운 표시
 * ESC 또는 외부 클릭으로 닫기
 * ============================================================ */
interface SearchResult {
  games: { id: string; title: string; venue_name?: string }[];
  tournaments: { id: string; name: string; city?: string }[];
  teams: { id: string; name: string; city?: string }[];
  posts: { id: string; title: string; category?: string }[];
}

function SearchAutocomplete() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 디바운스 300ms 후 검색 API 호출 */
  const debouncedSearch = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q || q.length < 1) {
      setResults(null);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/web/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch {
        /* 네트워크 에러 무시 */
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  /* 외부 클릭 시 드롭다운 닫기 */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* 검색 결과 항목 클릭 시 이동 후 드롭다운 닫기 */
  const navigate = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  /* 드롭다운에 표시할 카테고리별 항목 (최대 3건씩) */
  const categories = results ? [
    { label: "경기", icon: "sports_basketball", items: results.games.slice(0, 3).map(g => ({ id: g.id, title: g.title, sub: g.venue_name, href: `/games/${g.id}` })) },
    { label: "대회", icon: "emoji_events", items: results.tournaments.slice(0, 3).map(t => ({ id: t.id, title: t.name, sub: t.city, href: `/tournaments/${t.id}` })) },
    { label: "팀", icon: "groups", items: results.teams.slice(0, 3).map(t => ({ id: t.id, title: t.name, sub: t.city, href: `/teams/${t.id}` })) },
    { label: "커뮤니티", icon: "forum", items: results.posts.slice(0, 3).map(p => ({ id: p.id, title: p.title, sub: p.category, href: `/community/${p.id}` })) },
  ].filter(cat => cat.items.length > 0) : [];

  const totalResults = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div ref={containerRef} className="relative">
      <form
        className="relative w-full"
        onSubmit={(e) => {
          e.preventDefault();
          const q = query.trim();
          if (q) {
            setIsOpen(false);
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }
        }}
      >
        {/* 검색 아이콘 */}
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: "var(--color-text-muted)" }}>search</span>

        {/* 로딩 스피너: 검색 중일 때 우측에 표시 */}
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-muted)] border-t-transparent" />
        )}

        <input
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            debouncedSearch(e.target.value.trim());
          }}
          onFocus={() => { if (results && totalResults > 0) setIsOpen(true); }}
          onKeyDown={(e) => { if (e.key === "Escape") setIsOpen(false); }}
          placeholder="경기, 대회, 팀 검색..."
          autoComplete="off"
          className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
          style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
        />

        {/* 자동완성 드롭다운 */}
        {isOpen && categories.length > 0 && (
          <div
            className="absolute left-0 top-full mt-2 w-full overflow-hidden rounded-xl border shadow-xl"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", zIndex: 100 }}
          >
            {categories.map((cat) => (
              <div key={cat.label}>
                {/* 카테고리 헤더 */}
                <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "var(--color-surface)" }}>
                  <span className="material-symbols-outlined text-base" style={{ color: "var(--color-text-muted)" }}>{cat.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-tertiary)" }}>{cat.label}</span>
                </div>
                {/* 카테고리 항목 */}
                {cat.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-[var(--color-surface)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{item.title}</p>
                      {item.sub && (
                        <p className="truncate text-xs" style={{ color: "var(--color-text-muted)" }}>{item.sub}</p>
                      )}
                    </div>
                    <span className="material-symbols-outlined ml-2 text-base flex-shrink-0" style={{ color: "var(--color-text-muted)" }}>arrow_forward</span>
                  </button>
                ))}
              </div>
            ))}
            {/* 전체 검색 결과 보기 링크 */}
            <button
              type="button"
              onClick={() => { setIsOpen(false); router.push(`/search?q=${encodeURIComponent(query.trim())}`); }}
              className="flex w-full items-center justify-center gap-1 border-t px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--color-surface)]"
              style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
            >
              &quot;{query.trim()}&quot; 전체 검색 결과 보기
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

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

        {/* 검색창: 홈 위에 배치 */}
        <div className="px-3 mb-2">
          <SearchAutocomplete />
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

        {/* SNS 링크: YouTube + Instagram (사이드 네비 하단) */}
        <div className="px-4 pb-2 flex items-center gap-3">
          <a
            href="https://www.youtube.com/@BDRBASKET"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-surface)]"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="BDR YouTube"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
          </a>
          <a
            href="https://www.instagram.com/bdr_basket"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-surface)]"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="BDR Instagram"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
          </a>
        </div>

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
        {/* 좌측: 뒤로가기 + 로고 (모바일만, PC는 사이드네비에 있음) */}
        <div className="flex items-center gap-2 lg:hidden">
          {pathname !== "/" && (
            <button
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push("/");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-bright)]"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
          )}
          <Link href="/" prefetch={true}>
            <Image src="/images/logo.png" alt="BDR" width={100} height={30} className="h-7 w-auto" />
          </Link>
        </div>

        {/* 우측: 테마+검색+선호필터+알림+프로필 */}
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <TextSizeToggle />
          {/* 선호 필터 토글: 로그인 시에만 표시, ON=파란 아이콘 / OFF=회색 아이콘 */}
          {user && <PreferFilterToggleButton />}
          {/* 검색은 사이드네비의 검색창으로 이동 — 헤더에서 제거 */}
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
      <main className="min-h-screen flex-1 pb-20 pt-14 lg:ml-60 lg:pb-8 animate-fade-in">
        <div className="mx-auto max-w-[640px] px-5 py-4 lg:max-w-[960px] lg:px-8">
          {/* 로그인 상태에서 프로필 미완성이면 상단 유도 배너 표시 */}
          {user && <ProfileCompletionBanner userName={user.name} />}
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
        <ToastProvider>
          <WebLayoutInner>{children}</WebLayoutInner>
        </ToastProvider>
      </PreferFilterProvider>
    </SWRProvider>
  );
}
