import Link from "next/link";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { listUpcomingTournaments } from "@/lib/services/tournament";
import { listRecentGames } from "@/lib/services/game";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickMenu } from "@/components/home/quick-menu";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";

export const revalidate = 60; // 1분 ISR

const TOURNAMENT_FORMAT: Record<string, string> = {
  single_elimination: "싱글 엘리미",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  hybrid: "혼합",
};

// JSON-serializable 타입 (unstable_cache 요구사항)
interface CachedTournament {
  id: string;
  name: string;
  format: string | null;
  status: string | null;
  startDate: string | null; // Date -> ISO string
}

interface CachedGame {
  id: string; // BigInt -> string
  uuid: string | null;
  title: string | null;
  scheduled_at: string | null; // Date -> ISO string
  venue_name: string | null;
  city: string | null;
}

const getHomeData = unstable_cache(
  async (): Promise<{ upcomingTournaments: CachedTournament[]; recentGames: CachedGame[] }> => {
    const [rawTournaments, rawGames] = await Promise.all([
      listUpcomingTournaments(4).catch(() => []),
      listRecentGames(4).catch(() => []),
    ]);
    return {
      upcomingTournaments: rawTournaments.map((t) => ({
        id: t.id,
        name: t.name,
        format: t.format,
        status: t.status,
        startDate: t.startDate?.toISOString() ?? null,
      })),
      recentGames: rawGames.map((g) => ({
        id: g.id.toString(),
        uuid: g.uuid,
        title: g.title,
        scheduled_at: g.scheduled_at?.toISOString() ?? null,
        venue_name: g.venue_name,
        city: g.city,
      })),
    };
  },
  ["home-data"],
  { revalidate: 60 }
);

// -- Skeleton for data sections --
function HomeDataSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-[16px]" />
          ))}
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-[16px]" />
          ))}
        </div>
      </section>
    </div>
  );
}

// -- Async data component (streamed via Suspense) --
async function HomeData() {
  const { upcomingTournaments, recentGames } = await getHomeData();

  return (
    <>
      {/* 다가오는 대회 (Rails _upcoming_tournaments_card.html.erb) */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">다가오는 대회</h2>
          <Link href="/tournaments" prefetch={true} className="text-sm text-[#F4A261]">전체보기</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {upcomingTournaments.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.id}`} prefetch={true}>
              <Card className="hover:bg-[#EEF2FF] transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t.name}</h3>
                  <Badge>{TOURNAMENT_STATUS_LABEL[t.status ?? "draft"] ?? t.status ?? "draft"}</Badge>
                </div>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {TOURNAMENT_FORMAT[t.format ?? ""] ?? t.format ?? ""}
                  {t.startDate && ` · ${new Date(t.startDate).toLocaleDateString("ko-KR")}`}
                </p>
              </Card>
            </Link>
          ))}
          {upcomingTournaments.length === 0 && (
            <Card className="col-span-full text-center text-[#6B7280]">예정된 대회가 없습니다.</Card>
          )}
        </div>
      </section>

      {/* 추천 경기 (Rails _recommended_games.html.erb) */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">추천 경기</h2>
          <Link href="/games" prefetch={true} className="text-sm text-[#F4A261]">전체보기</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {recentGames.map((g) => (
            <Link key={g.id} href={`/games/${g.uuid?.slice(0, 8) ?? g.id}`} prefetch={true}>
              <Card className="hover:bg-[#EEF2FF] transition-colors cursor-pointer">
                <h3 className="font-semibold">{g.title}</h3>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {g.scheduled_at ? new Date(g.scheduled_at).toLocaleDateString("ko-KR") : ""}
                  {" · "}{g.venue_name ?? g.city ?? "장소 미정"}
                </p>
              </Card>
            </Link>
          ))}
          {recentGames.length === 0 && (
            <Card className="col-span-full text-center text-[#6B7280]">추천 경기가 없습니다.</Card>
          )}
        </div>
      </section>
    </>
  );
}

// Rails home/index -- hero + 추천경기 + 다가오는 대회 + 인기 대회
export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section (Rails _hero_section.html.erb) -- 즉시 렌더링 */}
      <section className="rounded-[24px] bg-gradient-to-br from-[#0066FF]/15 to-[#F4A261]/10 p-8 text-center md:p-12 border border-[#E8ECF0]">
        <h1 className="mb-2 text-3xl font-bold md:text-4xl">
          <span className="text-[#F4A261]">B</span>asketball
          <span className="text-[#F4A261]"> D</span>aily
          <span className="text-[#F4A261]"> R</span>outine
        </h1>
        <p className="mb-6 text-[#6B7280]">농구 경기와 대회를 쉽고 빠르게 찾고, 즐기세요  </p>
        <div className="flex justify-center gap-3">
          <Link href="/games" prefetch={true}><Button>경기 찾기</Button></Link>
          <Link href="/tournaments" prefetch={true}><Button variant="secondary">대회 둘러보기</Button></Link>
        </div>
      </section>

      {/* 퀵 메뉴 -- 사용자 커스텀 즐겨찾기 */}
      <QuickMenu />

      {/* Quick Actions (Rails _quick_action.html.erb) -- 임시 히든 */}
      <section className="hidden">
        {[
          { href: "/games/new", icon: "🏀", label: "경기 만들기" },
          { href: "/tournaments/new", icon: "🏆", label: "대회 만들기" },
          { href: "/teams/new", icon: "👕", label: "팀 만들기" },
          { href: "/courts", icon: "📍", label: "코트 찾기" },
        ].map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="text-center hover:bg-[#EEF2FF] transition-colors cursor-pointer py-6">
              <div className="mb-2 text-2xl">{a.icon}</div>
              <p className="text-sm font-medium">{a.label}</p>
            </Card>
          </Link>
        ))}
      </section>

      {/* 데이터 섹션: Suspense로 스트리밍 (셸 즉시 표시) */}
      <Suspense fallback={<HomeDataSkeleton />}>
        <HomeData />
      </Suspense>
    </div>
  );
}
