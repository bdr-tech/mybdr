"use client";

// 이유: layout.tsx 인라인 컴포넌트가 비대해져 다른 작업과 충돌이 잦았다.
// 독립 파일로 분리하여 유지보수성을 높이고, 0건 처리(Q10) 로직을 이곳에서만 확장한다.

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ============================================================
 * SearchAutocomplete — PC 검색바 + 실시간 자동완성 드롭다운
 * 타이핑 시 디바운스 300ms 후 /api/web/search?q= 호출
 * 결과를 카테고리(경기/대회/팀/커뮤니티)별 최대 3건씩 드롭다운 표시
 * ESC 또는 외부 클릭으로 닫기
 * [Q10] 0건일 때도 드롭다운을 닫지 않고 "인기 검색어 + 빠른 진입"을 노출한다.
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

// [Q10] 결과 0건일 때 폴백으로 노출할 정적 인기 검색어 배열
// 이유: 서버 DB에 "검색 통계" 스키마가 없으므로 정적 값으로 즉시 UX 개선
const POPULAR_KEYWORDS = ["픽업게임", "코트", "BDR 챌린지", "농구화", "강남"];

// [Q10] 결과 0건일 때 빠르게 진입할 수 있는 추천 카테고리
// lucide-react 금지 → Material Symbols 아이콘 사용
const QUICK_LINKS: { label: string; icon: string; href: string }[] = [
  { label: "팀 둘러보기", icon: "groups", href: "/teams" },
  { label: "근처 코트 찾기", icon: "location_on", href: "/courts" },
];

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

export function SearchAutocomplete() {
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

  /* 디바운스 300ms 후 검색 API 호출
   * [Q10] 결과가 0건이어도 isOpen=true로 두어 폴백 UI(인기 검색어)를 보여준다.
   */
  const debouncedSearch = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q || q.length < 1) {
      setResults(null);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // [Q10] 로딩 스켈레톤을 보여주려면 드롭다운을 즉시 열어야 한다.
    // 최근 검색어 오버레이와 충돌하지 않도록 showRecent는 꺼둔다.
    setIsOpen(true);
    setShowRecent(false);
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

  /* [Q10] 인기 검색어 클릭 시: /search?q=로 이동하고 최근 검색어에 저장 */
  const handlePopularClick = (keyword: string) => {
    saveRecentSearch(keyword);
    setIsOpen(false);
    setQuery("");
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
  };

  /* [Q10] 빠른 진입 카테고리 클릭 시: 드롭다운 닫고 이동 */
  const handleQuickClick = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
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

  // [Q10] 현재 입력이 있고, 로딩이 끝났는데, 결과가 0건인 상태
  // 이 분기에서만 "인기 검색어 + 빠른 진입" 폴백 UI를 렌더한다.
  const isEmptyResult = !!query.trim() && !isLoading && results !== null && totalResults === 0;

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

        {/* ============================================================
         * [Q10] 드롭다운 분기 (우선순위)
         *   1) 로딩 중 + 아직 결과 없음 → 스켈레톤
         *   2) 결과 0건 (isEmptyResult) → "검색 결과가 없어요" + 인기검색어 + 빠른진입
         *   3) 결과 >=1건 → 기존 카테고리 UI
         *   4) 이 외 → 닫힘
         * ============================================================ */}

        {/* 1) 로딩 스켈레톤: 첫 요청일 때만 보이도록 results=null 조건 포함 */}
        {isOpen && isLoading && !results && (
          <div
            className="absolute left-0 top-full mt-2 w-full overflow-hidden rounded-md border shadow-xl"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", zIndex: 100 }}
          >
            <div className="space-y-2 p-4">
              {/* 회색 바 3개로 간단한 스켈레톤 표현 (빈 화면 방지) */}
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-4 w-full animate-pulse rounded"
                  style={{ backgroundColor: "var(--color-surface)" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 2) 0건 폴백 UI: 안내 문구 + 인기 검색어 + 빠른 진입 */}
        {isOpen && isEmptyResult && (
          <div
            className="absolute left-0 top-full mt-2 w-full overflow-hidden rounded-md border shadow-xl"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", zIndex: 100 }}
          >
            {/* 안내 메시지: 회색 톤으로 과하지 않게 */}
            <div className="px-4 py-3 text-center">
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                검색 결과가 없어요
              </p>
            </div>

            {/* 인기 검색어 섹션 */}
            <div>
              {/* 카테고리 헤더: 기존 패턴 재사용 (trending_up 아이콘) */}
              <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "var(--color-surface)" }}>
                <span className="material-symbols-outlined text-base" style={{ color: "var(--color-text-muted)" }}>trending_up</span>
                <span className="text-xs font-semibold" style={{ color: "var(--color-text-tertiary)" }}>인기 검색어</span>
              </div>
              {POPULAR_KEYWORDS.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => handlePopularClick(keyword)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--color-surface)]"
                >
                  <span className="material-symbols-outlined text-base" style={{ color: "var(--color-text-muted)" }}>search</span>
                  <span className="truncate text-sm" style={{ color: "var(--color-text-primary)" }}>{keyword}</span>
                </button>
              ))}
            </div>

            {/* 빠른 진입 섹션 */}
            <div>
              <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "var(--color-surface)" }}>
                <span className="material-symbols-outlined text-base" style={{ color: "var(--color-text-muted)" }}>bolt</span>
                <span className="text-xs font-semibold" style={{ color: "var(--color-text-tertiary)" }}>빠른 진입</span>
              </div>
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => handleQuickClick(link.href)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-[var(--color-surface)]"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="material-symbols-outlined text-base" style={{ color: "var(--color-text-muted)" }}>{link.icon}</span>
                    <span className="truncate text-sm" style={{ color: "var(--color-text-primary)" }}>{link.label}</span>
                  </div>
                  <span className="material-symbols-outlined ml-2 text-base flex-shrink-0" style={{ color: "var(--color-text-muted)" }}>arrow_forward</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3) 기존 결과 UI: 1건 이상일 때만 (기존 로직 그대로 유지) */}
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
