import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { GamesFilter } from "./games-filter";
import { PickupGameCard } from "./_components/pickup-game-card";
import { GuestGameCard } from "./_components/guest-game-card";
import { TeamMatchCard } from "./_components/team-match-card";

export const revalidate = 30;

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
          if (g.game_type === 0) return <PickupGameCard key={g.id.toString()} game={g} />;
          if (g.game_type === 1) return <GuestGameCard key={g.id.toString()} game={g} />;
          if (g.game_type === 2) return <TeamMatchCard key={g.id.toString()} game={g} />;
          return <PickupGameCard key={g.id.toString()} game={g} />;
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
