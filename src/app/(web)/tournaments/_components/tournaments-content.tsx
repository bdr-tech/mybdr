"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";
import { usePreferFilter } from "@/contexts/prefer-filter-context";

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
  draft:               { label: "DRAFT", bg: "var(--color-text-disabled)" },
  active:              { label: "ACTIVE", bg: "var(--color-primary)" },
  published:           { label: "OPEN", bg: "var(--color-primary)" },
  registration:        { label: "OPENING SOON", bg: "var(--color-primary)" },
  registration_open:   { label: "OPENING SOON", bg: "var(--color-primary)" },
  registration_closed: { label: "CLOSED", bg: "#D97706" },
  in_progress:         { label: "LIVE", bg: "var(--color-info)" },
  ongoing:             { label: "LIVE", bg: "var(--color-info)" },
  completed:           { label: "ENDED", bg: "var(--color-text-disabled)" },
  cancelled:           { label: "CANCELLED", bg: "#EF4444" },
};

// -- 대회 형식 한글 라벨 매핑 --
const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  hybrid: "혼합",
};

// -- 날짜 포맷 (시안의 "2024.12.15 (Sun)" 형식) --
function formatDate(isoStr: string | null): string {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} (${days[d.getDay()]})`;
}

// -- 대회 이름 기반 그라디언트 색상 생성 (이미지 대체용) --
function getGradient(name: string): string {
  // 이름의 해시값으로 색상 결정 (일관된 결과를 위해)
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    "linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #2c3e50 100%)",
    "linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 50%, #4a2020 100%)",
    "linear-gradient(135deg, #0a192f 0%, #172a45 50%, #203a5c 100%)",
    "linear-gradient(135deg, #1c1c2e 0%, #2a1f3d 50%, #3d2b5a 100%)",
    "linear-gradient(135deg, #1a2332 0%, #1e3a4a 50%, #1e5162 100%)",
  ];
  return gradients[Math.abs(hash) % gradients.length];
}

// -- 스켈레톤 UI: 새 디자인에 맞춘 카드형 스켈레톤 --
function TournamentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded overflow-hidden"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* 이미지 배너 스켈레톤 */}
          <Skeleton className="h-48 w-full" />
          <div className="p-6 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// -- 대회 카드: 시안의 이미지 배너 + 정보 + 프로그레스 + JOIN 버튼 --
function TournamentCard({ tournament: t }: { tournament: TournamentFromApi }) {
  const st = t.status ?? "draft";
  const badge = STATUS_BADGE[st] ?? { label: st.toUpperCase(), bg: "var(--color-text-disabled)" };
  const maxTeams = t.max_teams ?? 16;
  const location = [t.city, t.venue_name].filter(Boolean).join(" ");
  const hasFee = t.entry_fee && Number(t.entry_fee) > 0;
  const feeText = hasFee ? `\u20A9${Number(t.entry_fee).toLocaleString()}` : "FREE";

  // 참가팀 프로그레스바 계산
  const pct = maxTeams > 0 ? Math.min((t.team_count / maxTeams) * 100, 100) : 0;

  return (
    <Link href={`/tournaments/${t.id}`} prefetch={true}>
      {/* 카드 컨테이너: 호버 시 그림자 강화 */}
      <div
        className="group flex flex-col rounded overflow-hidden transition-all duration-300 h-full"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* 상단 이미지 배너: DB에 이미지가 없으므로 그라디언트 배경 + 대회 이니셜 */}
        <div
          className="relative h-48 overflow-hidden flex items-center justify-center"
          style={{ background: getGradient(t.name) }}
        >
          {/* 대회명 이니셜 (배경 장식) */}
          <span
            className="text-6xl font-bold opacity-20 select-none"
            style={{ fontFamily: "var(--font-heading)", color: "white" }}
          >
            {t.name.charAt(0)}
          </span>
          {/* 스포츠 아이콘 오버레이 */}
          <span
            className="material-symbols-outlined absolute bottom-4 right-4 text-4xl opacity-10"
            style={{ color: "white" }}
          >
            emoji_events
          </span>
          {/* 상태 배지 */}
          <div
            className="absolute top-4 left-4 text-white text-[10px] font-bold px-2 py-1 rounded tracking-wider"
            style={{ backgroundColor: badge.bg }}
          >
            {badge.label}
          </div>
          {/* 형식 배지 (우측 상단) */}
          {t.format && (
            <div
              className="absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded tracking-wider"
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(4px)",
                color: "white",
              }}
            >
              {FORMAT_LABEL[t.format] ?? t.format}
            </div>
          )}
        </div>

        {/* 카드 본문 */}
        <div className="p-6 flex-1 flex flex-col">
          {/* 대회명 + 참가비 */}
          <div className="flex justify-between items-start mb-3">
            <h3
              className="font-semibold text-lg line-clamp-1 leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {t.name}
            </h3>
            <span
              className="font-bold text-sm shrink-0 ml-2"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-primary)",
              }}
            >
              {feeText}
            </span>
          </div>

          {/* 날짜 + 장소 정보 */}
          <div className="space-y-2 mb-6">
            {t.start_date && (
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span className="material-symbols-outlined text-base">calendar_today</span>
                {formatDate(t.start_date)}
              </div>
            )}
            {location && (
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span className="material-symbols-outlined text-base">location_on</span>
                <span className="line-clamp-1">{location}</span>
              </div>
            )}
          </div>

          {/* 하단 영역: 프로그레스바 + JOIN 버튼 */}
          <div className="mt-auto">
            {/* Recruitment 프로그레스 */}
            {maxTeams > 0 && (
              <>
                <div className="flex justify-between items-end mb-2">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Recruitment: {Math.round(pct)}%
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {t.team_count}/{maxTeams} Teams
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full mb-6 overflow-hidden"
                  style={{ backgroundColor: "var(--color-border)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: "var(--color-primary)",
                    }}
                  />
                </div>
              </>
            )}

            {/* JOIN TOURNAMENT 버튼 */}
            <button
              className="w-full font-bold py-3 rounded text-sm uppercase tracking-tight transition-colors text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Join Tournament
            </button>
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
      {/* 헤더 + 필터: 시안의 2행 레이아웃 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        {/* 좌측: 제목 + 부제 */}
        <div>
          <span
            className="font-bold text-sm tracking-widest uppercase mb-2 block"
            style={{ color: "var(--color-primary)" }}
          >
            Premium League
          </span>
          <h1
            className="text-4xl sm:text-5xl font-bold leading-tight"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-text-primary)",
            }}
          >
            TOURNAMENT DIRECTORY
          </h1>
        </div>

        {/* 우측: 필터 드롭다운들 */}
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
              <TournamentCard key={t.id} tournament={t} />
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
