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
  const color = pct >= 100 ? "#EF4444" : pct >= 75 ? "#FBBF24" : "#4ADE80";
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <div
                className="group relative overflow-hidden rounded-[16px] bg-[#FFFFFF] p-5 transition-all hover:bg-[#F5F5F5] hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderLeft: `3px solid ${style.accent}` }}
              >
                {/* 형식 + 상태 */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-[#6B7280]">
                    {formatLabel}
                  </span>
                  <Badge variant={style.variant}>{label}</Badge>
                </div>

                {/* 대회명 */}
                <h3 className="mb-3 font-semibold leading-snug text-[#111827] line-clamp-2">
                  {t.name}
                </h3>

                {/* 장소 + 날짜 */}
                <div className="mb-3 space-y-1">
                  {location && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                      <span>📍</span>
                      <span className="truncate">{location}</span>
                    </div>
                  )}
                  {dateRange && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                      <span>📅</span>
                      <span>{dateRange}</span>
                    </div>
                  )}
                </div>

                {/* 구분선 */}
                <div className="mb-3 h-px bg-[#E8ECF0]" />

                {/* 참가팀 현황 바 */}
                <TeamCountBar current={t.teamCount} max={maxTeams} />

                {/* 참가비 */}
                <div className="mt-2 text-xs text-[#9CA3AF]">
                  {hasFee
                    ? `💰 참가비 ${Number(t.entry_fee).toLocaleString()}원`
                    : "무료"}
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
        <h1 className="text-2xl font-bold">대회</h1>
        <Link
          href="/tournament-admin/tournaments/new/wizard"
          prefetch={true}
          className="rounded-full bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0052CC] transition-colors"
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
