"use client";

/* ============================================================
 * TournamentsContent — 대회 목록 (토스 스타일)
 *
 * 토스 스타일 변경:
 * - 3열 그리드 → TossCard 스타일 세로 리스트
 * - 상태 탭 유지 (모집중/진행중/완료)
 * - 카드: 둥근 모서리(16px) + 가벼운 그림자 + 가로 레이아웃
 *
 * API/데이터 패칭 로직은 기존과 100% 동일하게 유지.
 * ============================================================ */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";
import { CATEGORIES } from "@/lib/constants/divisions";
import { usePreferFilter } from "@/contexts/prefer-filter-context";
import { formatShortDate } from "@/lib/utils/format-date";
// 캘린더/주간 뷰 관련 import
import { ViewToggle, type ViewMode } from "./view-toggle";
import { CalendarView } from "./calendar-view";
import { WeekView } from "./week-view";

// batch API fetcher (기존과 동일)
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

// API 타입 (기존과 동일)
interface TournamentFromApi {
  id: string;
  name: string;
  format: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  entry_fee: string | null;
  city: string | null;
  venue_name: string | null;
  max_teams: number | null;
  team_count: number;
  divisions: string[];
  categories: Record<string, boolean>;
  division_tiers: string[];
}

interface TournamentsApiResponse {
  tournaments: TournamentFromApi[];
}

const TOURNAMENTS_PER_PAGE = 10;

// 상태 배지 배경색 (기존과 동일)
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

// 대회 유형별 그라디언트+아이콘 (기존과 동일)
const FORMAT_GRADIENT: Record<string, { gradient: string; icon: string }> = {
  single_elimination: { gradient: "linear-gradient(135deg, #7f1d1d, #dc2626, #b91c1c)", icon: "emoji_events" },
  double_elimination: { gradient: "linear-gradient(135deg, #7f1d1d, #dc2626, #b91c1c)", icon: "emoji_events" },
  round_robin: { gradient: "linear-gradient(135deg, #1e3a5f, #1d4ed8, #312e81)", icon: "leaderboard" },
  hybrid: { gradient: "linear-gradient(135deg, #312e81, #6d28d9, #4338ca)", icon: "hub" },
};

const DEFAULT_FORMAT_STYLE = {
  gradient: "linear-gradient(135deg, #7f1d1d, #dc2626, #b91c1c)",
  icon: "emoji_events",
};

/* 스켈레톤: 토스 스타일 */
function TournamentGridSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-md" />
      ))}
    </div>
  );
}

/* ---- 대회 카드: 토스 스타일 (가로 레이아웃) ---- */
function TournamentCard({ tournament: t, photoUrl }: { tournament: TournamentFromApi; photoUrl?: string | null }) {
  const st = t.status ?? "draft";
  const badgeLabel = TOURNAMENT_STATUS_LABEL[st] ?? st.toUpperCase();
  const badgeBg = STATUS_BG[st] ?? "var(--color-text-disabled)";
  const maxTeams = t.max_teams ?? 0;
  const location = t.venue_name ?? t.city ?? "";
  const hasFee = t.entry_fee && Number(t.entry_fee) > 0;
  const feeText = hasFee ? `${Number(t.entry_fee).toLocaleString()}원` : "무료";
  const isFull = maxTeams > 0 && t.team_count >= maxTeams;

  // 종별 라벨
  const categoryLabels = Object.entries(t.categories ?? {})
    .filter(([, v]) => v === true)
    .map(([key]) => CATEGORIES[key as keyof typeof CATEGORIES]?.label ?? key)
    .filter(Boolean);

  // 디비전
  const divisionTiers = (t.division_tiers ?? []).filter(Boolean);

  const formatStyle = FORMAT_GRADIENT[t.format ?? ""] ?? DEFAULT_FORMAT_STYLE;

  return (
    <Link href={`/tournaments/${t.id}`} prefetch={true}>
      {/* 토스 카드: 둥근 모서리 + 가벼운 그림자 + 가로 배치 */}
      <div
        className={`group flex gap-3.5 rounded-md p-3.5 bg-[var(--color-card)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[var(--shadow-elevated)] ${isFull ? "opacity-60" : ""}`}
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* 좌: 이미지/아이콘 (정사각형 80px) */}
        <div
          className={`relative w-20 h-20 shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-cover bg-center ${photoUrl === undefined ? "animate-pulse bg-[var(--color-surface)]" : ""}`}
          style={photoUrl
            ? { backgroundImage: `url(${photoUrl})` }
            : photoUrl === null ? { background: formatStyle.gradient } : undefined
          }
        >
          {photoUrl === null && (
            <span className="material-symbols-outlined text-3xl text-white/30">{formatStyle.icon}</span>
          )}
          {/* 상태 뱃지 (좌상단) */}
          <span
            className="absolute top-1 left-1 rounded px-1 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: badgeBg }}
          >
            {badgeLabel}
          </span>
        </div>

        {/* 우: 정보 영역 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          {/* 상단: 대회명 + 종별/디비전 뱃지 */}
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1 mb-0.5">
              {t.name}
            </h3>
            {/* 종별 + 디비전 뱃지 */}
            {(categoryLabels.length > 0 || divisionTiers.length > 0) && (
              <div className="flex items-center gap-1 mb-1">
                {categoryLabels.map((label) => (
                  <span key={label} className="rounded bg-[var(--color-primary-weak)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                    {label}
                  </span>
                ))}
                {divisionTiers.length > 0 && (
                  <span className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                    {divisionTiers.join("·")}
                  </span>
                )}
              </div>
            )}
            {/* 장소 + 날짜 */}
            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              {location && (
                <span className="flex items-center gap-0.5 truncate">
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  {location}
                </span>
              )}
              {t.start_date && (
                <span className="flex items-center gap-0.5 shrink-0">
                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                  {formatShortDate(t.start_date)}
                </span>
              )}
            </div>
          </div>

          {/* 하단: 참가비 + 팀수 + 참여 버튼 */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[var(--color-text-primary)]">{feeText}</span>
              {maxTeams > 0 && (
                <span className="text-[var(--color-text-muted)]">{t.team_count}/{maxTeams}팀</span>
              )}
            </div>
            {isFull ? (
              <span className="text-xs font-bold text-[var(--color-text-disabled)] bg-[var(--color-surface)] px-3 py-1 rounded-lg">마감</span>
            ) : (
              <span className="text-xs font-bold text-white bg-[var(--color-primary)] px-3 py-1 rounded-lg">참여</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* 페이지네이션 (기존과 동일하되 토스 스타일로) */
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

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 flex items-center justify-center rounded-md transition-colors disabled:opacity-30 bg-[var(--color-surface)] text-[var(--color-text-muted)]"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      {pages.map((page, idx) =>
        page === "..." ? (
          <span key={`dots-${idx}`} className="px-2 text-[var(--color-text-disabled)]">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-md font-bold text-sm transition-colors ${
              page === currentPage
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-md transition-colors disabled:opacity-30 bg-[var(--color-surface)] text-[var(--color-text-muted)]"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}

/**
 * TournamentsContent - 대회 목록 (토스 스타일)
 * API 로직 100% 유지. UI만 토스 스타일로 교체.
 */
export function TournamentsContent({
  TournamentsFilterComponent,
}: {
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

  // 뷰 모드: 리스트 / 월간 캘린더 / 주간 (기본값: 리스트)
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // 필터 상태 (기존과 동일)
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  // 상태 탭 4종: 준비중/접수중/진행중/종료
  const [statusTab, setStatusTab] = useState<"draft" | "registration" | "in_progress" | "completed">("registration");
  const [currentPage, setCurrentPage] = useState(1);
  const { preferFilter } = usePreferFilter();

  // API 호출 (기존 로직 100% 유지)
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
        if (data) setTournaments(data.tournaments ?? []);
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setTournaments([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [searchParams, preferFilter]);

  // 필터 변경 시 1페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams, searchQuery, regionFilter, genderFilter, categoryFilter, divisionFilter, statusTab]);

  // 상태 탭 매핑 — DB의 다양한 status 값을 4종 탭으로 분류
  const STATUS_TAB_MAP: Record<string, "draft" | "registration" | "in_progress" | "completed"> = {
    draft: "draft", upcoming: "draft",
    registration: "registration", registration_open: "registration", active: "registration",
    published: "registration", open: "registration", opening_soon: "registration", registration_closed: "registration",
    in_progress: "in_progress", live: "in_progress", ongoing: "in_progress", group_stage: "in_progress",
    completed: "completed", ended: "completed", closed: "completed", cancelled: "completed",
  };

  // 필터 적용 (기존 로직 100% 유지)
  const filteredTournaments = useMemo(() => {
    let result = tournaments;

    result = result.filter((t) => {
      const st = t.status ?? "draft";
      return (STATUS_TAB_MAP[st] ?? "draft") === statusTab;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }
    if (regionFilter !== "all") {
      result = result.filter((t) => t.city?.includes(regionFilter));
    }
    if (categoryFilter !== "all") {
      result = result.filter((t) => (t.categories ?? {})[categoryFilter] === true);
    }
    if (divisionFilter !== "all") {
      result = result.filter((t) => (t.division_tiers ?? []).includes(divisionFilter));
    }
    if (genderFilter !== "all") {
      result = result.filter((t) => {
        const tiers = t.division_tiers ?? [];
        if (tiers.length === 0) return true;
        if (genderFilter === "female") return tiers.some((code) => code.endsWith("W"));
        return tiers.some((code) => !code.endsWith("W"));
      });
    }

    return result;
  }, [tournaments, searchQuery, regionFilter, genderFilter, categoryFilter, divisionFilter, statusTab]);

  const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / TOURNAMENTS_PER_PAGE));
  const paginatedTournaments = filteredTournaments.slice(
    (currentPage - 1) * TOURNAMENTS_PER_PAGE,
    currentPage * TOURNAMENTS_PER_PAGE
  );

  const handleSearchChange = useCallback((q: string) => setSearchQuery(q), []);
  const handleRegionChange = useCallback((region: string) => setRegionFilter(region), []);
  const handleGenderChange = useCallback((gender: string) => setGenderFilter(gender), []);
  const handleCategoryChange = useCallback((category: string) => setCategoryFilter(category), []);
  const handleDivisionChange = useCallback((division: string) => setDivisionFilter(division), []);

  // batch 사진 API (기존과 동일)
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

  const hasFilters =
    preferFilter ||
    searchQuery.trim() !== "" ||
    regionFilter !== "all" ||
    genderFilter !== "all" ||
    categoryFilter !== "all" ||
    divisionFilter !== "all";

  return (
    <>
      {/* 헤더: 제목 + 필터 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] shrink-0">
            대회 찾기
          </h1>
          {/* 뷰 모드 전환: 리스트/월간/주간 */}
          <ViewToggle current={viewMode} onChange={setViewMode} />
          <div className="flex-1" />
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

        {/* 상태 탭: 리스트 뷰에서만 표시 */}
        {viewMode === "list" && (
          <div className="mt-4 flex gap-1 border-b border-[var(--color-border)]">
            {([
              { key: "draft" as const, label: "준비중" },
              { key: "registration" as const, label: "접수중" },
              { key: "in_progress" as const, label: "진행중" },
              { key: "completed" as const, label: "종료" },
            ]).map((tab) => {
              const isActive = statusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusTab(tab.key)}
                  className="relative px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {tab.label}
                  {/* 토스 스타일 밑줄: primary 대신 진한 텍스트 색상 */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ backgroundColor: "var(--color-text-primary)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 뷰 모드별 콘텐츠 렌더링 */}
      {viewMode === "calendar" ? (
        /* 월간 캘린더 뷰: 자체 API 호출, 필터만 전달 */
        <CalendarView categoryFilter={categoryFilter} genderFilter={genderFilter} />
      ) : viewMode === "week" ? (
        /* 주간 뷰: 자체 API 호출, 필터만 전달 */
        <WeekView categoryFilter={categoryFilter} genderFilter={genderFilter} />
      ) : (
        /* 기존 리스트 뷰: 아래 코드는 기존과 100% 동일 */
        <>
          {/* 로딩 */}
          {loading ? (
            <TournamentGridSkeleton />
          ) : (
            <>
              {/* 필터 결과 카운트 */}
              {hasFilters && (
                <p className="mb-4 text-sm text-[var(--color-text-muted)]">
                  검색 결과{" "}
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {filteredTournaments.length}개
                  </span>
                </p>
              )}

              {/* 대회 리스트: 토스 스타일 세로 스택 */}
              <div className="space-y-6">
                {paginatedTournaments.map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                    photoUrl={photoMap === undefined ? undefined : (photoMap[t.venue_name ?? t.city ?? ""] ?? null)}
                  />
                ))}

                {/* 빈 상태 + CTA */}
                {filteredTournaments.length === 0 && (
                  <div className="py-20 text-center">
                    <span className="material-symbols-outlined text-5xl text-[var(--color-text-disabled)] mb-3 block">
                      emoji_events
                    </span>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4">
                      {hasFilters ? "조건에 맞는 대회가 없습니다." : "등록된 대회가 없습니다."}
                    </p>
                    {/* 빈 상태 액션 버튼: 다른 탭 둘러보기 안내 */}
                    <Link
                      href="/tournaments"
                      className="inline-flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.97]"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      <span className="material-symbols-outlined text-base">search</span>
                      대회 찾아보기
                    </Link>
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
      )}
    </>
  );
}
