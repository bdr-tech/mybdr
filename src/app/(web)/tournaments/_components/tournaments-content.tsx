"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";
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
}

interface TournamentsApiResponse {
  tournaments: TournamentFromApi[];
}

// -- 페이지당 대회 수: 3x3 그리드 = 9개 --
const TOURNAMENTS_PER_PAGE = 9;

// -- 상태별 배지 색상 (상단 이미지 배너에 표시) --
const STATUS_BADGE: Record<string, { label: string; bg: string }> = {
  draft:               { label: "준비중", bg: "var(--color-text-disabled)" },
  active:              { label: "진행중", bg: "var(--color-primary)" },
  published:           { label: "모집중", bg: "var(--color-primary)" },
  registration:        { label: "곧 모집", bg: "var(--color-primary)" },
  registration_open:   { label: "곧 모집", bg: "var(--color-primary)" },
  registration_closed: { label: "마감", bg: "#D97706" },
  in_progress:         { label: "라이브", bg: "var(--color-info)" },
  ongoing:             { label: "라이브", bg: "var(--color-info)" },
  completed:           { label: "종료", bg: "var(--color-text-disabled)" },
  cancelled:           { label: "취소됨", bg: "#EF4444" },
};

// -- 대회 형식 한글 라벨 매핑 --
const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  hybrid: "혼합",
};

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
  const badge = STATUS_BADGE[st] ?? { label: st.toUpperCase(), bg: "var(--color-text-disabled)" };
  const maxTeams = t.max_teams ?? 0;
  const location = t.venue_name ?? t.city ?? "";
  const hasFee = t.entry_fee && Number(t.entry_fee) > 0;
  const feeText = hasFee ? `\u20A9${Number(t.entry_fee).toLocaleString()}` : "무료";
  const isFull = maxTeams > 0 && t.team_count >= maxTeams;

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
            style={{ backgroundColor: badge.bg }}
          >
            {badge.label}
          </span>

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
  TournamentsFilterComponent: React.ComponentType<{
    cities: string[];
    onSearchChange: (query: string) => void;
    onRegionChange: (city: string) => void;
    onFeeChange: (fee: string) => void;
  }>;
}) {
  const searchParams = useSearchParams();

  const [tournaments, setTournaments] = useState<TournamentFromApi[]>([]);
  const [loading, setLoading] = useState(true);

  // 클라이언트 사이드 필터 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [feeFilter, setFeeFilter] = useState("all");

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
  }, [searchParams, searchQuery, regionFilter, feeFilter]);

  // API 응답에서 도시 목록 추출 (지역 필터 드롭다운용)
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    tournaments.forEach((t) => {
      if (t.city) citySet.add(t.city);
    });
    return Array.from(citySet).sort();
  }, [tournaments]);

  // 클라이언트 사이드 필터 적용 (검색 + 지역 + 참가비)
  const filteredTournaments = useMemo(() => {
    let result = tournaments;

    // 검색어 필터 (대회명)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }

    // 지역 필터
    if (regionFilter !== "all") {
      result = result.filter((t) => t.city === regionFilter);
    }

    // 참가비 필터
    if (feeFilter === "free") {
      result = result.filter((t) => !t.entry_fee || Number(t.entry_fee) === 0);
    } else if (feeFilter === "paid") {
      result = result.filter((t) => t.entry_fee && Number(t.entry_fee) > 0);
    }

    return result;
  }, [tournaments, searchQuery, regionFilter, feeFilter]);

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / TOURNAMENTS_PER_PAGE));
  const paginatedTournaments = filteredTournaments.slice(
    (currentPage - 1) * TOURNAMENTS_PER_PAGE,
    currentPage * TOURNAMENTS_PER_PAGE
  );

  // 필터 콜백
  const handleSearchChange = useCallback((q: string) => setSearchQuery(q), []);
  const handleRegionChange = useCallback((city: string) => setRegionFilter(city), []);
  const handleFeeChange = useCallback((fee: string) => setFeeFilter(fee), []);

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

  // 필터 활성 여부 확인
  const status = searchParams.get("status");
  const hasFilters =
    (status && status !== "all") ||
    preferFilter ||
    searchQuery.trim() !== "" ||
    regionFilter !== "all" ||
    feeFilter !== "all";

  return (
    <>
      {/* 헤더: 제목 + 필터 */}
      <div className="mb-10 space-y-4">
        <div className="flex items-center justify-between">
          {/* 좌측: 제목 + 부제 */}
          <div>
            <span
              className="font-bold text-sm tracking-widest uppercase mb-2 block"
              style={{ color: "var(--color-primary)" }}
            >
              프리미엄 리그
            </span>
            <h1
              className="text-4xl sm:text-5xl font-bold leading-tight"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-text-primary)",
              }}
            >
              대회 찾기
            </h1>
          </div>
        </div>

        {/* 검색 + 플로팅 필터 트리거 */}
        <TournamentsFilterComponent
          cities={cities}
          onSearchChange={handleSearchChange}
          onRegionChange={handleRegionChange}
          onFeeChange={handleFeeChange}
        />
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
