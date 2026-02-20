import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TournamentsFilter } from "./tournaments-filter";

export const revalidate = 30;

const STATUS_INFO: Record<string, { label: string; variant: "success" | "default" | "error" | "warning" | "info"; accent: string }> = {
  draft:               { label: "준비중",  variant: "default",  accent: "#555555" },
  registration:        { label: "모집중",  variant: "success",  accent: "#4ADE80" },
  registration_open:   { label: "모집중",  variant: "success",  accent: "#4ADE80" },
  registration_closed: { label: "접수마감", variant: "warning",  accent: "#FBBF24" },
  ongoing:             { label: "진행중",  variant: "info",     accent: "#60A5FA" },
  completed:           { label: "완료",   variant: "default",  accent: "#6B7280" },
  cancelled:           { label: "취소",   variant: "error",    accent: "#EF4444" },
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
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#2A2A2A]">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="flex-shrink-0 text-xs text-[#A0A0A0]">
        {current}/{max}팀
      </span>
    </div>
  );
}

function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start) return "";
  const startStr = start.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  if (!end) return startStr;
  const endStr = end.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  return `${startStr} ~ ${endStr}`;
}

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const tournaments = await prisma.tournament.findMany({
    where: {
      status:
        status && status !== "all"
          ? status
          : { not: "draft" },
    },
    orderBy: { startDate: "desc" },
    take: 60,
    select: {
      id: true,
      name: true,
      format: true,
      status: true,
      startDate: true,
      endDate: true,
      entry_fee: true,
      city: true,
      venue_name: true,
      maxTeams: true,
      _count: { select: { tournamentTeams: true } },
    },
  }).catch(() => []);

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">대회</h1>
        <Link
          href="/tournaments/new"
          className="rounded-full bg-[#F4A261] px-4 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E8934E] transition-colors"
        >
          대회 만들기
        </Link>
      </div>

      {/* 상태 탭 필터 */}
      <Suspense fallback={<div className="mb-6 h-10" />}>
        <TournamentsFilter />
      </Suspense>

      {/* 결과 카운트 */}
      {status && status !== "all" && (
        <p className="mb-4 text-sm text-[#666666]">
          검색 결과 <span className="text-white">{tournaments.length}개</span>
        </p>
      )}

      {/* 카드 그리드 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((t) => {
          const st = t.status ?? "draft";
          const info = STATUS_INFO[st] ?? { label: st, variant: "default" as const, accent: "#555555" };
          const formatLabel = FORMAT_LABEL[t.format ?? ""] ?? t.format ?? "";
          const dateRange = formatDateRange(t.startDate, t.endDate);
          const teamCount = t._count.tournamentTeams;
          const maxTeams = t.maxTeams ?? 16;
          const location = [t.city, t.venue_name].filter(Boolean).join(" ");
          const hasFee = t.entry_fee && Number(t.entry_fee) > 0;

          return (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <div
                className="group relative overflow-hidden rounded-[16px] bg-[#1A1A1A] p-5 transition-all hover:bg-[#222222] hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderLeft: `3px solid ${info.accent}` }}
              >
                {/* 형식 + 상태 */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-[#A0A0A0]">
                    {formatLabel}
                  </span>
                  <Badge variant={info.variant}>{info.label}</Badge>
                </div>

                {/* 대회명 */}
                <h3 className="mb-3 font-semibold leading-snug text-white line-clamp-2">
                  {t.name}
                </h3>

                {/* 장소 + 날짜 */}
                <div className="mb-3 space-y-1">
                  {location && (
                    <div className="flex items-center gap-1.5 text-xs text-[#A0A0A0]">
                      <span>📍</span>
                      <span className="truncate">{location}</span>
                    </div>
                  )}
                  {dateRange && (
                    <div className="flex items-center gap-1.5 text-xs text-[#A0A0A0]">
                      <span>📅</span>
                      <span>{dateRange}</span>
                    </div>
                  )}
                </div>

                {/* 구분선 */}
                <div className="mb-3 h-px bg-[#2A2A2A]" />

                {/* 참가팀 현황 바 */}
                <TeamCountBar current={teamCount} max={maxTeams} />

                {/* 참가비 */}
                <div className="mt-2 text-xs text-[#666666]">
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
            <p className="text-[#A0A0A0]">
              {status && status !== "all"
                ? "조건에 맞는 대회가 없습니다."
                : "등록된 대회가 없습니다."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
