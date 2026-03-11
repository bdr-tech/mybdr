import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { listGames, listGameCities } from "@/lib/services/game";
import { GamesFilter } from "./games-filter";
import { PickupGameCard } from "./_components/pickup-game-card";
import { GuestGameCard } from "./_components/guest-game-card";
import { TeamMatchCard } from "./_components/team-match-card";

export const revalidate = 30;

// -- 도시 목록 캐시 (자주 변하지 않음) --
const getCities = unstable_cache(
  async (): Promise<string[]> => {
    return listGameCities(30).catch(() => []);
  },
  ["games-cities"],
  { revalidate: 300 } // 5분 캐시 (도시 목록은 자주 안 바뀜)
);

// -- Skeleton for games grid --
function GamesGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-[16px] bg-white border border-[#E8ECF0] p-4">
          <div className="mb-2 h-5 w-3/4 rounded bg-[#E8ECF0]" />
          <div className="h-4 w-1/2 rounded bg-[#E8ECF0]" />
          <div className="mt-3 h-4 w-2/3 rounded bg-[#E8ECF0]" />
        </div>
      ))}
    </div>
  );
}

// -- Async data component --
async function GamesGrid({
  q,
  type,
  city,
  date,
}: {
  q?: string;
  type?: string;
  city?: string;
  date?: string;
}) {
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

  const games = await listGames({
    q,
    type,
    city,
    scheduledAt: scheduledAtFilter,
    take: 60,
  }).catch(() => []);

  const hasFilters = q || (type && type !== "all") || (city && city !== "all") || (date && date !== "all");

  return (
    <>
      {/* 결과 카운트 */}
      {hasFilters && (
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
              {hasFilters ? "조건에 맞는 경기가 없습니다." : "등록된 경기가 없습니다."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; city?: string; date?: string }>;
}) {
  const { q, type, city, date } = await searchParams;

  // 도시 목록은 캐시에서 빠르게 로드 (필터 UI에 필요)
  const cities = await getCities();

  return (
    <div>
      {/* 헤더 -- 즉시 렌더링 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">경기</h1>
        <div className="flex gap-2">
          <Link
            href="/games/my-games"
            prefetch={true}
            className="rounded-full border border-[#E8ECF0] px-4 py-2 text-sm text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#111827] transition-colors"
          >
            내 경기
          </Link>
          <Link
            href="/games/new"
            prefetch={true}
            className="rounded-full bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0052CC] transition-colors"
          >
            경기 만들기
          </Link>
        </div>
      </div>

      {/* 필터 -- 즉시 렌더링 */}
      <Suspense fallback={<div className="mb-6 h-10" />}>
        <GamesFilter cities={cities} />
      </Suspense>

      {/* 데이터 그리드: Suspense로 스트리밍 */}
      <Suspense fallback={<GamesGridSkeleton />}>
        <GamesGrid q={q} type={type} city={city} date={date} />
      </Suspense>
    </div>
  );
}
