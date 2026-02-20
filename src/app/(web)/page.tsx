import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

// Rails home/index — hero + 추천경기 + 다가오는 대회 + 인기 대회
export default async function HomePage() {
  const [upcomingTournaments, recentGames] = await Promise.all([
    prisma.tournament.findMany({
      where: { status: { in: ["active", "published", "registration_open"] } },
      orderBy: { startDate: "asc" },
      take: 4,
    }).catch(() => []),
    prisma.games.findMany({
      where: { status: { in: [1, 2] } }, // 1=published, 2=confirmed
      orderBy: { scheduled_at: "asc" },
      take: 4,
    }).catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      {/* Hero Section (Rails _hero_section.html.erb) */}
      <section className="rounded-[24px] bg-gradient-to-br from-[#F4A261]/20 to-[#E76F51]/10 p-8 text-center md:p-12">
        <h1 className="mb-2 text-3xl font-bold md:text-4xl">
          <span className="text-[#F4A261]">B</span>asketball
          <span className="text-[#F4A261]"> D</span>evelopment
          <span className="text-[#F4A261]"> R</span>oad
        </h1>
        <p className="mb-6 text-[#A0A0A0]">농구 대회를 만들고, 관리하고, 함께 즐기세요</p>
        <div className="flex justify-center gap-3">
          <Link href="/games"><Button>경기 찾기</Button></Link>
          <Link href="/tournaments"><Button variant="secondary">대회 둘러보기</Button></Link>
        </div>
      </section>

      {/* Quick Actions (Rails _quick_action.html.erb) */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { href: "/games/new", icon: "🏀", label: "경기 만들기" },
          { href: "/tournaments/new", icon: "🏆", label: "대회 만들기" },
          { href: "/teams/new", icon: "👕", label: "팀 만들기" },
          { href: "/courts", icon: "📍", label: "코트 찾기" },
        ].map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="text-center hover:bg-[#252525] transition-colors cursor-pointer py-6">
              <div className="mb-2 text-2xl">{a.icon}</div>
              <p className="text-sm font-medium">{a.label}</p>
            </Card>
          </Link>
        ))}
      </section>

      {/* 다가오는 대회 (Rails _upcoming_tournaments_card.html.erb) */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">다가오는 대회</h2>
          <Link href="/tournaments" className="text-sm text-[#F4A261]">전체보기</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {upcomingTournaments.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <Card className="hover:bg-[#252525] transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t.name}</h3>
                  <Badge>{t.status ?? "draft"}</Badge>
                </div>
                <p className="mt-1 text-xs text-[#666666]">
                  {t.format}{t.startDate && ` · ${t.startDate.toLocaleDateString("ko-KR")}`}
                </p>
              </Card>
            </Link>
          ))}
          {upcomingTournaments.length === 0 && (
            <Card className="col-span-full text-center text-[#A0A0A0]">예정된 대회가 없습니다.</Card>
          )}
        </div>
      </section>

      {/* 추천 경기 (Rails _recommended_games.html.erb) */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">추천 경기</h2>
          <Link href="/games" className="text-sm text-[#F4A261]">전체보기</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {recentGames.map((g) => (
            <Link key={g.id.toString()} href={`/games/${g.id}`}>
              <Card className="hover:bg-[#252525] transition-colors cursor-pointer">
                <h3 className="font-semibold">{g.title}</h3>
                <p className="mt-1 text-xs text-[#666666]">
                  {g.scheduled_at?.toLocaleDateString("ko-KR")} · {g.venue_name ?? g.city ?? "장소 미정"}
                </p>
              </Card>
            </Link>
          ))}
          {recentGames.length === 0 && (
            <Card className="col-span-full text-center text-[#A0A0A0]">추천 경기가 없습니다.</Card>
          )}
        </div>
      </section>
    </div>
  );
}
