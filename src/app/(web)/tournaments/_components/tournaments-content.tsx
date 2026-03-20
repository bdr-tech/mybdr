"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";

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
}

interface TournamentsApiResponse {
  tournaments: TournamentFromApi[];
}

// -- 상태별 스타일 매핑 --
const STATUS_STYLE: Record<string, { variant: "success" | "default" | "error" | "warning" | "info"; accent: string }> = {
  draft:               { variant: "default",  accent: "#6B7280" },
  active:              { variant: "success",  accent: "#4ADE80" },
  published:           { variant: "success",  accent: "#4ADE80" },
  registration:        { variant: "success",  accent: "#4ADE80" },
  registration_open:   { variant: "success",  accent: "#4ADE80" },
  registration_closed: { variant: "warning",  accent: "#FBBF24" },
  in_progress:         { variant: "info",     accent: "#60A5FA" },
  ongoing:             { variant: "info",     accent: "#60A5FA" },
  completed:           { variant: "default",  accent: "#6B7280" },
  cancelled:           { variant: "error",    accent: "#EF4444" },
};

// -- 대회 형식 한글 라벨 매핑 --
const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  hybrid: "혼합",
};

// -- 참가팀 현황 프로그레스 바 --
function TeamCountBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const color = pct >= 100 ? "#E31B23" : pct >= 75 ? "#D97706" : "#1B3C87";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8ECF0]">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="flex-shrink-0 text-xs text-[#6B7280]">
        {current}/{max}팀
      </span>
    </div>
  );
}

// -- 날짜 범위 포맷 (ISO string -> 한국어 날짜) --
function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "";
  const startStr = new Date(start).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  if (!end) return startStr;
  const endStr = new Date(end).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  return `${startStr} ~ ${endStr}`;
}

// -- 스켈레톤 UI (로딩 중 표시) --
function TournamentGridSkeleton() {
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-[16px] border-l-[3px] border-[#E8ECF0] bg-white p-5 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

// -- 대회 카드 (API 응답 타입에 맞춤) --
function TournamentCard({ tournament: t }: { tournament: TournamentFromApi }) {
  const st = t.status ?? "draft";
  const label = TOURNAMENT_STATUS_LABEL[st] ?? st;
  const style = STATUS_STYLE[st] ?? { variant: "default" as const, accent: "#6B7280" };
  const formatLabel = FORMAT_LABEL[t.format ?? ""] ?? t.format ?? "";
  const dateRange = formatDateRange(t.start_date, t.end_date);
  const maxTeams = t.max_teams ?? 16;
  const location = [t.city, t.venue_name].filter(Boolean).join(" ");
  const hasFee = t.entry_fee && Number(t.entry_fee) > 0;

  return (
    <Link href={`/tournaments/${t.id}`} prefetch={true}>
      <div className="group overflow-hidden rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#1B3C87]/30">
        {/* 상단 컬러 바 - 상태에 따라 색상 변경 */}
        <div className="h-1" style={{ backgroundColor: style.accent }} />

        <div className="p-4 sm:p-5">
          {/* 형식 + 상태 */}
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-[6px] bg-[#111827] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              {formatLabel}
            </span>
            <Badge variant={style.variant}>{label}</Badge>
          </div>

          {/* 대회명 */}
          <h3 className="mb-3 text-[15px] font-bold leading-snug text-[#111827] line-clamp-2 group-hover:text-[#1B3C87] transition-colors">
            {t.name}
          </h3>

          {/* 장소 + 날짜 */}
          <div className="mb-3 space-y-1">
            {location && (
              <p className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="truncate">{location}</span>
              </p>
            )}
            {dateRange && (
              <p className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <span>{dateRange}</span>
              </p>
            )}
          </div>

          {/* 구분선 */}
          <div className="mb-3 h-px bg-[#E8ECF0]" />

          {/* 참가팀 현황 바 */}
          <TeamCountBar current={t.team_count} max={maxTeams} />

          {/* 참가비 */}
          <div className="mt-2 text-xs font-semibold text-[#111827]">
            {hasFee
              ? `\u20A9${Number(t.entry_fee).toLocaleString()}`
              : <span className="text-[#9CA3AF]">무료</span>}
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
  const router = useRouter();
  const pathname = usePathname();

  const [tournaments, setTournaments] = useState<TournamentFromApi[]>([]);
  const [loading, setLoading] = useState(true);

  // "내 선호 지역만 보기" 토글 상태 -- URL의 prefer 파라미터와 동기화
  const preferOn = searchParams.get("prefer") === "true";

  // 토글 클릭 시 URL에 prefer 파라미터를 추가/제거
  const handlePreferToggle = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (preferOn) {
      params.delete("prefer"); // OFF로 전환 -- prefer 파라미터 제거
    } else {
      params.set("prefer", "true"); // ON으로 전환
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [preferOn, searchParams, router, pathname]);

  // searchParams가 바뀔 때마다 API 호출
  useEffect(() => {
    setLoading(true);

    // 현재 URL의 쿼리 파라미터를 그대로 API에 전달
    const params = new URLSearchParams(searchParams.toString());
    const url = `/api/web/tournaments?${params.toString()}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<TournamentsApiResponse>;
      })
      .then((data) => {
        if (data) {
          setTournaments(data.tournaments ?? []);
        }
      })
      .catch(() => {
        setTournaments([]);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  // 필터가 활성화되어 있는지 확인
  const status = searchParams.get("status");
  const hasFilters = (status && status !== "all") || preferOn;

  return (
    <>
      {/* 헤더 영역 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>TOURNAMENTS</h1>
        <div className="flex items-center gap-2">
          {/* 내 선호 지역만 보기 토글 버튼 */}
          <button
            onClick={handlePreferToggle}
            className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors ${
              preferOn
                ? "bg-[#1B3C87] text-white"
                : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
            }`}
            title="내 선호 지역만 보기"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {preferOn ? "선호 ON" : "선호"}
          </button>
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

          {/* 대회 카드 그리드 */}
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
