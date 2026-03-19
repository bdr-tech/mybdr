import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { listTournaments } from "@/lib/services/tournament";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TournamentsFilter } from "./tournaments-filter";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";

export const revalidate = 30;

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

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  hybrid: "혼합",
};

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

// string | null 허용 (unstable_cache 역직렬화 후 Date -> string)
function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "";
  const startStr = new Date(start).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  if (!end) return startStr;
  const endStr = new Date(end).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  return `${startStr} ~ ${endStr}`;
}

// JSON-serializable 타입
interface CachedTournament {
  id: string;
  name: string;
  format: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  entry_fee: string | null; // Decimal -> string
  city: string | null;
  venue_name: string | null;
  maxTeams: number | null;
  teamCount: number;
}

const getTournaments = (status: string | undefined) =>
  unstable_cache(
    async (): Promise<CachedTournament[]> => {
      const rows = await listTournaments({ status, take: 60 }).catch(() => []);

      return rows.map((t) => ({
        id: t.id,
        name: t.name,
        format: t.format,
        status: t.status,
        startDate: t.startDate?.toISOString() ?? null,
        endDate: t.endDate?.toISOString() ?? null,
        entry_fee: t.entry_fee ? t.entry_fee.toString() : null,
        city: t.city,
        venue_name: t.venue_name,
        maxTeams: t.maxTeams,
        teamCount: t._count.tournamentTeams,
      }));
    },
    [`tournaments-list-${status ?? "all"}`],
    { revalidate: 30 }
  )();

// -- Skeleton for the tournament grid --
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

// -- Async data component (streamed via Suspense) --
async function TournamentGrid({ status }: { status: string | undefined }) {
  const tournaments = await getTournaments(status);

  return (
    <>
      {/* 결과 카운트 */}
      {status && status !== "all" && (
        <p className="mb-4 text-sm text-[#9CA3AF]">
          검색 결과 <span className="text-[#111827]">{tournaments.length}개</span>
        </p>
      )}

      {/* 카드 그리드 */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((t) => {
          const st = t.status ?? "draft";
          const label = TOURNAMENT_STATUS_LABEL[st] ?? st;
          const style = STATUS_STYLE[st] ?? { variant: "default" as const, accent: "#6B7280" };
          const formatLabel = FORMAT_LABEL[t.format ?? ""] ?? t.format ?? "";
          const dateRange = formatDateRange(t.startDate, t.endDate);
          const maxTeams = t.maxTeams ?? 16;
          const location = [t.city, t.venue_name].filter(Boolean).join(" ");
          const hasFee = t.entry_fee && Number(t.entry_fee) > 0;

          return (
            <Link key={t.id} href={`/tournaments/${t.id}`} prefetch={true}>
              <div className="group overflow-hidden rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[#1B3C87]/30">
                {/* 상단 컬러 바 */}
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
                  <TeamCountBar current={t.teamCount} max={maxTeams} />

                  {/* 참가비 */}
                  <div className="mt-2 text-xs font-semibold text-[#111827]">
                    {hasFee
                      ? `₩${Number(t.entry_fee).toLocaleString()}`
                      : <span className="text-[#9CA3AF]">무료</span>}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {tournaments.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="mb-3 text-4xl">🏆</div>
            <p className="text-[#6B7280]">
              {status && status !== "all"
                ? "조건에 맞는 대회가 없습니다."
                : "등록된 대회가 없습니다."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <div>
      {/* 헤더 -- 즉시 렌더링 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>TOURNAMENTS</h1>
        <Link
          href="/tournament-admin/tournaments/new/wizard"
          prefetch={true}
          className="rounded-[10px] bg-[#E31B23] px-5 py-2 text-sm font-bold text-white hover:bg-[#C8101E] transition-colors"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          대회 만들기
        </Link>
      </div>

      {/* 상태 탭 필터 -- 즉시 렌더링 */}
      <Suspense fallback={<div className="mb-6 h-10" />}>
        <TournamentsFilter />
      </Suspense>

      {/* 데이터 그리드: Suspense로 스트리밍 */}
      <Suspense fallback={<TournamentGridSkeleton />}>
        <TournamentGrid status={status} />
      </Suspense>
    </div>
  );
}
