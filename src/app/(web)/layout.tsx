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
import { PwaInstallBanner } from "@/components/shared/pwa-install-banner";

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
/* ProfileDropdown: 헤더 우측 프로필 아이콘 → 드롭다운 메뉴 */
const ProfileDropdown = dynamic(
  () => import("@/components/shared/profile-dropdown").then((m) => m.ProfileDropdown),
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
/* PC 우측 사이드바: xl(1280px) 이상에서만 표시, SSR 불필요 */
const RightSidebar = dynamic(
  () => import("@/components/layout/right-sidebar").then((m) => m.RightSidebar),
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
  { href: "/organizations", label: "단체", icon: "corporate_fare" },
  { href: "/teams", label: "팀", icon: "groups" },
  { href: "/courts", label: "코트", icon: "location_on" },
  { href: "/rankings", label: "랭킹", icon: "leaderboard" },
  { href: "/community", label: "커뮤니티", icon: "forum" },
];

const bottomNavItems = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/games", label: "경기", icon: "sports_basketball" },
  { href: "/tournaments", label: "대회", icon: "emoji_events" },
  { href: "/community", label: "커뮤니티", icon: "forum" },
  { href: "#", label: "더보기", icon: "menu" },
];

/* ============================================================
 * PreferFilterToggleButton — 헤더 우측 맞춤 필터 토글 아이콘 버튼
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
  courts: { id: string; name: string; city?: string; district?: string }[];
  users: { id: string; nickname?: string; name?: string; position?: string; city?: string }[];
}

// localStorage에 최근 검색어를 저장/조회하는 키와 최대 개수
const RECENT_SEARCH_KEY = "bdr_recent_searches";
const RECENT_SEARCH_MAX = 5;

// 최근 검색어 읽기
function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 최근 검색어 저장 (중복 제거, 최대 5개)
function saveRecentSearch(query: string) {
  try {
    const list = getRecentSearches().filter((s) => s !== query);
    list.unshift(query);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(list.slice(0, RECENT_SEARCH_MAX)));
  } catch {
    /* localStorage 사용 불가 시 무시 */
  }
}

function SearchAutocomplete() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // 최근 검색어 상태 (포커스 시 로드)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
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
        setShowRecent(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* 검색 결과 항목 클릭 시 이동 후 드롭다운 닫기 */
  const navigate = (href: string) => {
    setIsOpen(false);
    setShowRecent(false);
    setQuery("");
    router.push(href);
  };

  /* 최근 검색어 클릭 시: 해당 검색어로 바로 이동 */
  const handleRecentClick = (term: string) => {
    setQuery(term);
    setShowRecent(false);
    saveRecentSearch(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  /* 드롭다운에 표시할 카테고리별 항목 (최대 3건씩) */
  const categories = results ? [
    { label: "경기", icon: "sports_basketball", items: results.games.slice(0, 3).map(g => ({ id: g.id, title: g.title, sub: g.venue_name, href: `/games/${g.id}` })) },
    { label: "대회", icon: "emoji_events", items: results.tournaments.slice(0, 3).map(t => ({ id: t.id, title: t.name, sub: t.city, href: `/tournaments/${t.id}` })) },
    { label: "팀", icon: "groups", items: results.teams.slice(0, 3).map(t => ({ id: t.id, title: t.name, sub: t.city, href: `/teams/${t.id}` })) },
    { label: "코트", icon: "location_on", items: results.courts.slice(0, 3).map(c => ({ id: c.id, title: c.name, sub: c.district || c.city, href: `/courts/${c.id}` })) },
    { label: "유저", icon: "person", items: (results.users || []).slice(0, 3).map(u => ({ id: u.id, title: u.nickname || u.name || "알 수 없음", sub: u.city || u.position, href: `/profile/${u.id}` })) },
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
            setShowRecent(false);
            saveRecentSearch(q);
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
          onFocus={() => {
            if (results && totalResults > 0) { setIsOpen(true); }
            else if (!query.trim()) {
              // 입력이 비었을 때 최근 검색어 표시
              const recent = getRecentSearches();
              setRecentSearches(recent);
              if (recent.length > 0) setShowRecent(true);
            }
          }}
          onKeyDown={(e) => { if (e.key === "Escape") setIsOpen(false); }}
          placeholder="경기, 대회, 팀 검색..."
          autoComplete="off"
          className="w-full rounded-md py-2.5 pl-10 pr-4 text-sm outline-none"
          style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-primary)" }}
        />

        {/* 최근 검색어 드롭다운: 입력이 비어있고 검색 결과가 없을 때만 표시 */}
        {showRecent && !isOpen && recentSearches.length > 0 && (
          <div
            className="absolute left-0 top-full mt-2 w-full overflow-hidden rounded-md border shadow-xl"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", zIndex: 100 }}
          >
            <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: "var(--color-surface)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--color-text-tertiary)" }}>최근 검색어</span>
              <button
                type="button"
                onClick={() => {
                  try { localStorage.removeItem(RECENT_SEARCH_KEY); } catch { /* 무시 */ }
                  setRecentSearches([]);
                  setShowRecent(false);
                }}
                className="text-xs transition-colors hover:opacity-70"
                style={{ color: "var(--color-text-muted)" }}
              >
                전체 삭제
              </button>
            </div>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleRecentClick(term)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--color-surface)]"
              >
                <span className="material-symbols-outlined text-base" style={{ color: "var(--color-text-muted)" }}>history</span>
                <span className="truncate text-sm" style={{ color: "var(--color-text-primary)" }}>{term}</span>
              </button>
            ))}
          </div>
        )}

        {/* 자동완성 드롭다운 */}
        {isOpen && categories.length > 0 && (
          <div
            className="absolute left-0 top-full mt-2 w-full overflow-hidden rounded-md border shadow-xl"
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
              onClick={() => { setIsOpen(false); saveRecentSearch(query.trim()); router.push(`/search?q=${encodeURIComponent(query.trim())}`); }}
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
  const [user, setUser] = useState<{ name: string; role: string; prefer_filter_enabled?: boolean; hidden_menus?: string[] } | null>(null);
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
      // DB의 맞춤 설정 여부를 preferFilter 기본값으로 전달
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
            <Image src="/images/logo.png" alt="BDR" width={250} height={75} className="h-[70px] w-auto" />
          </Link>
        </div>

        {/* 검색창: 홈 위에 배치 */}
        <div className="px-3 mb-2">
          <SearchAutocomplete />
        </div>

        {/* 메인 네비게이션 — hidden_menus에 포함된 메뉴는 숨김 */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {sideNavItems
            .filter(item => !(user?.hidden_menus ?? []).includes(item.href))
            .map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} prefetch={true}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-black uppercase tracking-wide transition-all rounded-none ${
                  active
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] border-l-4 border-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] border-l-4 border-transparent hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
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

        {/* 하단: 관리 링크 (로그인) 또는 로그인 버튼 (비로그인) */}
        <div className="border-t border-[var(--color-border)] p-3 space-y-2">
          {user ? (
            /* 관리 링크만 표시 (프로필은 헤더 드롭다운으로 이동) */
            <Link href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-black uppercase tracking-wide text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-colors border-l-4 border-transparent hover:border-[var(--color-primary)]">
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              ADMIN
            </Link>
          ) : (
            <Link href="/login" className="block w-full bg-[var(--color-primary)] py-3 text-center text-sm font-black uppercase tracking-wider text-white rounded-sm shadow-glow-primary hover:bg-[var(--color-primary-hover)] transition-colors">
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
        {/* 좌측: 로고 (모바일만, PC는 사이드네비에 있음) */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/" prefetch={true}>
            <Image src="/images/logo.png" alt="BDR" width={115} height={34} className="h-8 w-auto" />
          </Link>
        </div>

        {/* 우측: 테마+검색+선호필터+알림+프로필 */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <ThemeToggle />
          <TextSizeToggle />
          {/* 맞춤 필터 토글: 로그인 시에만 표시, ON=파란 아이콘 / OFF=회색 아이콘 */}
          {user && <PreferFilterToggleButton />}
          {/* 모바일 검색 아이콘: PC에서는 사이드네비 검색창이 있으므로 lg 이하에서만 표시 */}
          <Link
            href="/search"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-bright)] lg:hidden"
            aria-label="검색"
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
          {/* 프로필: 로그인 시 드롭다운 메뉴, 비로그인 시 로그인 버튼 */}
          {user ? (
            <ProfileDropdown name={user.name} />
          ) : (
            <Link
              href="/login"
              className="bg-[var(--color-primary)] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-[var(--color-primary-hover)] rounded-sm shadow-glow-primary"
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
        {/* xl 이상: 콘텐츠 + 우측 사이드바를 flex 가로 배치 */}
        <div className="mx-auto flex max-w-[1320px] gap-6 px-5 py-4 lg:px-8">
          {/* 메인 콘텐츠 영역 — 기존 max-w 유지, flex-1로 나머지 공간 차지 */}
          <div className="mx-auto min-w-0 max-w-[640px] flex-1 lg:max-w-[960px]">
            {/* PWA 설치 유도 배너 (미설치 + 7일 미표시 아닐 때) */}
            <PwaInstallBanner />
            {/* 로그인 상태에서 프로필 미완성이면 상단 유도 배너 표시 */}
            {user && <ProfileCompletionBanner userName={user.name} />}
            {children}
          </div>
          {/* PC 우측 사이드바: xl(1280px) 이상에서만 표시, 너비 320px 고정 */}
          <div className="hidden w-80 shrink-0 xl:block">
            <RightSidebar />
          </div>
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
                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
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
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 슬라이드 메뉴: "더보기" 탭에서 열림 (랭킹, 커뮤니티, 프로필, 설정 등) */}
      {/* 슬라이드 메뉴에도 hidden_menus 전달하여 동일하게 필터링 */}
      <SlideMenu
        open={slideMenuOpen}
        onClose={() => setSlideMenuOpen(false)}
        isLoggedIn={!!user}
        role={user?.role}
        name={user?.name}
        hiddenMenus={user?.hidden_menus}
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
