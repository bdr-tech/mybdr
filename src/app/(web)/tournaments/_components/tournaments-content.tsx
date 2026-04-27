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
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferFilter } from "@/contexts/prefer-filter-context";
// 캘린더/주간 뷰 관련 import
import { ViewToggle, type ViewMode } from "./view-toggle";
import { CalendarView } from "./calendar-view";
import { WeekView } from "./week-view";
// Phase 2 Match v2 래퍼 — 리스트 뷰의 카드·탭만 교체. 필터·API는 기존 유지.
import {
  V2TournamentList,
  deriveV2Status,
  type V2MatchTab,
} from "./v2-tournament-list";

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

/* 스켈레톤: 토스 스타일 (기존과 동일) */
function TournamentGridSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-md" />
      ))}
    </div>
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
  // Phase 2 Match: 6상태 탭 — 전체/접수중/마감임박/진행중/접수예정/종료
  // 왜 "접수중"이 기본값인가: 기존 4상태 탭의 기본값도 "접수중"이었음 → UX 연속성 유지.
  const [v2StatusTab, setV2StatusTab] = useState<V2MatchTab>("접수중");
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
  }, [searchParams, searchQuery, regionFilter, genderFilter, categoryFilter, divisionFilter, v2StatusTab]);

  // 필터 적용 — v2 6상태 탭 반영
  // 상태 매핑은 deriveV2Status(v2-tournament-list.tsx) 단일 소스에서 계산 →
  // 카드 배지와 탭 필터가 규칙 불일치 위험 없음.
  const filteredTournaments = useMemo(() => {
    let result = tournaments;

    // v2 6상태 탭 필터 — "전체"는 통과
    if (v2StatusTab !== "전체") {
      result = result.filter((t) => deriveV2Status(t) === v2StatusTab);
    }

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
  }, [tournaments, searchQuery, regionFilter, genderFilter, categoryFilter, divisionFilter, v2StatusTab]);

  // v2 탭별 카운트 — 전체 tournaments 기준 (카테고리/검색 등 다른 필터 무시)
  // 이유: 탭 라벨 옆 숫자는 "어느 상태에 몇 건이 있나"를 보여주는 용도이므로
  //      다른 필터와 결합하면 0건만 보여 탭 의미가 퇴색됨.
  const v2TabCounts = useMemo(() => {
    const counts: Partial<Record<V2MatchTab, number>> = { "전체": tournaments.length };
    for (const t of tournaments) {
      const s = deriveV2Status(t);
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [tournaments]);

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
    <div className="page">
      {/* 헤더: eyebrow + 대형 제목 + 요약 카운트 (시안 Match.jsx L24~31) */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div className="eyebrow">대회 · TOURNAMENTS</div>
          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.015em",
            }}
          >
            열린 대회 · 예정 대회
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            접수중 {v2TabCounts["접수중"] ?? 0} · 마감임박 {v2TabCounts["마감임박"] ?? 0} · 진행중 {v2TabCounts["진행중"] ?? 0} · 예정 {v2TabCounts["접수예정"] ?? 0}
          </div>
        </div>
        {/* 뷰 모드 전환 + 필터: 기존 그대로 유지 */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <ViewToggle current={viewMode} onChange={setViewMode} />
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
      </div>

      {/* 뷰 모드별 콘텐츠 렌더링 */}
      {viewMode === "calendar" ? (
        /* 월간 캘린더 뷰: 자체 API 호출, 필터만 전달 (기능 보존) */
        <CalendarView categoryFilter={categoryFilter} genderFilter={genderFilter} />
      ) : viewMode === "week" ? (
        /* 주간 뷰: 자체 API 호출, 필터만 전달 (기능 보존) */
        <WeekView categoryFilter={categoryFilter} genderFilter={genderFilter} />
      ) : (
        /* 리스트 뷰: V2TournamentList (시안 Match 목록) — 6상태 칩 + 포스터 카드 */
        <>
          {loading ? (
            <TournamentGridSkeleton />
          ) : (
            <>
              {/* 필터 결과 카운트 — 기타 필터 적용 시 안내 */}
              {hasFilters && (
                <p className="mb-4 text-sm" style={{ color: "var(--ink-mute)" }}>
                  검색 결과{" "}
                  <span style={{ fontWeight: 700, color: "var(--ink)" }}>
                    {filteredTournaments.length}개
                  </span>
                </p>
              )}

              {/* v2 목록 래퍼: 6상태 탭 + 포스터 카드 그리드 */}
              <V2TournamentList
                tournaments={paginatedTournaments}
                photoMap={photoMap}
                activeTab={v2StatusTab}
                onTabChange={setV2StatusTab}
                emptyMessage={
                  hasFilters
                    ? "조건에 맞는 대회가 없습니다."
                    : "등록된 대회가 없습니다."
                }
                counts={v2TabCounts}
              />

              {/* 페이지네이션 — 기존 그대로 */}
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
    </div>
  );
}
