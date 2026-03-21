"use client";

import { useState, useEffect } from "react";
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
  divisions: string[];         // 종별 목록 (Phase 2에서 API에 추가됨)
}

interface TournamentsApiResponse {
  tournaments: TournamentFromApi[];
}

// -- 상태별 스타일 매핑 (GameCard의 TYPE_BADGE 패턴과 동일한 color+bg 구조) --
const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  draft:               { color: "#FFFFFF", bg: "#6B7280" },
  active:              { color: "#FFFFFF", bg: "#16A34A" },
  published:           { color: "#FFFFFF", bg: "#16A34A" },
  registration:        { color: "#FFFFFF", bg: "#16A34A" },
  registration_open:   { color: "#FFFFFF", bg: "#16A34A" },
  registration_closed: { color: "#FFFFFF", bg: "#D97706" },
  in_progress:         { color: "#FFFFFF", bg: "#2563EB" },
  ongoing:             { color: "#FFFFFF", bg: "#2563EB" },
  completed:           { color: "#FFFFFF", bg: "#6B7280" },
  cancelled:           { color: "#FFFFFF", bg: "#EF4444" },
};

// -- 대회 형식 한글 라벨 매핑 --
const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  hybrid: "혼합",
};

// -- 날짜 범위 포맷 (ISO string -> 한국어 날짜) --
function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "";
  const startStr = new Date(start).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  if (!end) return startStr;
  const endStr = new Date(end).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  return `${startStr} ~ ${endStr}`;
}

// -- 스켈레톤 UI (GameCard 스켈레톤 패턴과 동일) --
function TournamentGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-[16px] bg-white border border-[#E8ECF0] overflow-hidden">
          {/* 상단 컬러바 자리 */}
          <div className="h-1 bg-[#E8ECF0]" />
          <div className="p-3.5 space-y-2.5">
            <Skeleton className="h-4 w-14 rounded-[6px]" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// -- 대회 카드 (GameCard와 동일한 레이아웃으로 리디자인) --
function TournamentCard({ tournament: t }: { tournament: TournamentFromApi }) {
  const st = t.status ?? "draft";
  const label = TOURNAMENT_STATUS_LABEL[st] ?? st;
  const style = STATUS_STYLE[st] ?? { color: "#FFFFFF", bg: "#6B7280" };
  const formatLabel = FORMAT_LABEL[t.format ?? ""] ?? t.format ?? "";
  const dateRange = formatDateRange(t.start_date, t.end_date);
  const maxTeams = t.max_teams ?? 16;
  const location = [t.city, t.venue_name].filter(Boolean).join(" ");
  const hasFee = t.entry_fee && Number(t.entry_fee) > 0;

  // 참가팀 프로그레스바 계산 (GameCard 인라인 패턴)
  const pct = maxTeams > 0 ? Math.min((t.team_count / maxTeams) * 100, 100) : 0;
  const barColor = pct >= 100 ? "#EF4444" : pct >= 80 ? "#D97706" : "#1B3C87";

  // 종별(divisions) 표시: 최대 2개 + 나머지는 "+N"으로 축약
  const divisions = t.divisions ?? [];
  const visibleDivs = divisions.slice(0, 2);
  const extraCount = divisions.length - 2;

  return (
    <Link href={`/tournaments/${t.id}`} prefetch={true}>
      <div className="group flex h-full flex-col rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#1B3C87]/30">
        {/* 상단 컬러 바 - 상태에 따라 색상 변경 */}
        <div className="h-1" style={{ backgroundColor: style.bg }} />

        <div className="flex flex-1 flex-col p-3.5">
          {/* Row 1: 형식 뱃지 + 상태 텍스트 (GameCard 패턴) */}
          <div className="mb-2 flex items-center justify-between">
            <span
              className="rounded-[6px] px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: style.bg, color: style.color }}
            >
              {formatLabel}
            </span>
            <span className="text-[11px] font-bold" style={{ color: style.bg }}>
              {label}
            </span>
          </div>

          {/* Row 2: 대회명 (text-sm, line-clamp-1로 GameCard와 통일) */}
          <h3 className="mb-1 text-sm font-bold text-[#111827] line-clamp-1 leading-tight group-hover:text-[#1B3C87] transition-colors">
            {t.name}
          </h3>

          {/* Row 3: 날짜 -> 장소 순서 (GameCard와 동일한 순서) */}
          <div className="mb-2 space-y-0.5">
            {dateRange && (
              <p className="flex items-center gap-1 text-xs text-[#6B7280]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <span>{dateRange}</span>
              </p>
            )}
            {location && (
              <p className="flex items-center gap-1 text-xs text-[#6B7280]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="line-clamp-1">{location}</span>
              </p>
            )}
          </div>

          {/* Row 4: 참가팀 프로그레스바 (인라인, GameCard 스타일) */}
          {maxTeams > 0 && (
            <div className="mb-2 flex items-center gap-2">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8ECF0]">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: barColor }}>
                {t.team_count}/{maxTeams}
              </span>
            </div>
          )}

          {/* Row 5: 참가비 + 종별(divisions) 칩 */}
          <div className="mt-auto flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-[#111827]">
              {hasFee
                ? `\u20A9${Number(t.entry_fee).toLocaleString()}`
                : <span className="text-[#9CA3AF]">무료</span>}
            </span>
            {/* 종별 칩: 최대 2개 표시 + 나머지 "+N" */}
            {visibleDivs.length > 0 && (
              <div className="flex items-center gap-1">
                {visibleDivs.map((div) => (
                  <span
                    key={div}
                    className="rounded-[6px] bg-[#F3F4F6] px-1.5 py-0.5 text-[11px] font-medium text-[#6B7280]"
                  >
                    {div}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="text-[11px] font-medium text-[#9CA3AF]">
                    +{extraCount}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * TournamentsContent - 대회 목록 클라이언트 컴포넌트
 *
 * URL의 searchParams가 바뀔 때마다 /api/web/tournaments를 호출하여
 * 대회 목록을 가져온다.
 *
 * [변경 이유]
 * 서버 컴포넌트에서 원격 DB를 직접 호출하면 렌더링이 DB 응답을 기다리느라
 * 무한 로딩 상태에 빠지는 문제가 있었음. 클라이언트 컴포넌트 + API route 패턴으로
 * 전환하여 페이지는 즉시 렌더링되고, 데이터는 비동기로 로드됨.
 */
export function TournamentsContent({
  TournamentsFilterComponent,
}: {
  // TournamentsFilter 컴포넌트를 외부에서 주입받음
  TournamentsFilterComponent: React.ComponentType;
}) {
  const searchParams = useSearchParams();

  const [tournaments, setTournaments] = useState<TournamentFromApi[]>([]);
  const [loading, setLoading] = useState(true);

  // 전역 선호 필터 Context에서 상태를 읽어옴 (헤더 버튼으로 ON/OFF 전환)
  const { preferFilter } = usePreferFilter();

  // searchParams 또는 preferFilter가 바뀔 때마다 API 호출
  useEffect(() => {
    // race condition 방지: 이전 요청이 완료되기 전에 새 요청이 발생하면 이전 요청을 취소
    const controller = new AbortController();
    setLoading(true);

    // URL의 쿼리 파라미터를 기반으로 API 호출 URL 구성
    const params = new URLSearchParams(searchParams.toString());
    // Context에서 preferFilter가 true이면 API에 prefer=true 추가
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
        // 사용자가 필터를 빠르게 바꿔서 이전 요청이 취소된 경우 무시
        if (error instanceof Error && error.name === 'AbortError') return;
        setTournaments([]);
      })
      .finally(() => setLoading(false));

    // cleanup: 의존성이 바뀌면 진행 중인 fetch를 취소
    return () => controller.abort();
  }, [searchParams, preferFilter]);

  // 필터가 활성화되어 있는지 확인
  const status = searchParams.get("status");
  const hasFilters = (status && status !== "all") || preferFilter;

  return (
    <>
      {/* 헤더 영역 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>TOURNAMENTS</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/tournament-admin/tournaments/new/wizard"
            prefetch={true}
            className="rounded-[10px] bg-[#E31B23] px-5 py-2 text-sm font-bold text-white hover:bg-[#C8101E] transition-colors"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            대회 만들기
          </Link>
        </div>
      </div>

      {/* 상태 탭 필터 */}
      <TournamentsFilterComponent />

      {/* 로딩 중이면 스켈레톤 표시 */}
      {loading ? (
        <TournamentGridSkeleton />
      ) : (
        <>
          {/* 필터 활성 시 결과 카운트 */}
          {hasFilters && (
            <p className="mb-4 text-sm text-[#9CA3AF]">
              검색 결과 <span className="text-[#111827]">{tournaments.length}개</span>
            </p>
          )}

          {/* 대회 카드 그리드 (GameCard와 동일: 2열 기본, 대형 3열) */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}

            {/* 빈 상태 */}
            {tournaments.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="mb-3 text-4xl">&#127942;</div>
                <p className="text-[#6B7280]">
                  {hasFilters ? "조건에 맞는 대회가 없습니다." : "등록된 대회가 없습니다."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
