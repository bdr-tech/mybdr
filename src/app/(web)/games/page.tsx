import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { listGames, listGameCities } from "@/lib/services/game";
import { GamesFilter } from "./games-filter";
import { GameCardCompact } from "./_components/game-card-compact";

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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-[16px] bg-white border border-[#E8ECF0] overflow-hidden">
          <div className="h-1 bg-[#E8ECF0]" />
          <div className="p-3.5 space-y-2.5">
            <div className="h-4 w-14 rounded-[6px] bg-[#E8ECF0]" />
            <div className="h-4 w-3/4 rounded bg-[#E8ECF0]" />
            <div className="h-3 w-1/2 rounded bg-[#E8ECF0]" />
            <div className="h-1.5 w-full rounded-full bg-[#E8ECF0]" />
          </div>
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

      {/* 카드 그리드 — 모바일 2열 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {games.map((g) => (
          <GameCardCompact key={g.id.toString()} game={g} />
        ))}

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
      {/* 헤더 */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>GAMES</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/games/my-games"
            prefetch={true}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF9F43] text-xs font-black text-[#111827] hover:bg-[#F7931E] transition-colors"
            title="내 경기"
          >
            MY
          </Link>
          <Link
            href="/games/new"
            prefetch={true}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B3C87] text-white hover:bg-[#142D6B] transition-colors"
            title="경기 만들기"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </Link>
          <Suspense fallback={<div className="h-9 w-9" />}>
            <GamesFilter cities={cities} />
          </Suspense>
        </div>
      </div>

      {/* 데이터 그리드: Suspense로 스트리밍 */}
      <Suspense fallback={<GamesGridSkeleton />}>
        <GamesGrid q={q} type={type} city={city} date={date} />
      </Suspense>
    </div>
  );
}
