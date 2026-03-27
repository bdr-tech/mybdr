"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";
import { CATEGORIES } from "@/lib/constants/divisions";
import { usePreferFilter } from "@/contexts/prefer-filter-context";
import { formatShortDate } from "@/lib/utils/format-date";

// batch API fetcher: 장소명 배열을 한번에 보내고 맵으로 받음
const batchPhotoFetcher = (key: string) => {
  const queries = JSON.parse(key.replace("/api/web/place-photos:", ""));
  return fetch("/api/web/place-photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ queries }),
  })
    .then((res) => res.json())
    .then((data) => (data.results ?? {}) as Record<string, string | null>);
};

// API 응답 타입 (snake_case로 자동 변환됨)
interface TournamentFromApi {
  id: string;
  name: string;
  format: string | null;
  status: string | null;
  start_date: string | null;   // ISO string (apiSuccess가 camelCase -> snake_case 변환)
  end_date: string | null;
  entry_fee: string | null;    // Decimal -> string
  city: string | null;
  venue_name: string | null;
  max_teams: number | null;
  team_count: number;
  divisions: string[];         // 종별 목록
  categories: Record<string, boolean>;  // 종별 정보 { "general": true, ... }
  division_tiers: string[];             // 디비전 코드 배열 ["D5", "D6"]
}

interface TournamentsApiResponse {
  tournaments: TournamentFromApi[];
}

// -- 페이지당 대회 수: 3x3 그리드 = 9개 --
const TOURNAMENTS_PER_PAGE = 9;

// -- 상태별 배지 배경색 매핑 (카드 이미지 배너 위 오버레이용, UI 전용) --
// label은 공통 상수 TOURNAMENT_STATUS_LABEL에서 가져옴
const STATUS_BG: Record<string, string> = {
  draft:               "var(--color-text-disabled)",
  active:              "var(--color-primary)",
  published:           "var(--color-primary)",
  registration:        "var(--color-primary)",
  registration_open:   "var(--color-primary)",
  registration_closed: "#D97706",
  in_progress:         "var(--color-primary)",
  ongoing:             "var(--color-primary)",
  group_stage:         "var(--color-primary)",
  completed:           "var(--color-text-disabled)",
  cancelled:           "#EF4444",
};

// 대회 형식 라벨: 공통 상수에서 약어 버전 사용 (카드 UI 공간 절약)
// TOURNAMENT_FORMAT_LABEL_SHORT는 상단 import에서 가져옴

// -- 날짜 포맷: 공통 유틸 사용 (format-date.ts의 formatShortDate) --

// -- 대회 유형별 그라디언트 (경기 카드와 동일한 패턴) --
const FORMAT_GRADIENT: Record<string, { gradient: string; icon: string }> = {
  // 토너먼트 계열: 빨강→진빨강
  single_elimination: {
    gradient: "linear-gradient(135deg, #7f1d1d, #dc2626, #b91c1c)",
    icon: "emoji_events",
  },
  double_elimination: {
    gradient: "linear-gradient(135deg, #7f1d1d, #dc2626, #b91c1c)",
    icon: "emoji_events",
  },
  // 리그 계열: 파랑→네이비
  round_robin: {
    gradient: "linear-gradient(135deg, #1e3a5f, #1d4ed8, #312e81)",
    icon: "leaderboard",
  },
  // 풀리그+토너먼트 혼합: 보라→남색
  hybrid: {
    gradient: "linear-gradient(135deg, #312e81, #6d28d9, #4338ca)",
    icon: "hub",
  },
};

// 기본값 (유형 미지정 시): 빨강 계열
const DEFAULT_FORMAT_STYLE = {
  gradient: "linear-gradient(135deg, #7f1d1d, #dc2626, #b91c1c)",
  icon: "emoji_events",
};

// -- 스켈레톤 UI: 경기 카드와 동일한 컴팩트 스켈레톤 --
function TournamentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)]"
        >
          {/* 이미지 영역 스켈레톤: h-20 lg:h-28 (경기 카드와 동일) */}
          <Skeleton className="h-20 lg:h-28 w-full rounded-none" />
          <div className="p-3 space-y-2">
            {/* 제목 + 팀수 한 줄 */}
            <div className="flex justify-between">
              <Skeleton className="h-4 w-3/5 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            {/* 참가비 + 버튼 한 줄 */}
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-6 w-12 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// -- 대회 카드: 경기 카드와 동일한 컴팩트 스타일 --
// photoUrl을 부모에서 batch로 가져와서 prop으로 전달 (개별 API 호출 제거)
// photoUrl: undefined = 로딩 중 (shimmer), null = 사진 없음 (그라디언트+아이콘), string = 사진 있음
function TournamentCard({ tournament: t, photoUrl }: { tournament: TournamentFromApi; photoUrl?: string | null }) {
  const st = t.status ?? "draft";
  // 라벨은 공통 상수, 배경색은 UI 전용 매핑에서 가져옴
  const badgeLabel = TOURNAMENT_STATUS_LABEL[st] ?? st.toUpperCase();
  const badgeBg = STATUS_BG[st] ?? "var(--color-text-disabled)";
  const maxTeams = t.max_teams ?? 0;
  const location = t.venue_name ?? t.city ?? "";
  const hasFee = t.entry_fee && Number(t.entry_fee) > 0;
  const feeText = hasFee ? `\u20A9${Number(t.entry_fee).toLocaleString()}` : "무료";
  const isFull = maxTeams > 0 && t.team_count >= maxTeams;

  // 종별 라벨 배열: categories 객체에서 true인 키만 추출하여 한글 라벨로 변환
  const categoryLabels = Object.entries(t.categories ?? {})
    .filter(([, v]) => v === true)
    .map(([key]) => CATEGORIES[key as keyof typeof CATEGORIES]?.label ?? key)
    .filter(Boolean);

  // 디비전 코드 배열: division_tiers에서 가져와서 중간점(·)으로 연결
  const divisionTiers = (t.division_tiers ?? []).filter(Boolean);
  const divisionLabel = divisionTiers.join("\u00B7"); // "D5·D6·D7"

  // 종별/디비전 뱃지가 하나라도 있는지 확인
  const hasCategoryBadge = categoryLabels.length > 0;
  const hasDivisionBadge = divisionTiers.length > 0;

  // 대회 유형에 따른 그라디언트+아이콘 결정
  const formatStyle = FORMAT_GRADIENT[t.format ?? ""] ?? DEFAULT_FORMAT_STYLE;

  return (
    <Link href={`/tournaments/${t.id}`} prefetch={true}>
      <div className={`group rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] hover:shadow-lg transition-all h-full ${isFull ? "opacity-70 grayscale" : ""}`}>
        {/* 이미지 영역: 장소 사진 -> 유형별 그라디언트+아이콘 fallback */}
        {/* undefined: 로딩 중 (shimmer) / null: 사진 없음 / string: 사진 있음 */}
        <div
          className={`relative h-20 lg:h-28 flex items-center justify-center bg-cover bg-center ${photoUrl === undefined ? "animate-pulse" : ""}`}
          style={photoUrl
            ? { backgroundImage: `url(${photoUrl})` }
            : { background: formatStyle.gradient }
          }
        >
          {/* 사진이 없고 로딩도 아닐 때: 반투명 대형 아이콘 */}
          {photoUrl === null && (
            <span className="material-symbols-outlined text-5xl text-white/20">
              {formatStyle.icon}
            </span>
          )}

          {/* 상태 배지 (좌상단) */}
          <span
            className="absolute top-2 left-2 rounded px-2 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: badgeBg }}
          >
            {badgeLabel}
          </span>

          {/* 종별 + 디비전 뱃지 (좌하단) */}
          {(hasCategoryBadge || hasDivisionBadge) && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
              {categoryLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                >
                  {label}
                </span>
              ))}
              {hasDivisionBadge && (
                <span className="rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  {divisionLabel}
                </span>
              )}
            </div>
          )}

          {/* 장소 + 날짜 뱃지 (우하단, 경기 카드와 동일 패턴) */}
          <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
            {location && (
              <span className="flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm">
                <span className="material-symbols-outlined text-xs">location_on</span>
                <span className="line-clamp-1 max-w-[140px]">{location}</span>
              </span>
            )}
            {t.start_date && (
              <span className="flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm">
                <span className="material-symbols-outlined text-xs">calendar_today</span>
                {formatShortDate(t.start_date)}
              </span>
            )}
          </div>
        </div>

        {/* 정보 영역: 제목+팀수 한 줄, 참가비+버튼 한 줄 */}
        <div className="p-3">
          {/* 1행: 대회 제목 + 참가팀 현황 */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-bold line-clamp-1 text-[var(--color-text-primary)] flex-1">
              {t.name}
            </h3>
            {maxTeams > 0 && (
              <span className="shrink-0 text-xs font-bold text-[var(--color-primary)]">
                {t.team_count}/{maxTeams}팀
              </span>
            )}
          </div>

          {/* 2행: 참가비 + 참여 버튼 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">
              {hasFee ? feeText : <span className="text-xs text-[var(--color-text-muted)]">무료</span>}
            </span>
            {isFull ? (
              <span className="text-xs font-bold text-[var(--color-text-muted)] bg-[var(--color-border)] px-3 py-1 rounded">마감</span>
            ) : (
              <span className="text-xs font-bold text-white bg-[var(--color-primary)] px-3 py-1 rounded">참여</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// -- 페이지네이션 컴포넌트 (팀 목록과 동일 패턴) --
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // 페이지 번호 배열 생성
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="mt-16 flex items-center justify-center gap-2">
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded border transition-colors disabled:opacity-30"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      {/* 페이지 번호들 */}
      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={`dots-${idx}`}
            className="px-2"
            style={{ color: "var(--color-text-disabled)" }}
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="w-10 h-10 flex items-center justify-center rounded font-bold text-sm transition-colors"
            style={
              page === currentPage
                ? {
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-on-primary)",
                  }
                : {
                    borderWidth: "1px",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }
            }
          >
            {page}
          </button>
        )
      )}

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded border transition-colors disabled:opacity-30"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}

/**
 * TournamentsContent - 대회 목록 클라이언트 컴포넌트 (리디자인)
 *
 * API 로직은 기존과 100% 동일하게 유지.
 * UI만 새 디자인 시안(bdr_4 다크 / bdr_6 라이트)에 맞춰 교체.
 *
 * 변경 사항:
 * - "TOURNAMENT DIRECTORY" 대형 제목 + 부제
 * - 이미지 배너 카드 그리드 (3열)
 * - 클라이언트 사이드 페이지네이션 (9개/페이지)
 * - 드롭다운 필터 + 검색
 */
export function TournamentsContent({
  TournamentsFilterComponent,
}: {
  // TournamentsFilter 컴포넌트를 외부에서 주입받음
  // selectedCategory/selectedGender: 디비전 옵션 동적 변경을 위해 전달
  TournamentsFilterComponent: React.ComponentType<{
    onSearchChange: (query: string) => void;
    onRegionChange: (region: string) => void;
    onGenderChange: (gender: string) => void;
    onCategoryChange: (category: string) => void;
    onDivisionChange: (division: string) => void;
    selectedCategory?: string;
    selectedGender?: string;
  }>;
}) {
  const searchParams = useSearchParams();

  const [tournaments, setTournaments] = useState<TournamentFromApi[]>([]);
  const [loading, setLoading] = useState(true);

  // 클라이언트 사이드 필터 상태 (지역/성별/종별/디비전)
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");

  // 상태별 탭 필터: 모집중 / 진행중 / 완료
  const [statusTab, setStatusTab] = useState<"recruiting" | "active" | "ended">("recruiting");

  // 클라이언트 사이드 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

  // 전역 선호 필터 Context에서 상태를 읽어옴
  const { preferFilter } = usePreferFilter();

  // searchParams 또는 preferFilter가 바뀔 때마다 API 호출 (기존 로직 그대로 유지)
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams(searchParams.toString());
    if (preferFilter) {
      params.set("prefer", "true");
    } else {
      params.delete("prefer");
    }
    const url = `/api/web/tournaments?${params.toString()}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<TournamentsApiResponse>;
      })
      .then((data) => {
        if (data) {
          setTournaments(data.tournaments ?? []);
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setTournaments([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [searchParams, preferFilter]);

  // 필터가 바뀌면 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams, searchQuery, regionFilter, genderFilter, categoryFilter, divisionFilter, statusTab]);

  // 도시 목록은 더 이상 API에서 추출하지 않음 (17시도 고정 옵션으로 필터에서 관리)

  // 상태 탭별 status 매핑: DB status 값을 3개 그룹으로 분류
  // 모집중: open, published, registration, registration_open, draft 등 모집 가능한 상태
  // 진행중: active, in_progress, ongoing, live 등 경기 진행 중인 상태
  // 완료: completed, ended, closed, cancelled 등 종료된 상태
  const STATUS_TAB_MAP: Record<string, "recruiting" | "active" | "ended"> = {
    draft: "recruiting",
    published: "recruiting",
    registration: "recruiting",
    registration_open: "recruiting",
    registration_closed: "recruiting",
    active: "active",
    in_progress: "active",
    ongoing: "active",
    live: "active",
    completed: "ended",
    ended: "ended",
    closed: "ended",
    cancelled: "ended",
  };

  // 클라이언트 사이드 필터 적용 (상태 탭 + 검색 + 지역 + 성별 + 종별 + 디비전)
  const filteredTournaments = useMemo(() => {
    let result = tournaments;

    // 상태 탭 필터 (모집중 / 진행중 / 완료)
    result = result.filter((t) => {
      const st = t.status ?? "draft";
      const group = STATUS_TAB_MAP[st] ?? "recruiting";
      return group === statusTab;
    });

    // 검색어 필터 (대회명)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }

    // 지역 필터: city 필드에 선택한 시도명이 포함되는지 확인
    // 예: "서울" 선택 시 city가 "서울특별시" 또는 "서울"인 대회 매칭
    if (regionFilter !== "all") {
      result = result.filter((t) => t.city?.includes(regionFilter));
    }

    // 종별 필터: categories JSON에서 해당 종별 key가 true인지 확인
    // 예: categoryFilter="general" → t.categories.general === true
    if (categoryFilter !== "all") {
      result = result.filter((t) => {
        const cats = t.categories ?? {};
        return cats[categoryFilter] === true;
      });
    }

    // 디비전 필터: division_tiers 배열에 선택한 디비전 코드가 포함되는지 확인
    // 예: divisionFilter="D5" → t.division_tiers에 "D5"가 있는지
    if (divisionFilter !== "all") {
      result = result.filter((t) => {
        const tiers = t.division_tiers ?? [];
        return tiers.includes(divisionFilter);
      });
    }

    // 성별 필터: division_tiers의 코드가 W로 끝나는지로 판별
    // 남성부: W 안 붙은 코드가 하나라도 있으면 매칭
    // 여성부: W 붙은 코드가 하나라도 있으면 매칭
    if (genderFilter !== "all") {
      result = result.filter((t) => {
        const tiers = t.division_tiers ?? [];
        if (tiers.length === 0) return true; // 디비전 정보 없으면 필터 통과
        if (genderFilter === "female") {
          return tiers.some((code) => code.endsWith("W"));
        }
        // male: W로 끝나지 않는 코드가 하나라도 있으면
        return tiers.some((code) => !code.endsWith("W"));
      });
    }

    return result;
  }, [tournaments, searchQuery, regionFilter, genderFilter, categoryFilter, divisionFilter, statusTab]);

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / TOURNAMENTS_PER_PAGE));
  const paginatedTournaments = filteredTournaments.slice(
    (currentPage - 1) * TOURNAMENTS_PER_PAGE,
    currentPage * TOURNAMENTS_PER_PAGE
  );

  // 필터 콜백 (지역/성별/종별/디비전)
  const handleSearchChange = useCallback((q: string) => setSearchQuery(q), []);
  const handleRegionChange = useCallback((region: string) => setRegionFilter(region), []);
  const handleGenderChange = useCallback((gender: string) => setGenderFilter(gender), []);
  const handleCategoryChange = useCallback((category: string) => setCategoryFilter(category), []);
  const handleDivisionChange = useCallback((division: string) => setDivisionFilter(division), []);

  // 모든 대회의 장소명을 수집하여 batch API 1번 호출
  const venueQueries = useMemo(() => {
    return tournaments
      .map((t) => t.venue_name ?? t.city ?? "")
      .filter((v) => v.length >= 2);
  }, [tournaments]);

  const { data: photoMap } = useSWR(
    venueQueries.length > 0
      ? `/api/web/place-photos:${JSON.stringify(venueQueries)}`
      : null,
    batchPhotoFetcher,
    { revalidateOnFocus: false, dedupingInterval: 3600000 }
  );

  // 필터 활성 여부 확인 (상태 탭은 항상 선택되므로 검색/지역/성별/종별/디비전만 체크)
  const hasFilters =
    preferFilter ||
    searchQuery.trim() !== "" ||
    regionFilter !== "all" ||
    genderFilter !== "all" ||
    categoryFilter !== "all" ||
    divisionFilter !== "all";

  return (
    <>
      {/* 헤더 영역 - 1행 통합: 제목(좌) + 검색/필터 아이콘(우) */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          {/* 제목 (왼쪽 고정) */}
          <h1
            className="text-2xl font-bold text-[var(--color-text-primary)] shrink-0"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            대회 찾기
          </h1>

          {/* 가운데 여백 */}
          <div className="flex-1" />

          {/* 검색 + 필터 아이콘 (오른쪽 정렬) */}
          <TournamentsFilterComponent
            onSearchChange={handleSearchChange}
            onRegionChange={handleRegionChange}
            onGenderChange={handleGenderChange}
            onCategoryChange={handleCategoryChange}
            onDivisionChange={handleDivisionChange}
            selectedCategory={categoryFilter}
            selectedGender={genderFilter}
          />
        </div>

        {/* 상태별 탭: 모집중 / 진행중 / 완료 (커뮤니티 카테고리 탭과 동일한 밑줄 스타일) */}
        <div
          className="mt-4 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div
            className="flex gap-1 border-b min-w-max"
            style={{ borderColor: "var(--color-border)" }}
          >
            {([
              { key: "recruiting" as const, label: "모집중" },
              { key: "active" as const, label: "진행중" },
              { key: "ended" as const, label: "완료" },
            ]).map((tab) => {
              const isActive = statusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusTab(tab.key)}
                  className="px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors relative"
                  style={{
                    color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {tab.label}
                  {/* 선택된 탭 하단 밑줄 (primary 색상 2px) */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 로딩 중이면 스켈레톤 표시 */}
      {loading ? (
        <TournamentGridSkeleton />
      ) : (
        <>
          {/* 필터 활성 시 결과 카운트 */}
          {hasFilters && (
            <p className="mb-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
              검색 결과{" "}
              <span style={{ color: "var(--color-text-primary)" }}>
                {filteredTournaments.length}개
              </span>
            </p>
          )}

          {/* 대회 카드 그리드 (3열) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTournaments.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                // photoMap undefined = 로딩 중 -> shimmer, 있으면 URL 또는 null
                photoUrl={photoMap === undefined ? undefined : (photoMap[t.venue_name ?? t.city ?? ""] ?? null)}
              />
            ))}

            {/* 빈 상태 */}
            {filteredTournaments.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <span
                  className="material-symbols-outlined text-5xl mb-3 block"
                  style={{ color: "var(--color-text-disabled)" }}
                >
                  emoji_events
                </span>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  {hasFilters ? "조건에 맞는 대회가 없습니다." : "등록된 대회가 없습니다."}
                </p>
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </>
  );
}
