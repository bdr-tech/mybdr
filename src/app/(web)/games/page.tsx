import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GamesFilter } from "./games-filter";

export const revalidate = 30;

const GAME_TYPE_INFO: Record<number, { emoji: string; label: string; accent: string }> = {
  0: { emoji: "🏀", label: "픽업",      accent: "#F4A261" },
  1: { emoji: "🤝", label: "용병 모집", accent: "#60A5FA" },
  2: { emoji: "⚔️", label: "팀 대결",   accent: "#4ADE80" },
};

const STATUS_INFO: Record<number, { label: string; variant: "success" | "default" | "error" | "warning" | "info" }> = {
  0: { label: "임시",   variant: "warning" },
  1: { label: "모집중", variant: "success" },
  2: { label: "확정",   variant: "info" },
  3: { label: "완료",   variant: "default" },
  4: { label: "취소",   variant: "error" },
};

const SKILL_LABEL: Record<string, string> = {
  all:          "전체",
  beginner:     "초급",
  intermediate: "중급",
  advanced:     "고급",
};

function ParticipantBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const color = pct >= 100 ? "#EF4444" : pct >= 80 ? "#FBBF24" : "#4ADE80";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8ECF0]">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="flex-shrink-0 text-xs text-[#6B7280]">
        {current}/{max}명
      </span>
    </div>
  );
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; city?: string; date?: string }>;
}) {
  const { q, type, city, date } = await searchParams;

  // 날짜 범위 계산
  let scheduledAtFilter: { gte?: Date; lt?: Date } | undefined;
  if (date && date !== "all") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (date === "today") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      scheduledAtFilter = { gte: today, lt: tomorrow };
    } else if (date === "week") {
      const mon = new Date(today);
      mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const nextMon = new Date(mon);
      nextMon.setDate(mon.getDate() + 7);
      scheduledAtFilter = { gte: mon, lt: nextMon };
    } else if (date === "month") {
      scheduledAtFilter = {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    }
  }

  const [games, citiesRaw] = await Promise.all([
    prisma.games.findMany({
      where: {
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
        ...(type && type !== "all" ? { game_type: parseInt(type) } : {}),
        ...(city && city !== "all" ? { city: { contains: city, mode: "insensitive" } } : {}),
        ...(scheduledAtFilter ? { scheduled_at: scheduledAtFilter } : {}),
      },
      orderBy: { scheduled_at: "asc" },
      take: 60,
    }).catch(() => []),
    prisma.games.groupBy({
      by: ["city"],
      where: { city: { not: null } },
      orderBy: { _count: { city: "desc" } },
      take: 30,
    }).catch(() => []),
  ]);

  const cities = citiesRaw.map((r) => r.city!).filter(Boolean);

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">경기</h1>
        <div className="flex gap-2">
          <Link
            href="/games/my-games"
            className="rounded-full border border-[#E8ECF0] px-4 py-2 text-sm text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#111827] transition-colors"
          >
            내 경기
          </Link>
          <Link
            href="/games/new"
            className="rounded-full bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0052CC] transition-colors"
          >
            경기 만들기
          </Link>
        </div>
      </div>

      {/* 필터 */}
      <Suspense fallback={<div className="mb-6 h-10" />}>
        <GamesFilter cities={cities} />
      </Suspense>

      {/* 결과 카운트 */}
      {(q || (type && type !== "all") || (city && city !== "all") || (date && date !== "all")) && (
        <p className="mb-4 text-sm text-[#9CA3AF]">
          검색 결과 <span className="text-[#111827]">{games.length}개</span>
        </p>
      )}

      {/* 카드 그리드 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => {
          const typeInfo = GAME_TYPE_INFO[g.game_type] ?? GAME_TYPE_INFO[0];
          const statusInfo = STATUS_INFO[g.status] ?? { label: String(g.status), variant: "default" as const };
          const location = [g.city, g.district, g.venue_name].filter(Boolean).join(" ");
          const cur = g.current_participants ?? 0;
          const max = g.max_participants ?? 0;

          return (
            <Link key={g.id.toString()} href={`/games/${g.uuid ?? g.id}`}>
              <div
                className="group relative overflow-hidden rounded-[16px] bg-[#FFFFFF] p-5 transition-all hover:bg-[#F5F5F5] hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderLeft: `3px solid ${typeInfo.accent}` }}
              >
                {/* 유형 + 상태 */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{typeInfo.emoji}</span>
                    <span className="text-xs font-medium" style={{ color: typeInfo.accent }}>
                      {typeInfo.label}
                    </span>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>

                {/* 제목 */}
                <h3 className="mb-3 font-semibold leading-snug text-[#111827] line-clamp-2">
                  {g.title}
                </h3>

                {/* 장소 + 날짜 */}
                <div className="mb-3 space-y-1">
                  {location && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                      <span>📍</span>
                      <span className="truncate">{location}</span>
                    </div>
                  )}
                  {g.scheduled_at && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                      <span>📅</span>
                      <span>
                        {g.scheduled_at.toLocaleDateString("ko-KR", {
                          month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul",
                        })}
                        {" "}
                        {g.scheduled_at.toLocaleTimeString("ko-KR", {
                          hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* 구분선 */}
                <div className="mb-3 h-px bg-[#E8ECF0]" />

                {/* 참가 현황 */}
                {max > 0 && <ParticipantBar current={cur} max={max} />}

                {/* 참가비 + 기술수준 */}
                <div className="mt-2 flex items-center justify-between text-xs text-[#9CA3AF]">
                  <span>
                    {g.fee_per_person && g.fee_per_person > 0
                      ? `💰 ${Number(g.fee_per_person).toLocaleString()}원`
                      : "무료"}
                  </span>
                  {g.skill_level && g.skill_level !== "all" && (
                    <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[#6B7280]">
                      {SKILL_LABEL[g.skill_level] ?? g.skill_level}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}

        {games.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="mb-3 text-4xl">🏀</div>
            <p className="text-[#6B7280]">
              {q || type || city || date ? "조건에 맞는 경기가 없습니다." : "등록된 경기가 없습니다."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
