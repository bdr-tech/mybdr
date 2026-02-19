import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

// Rails tournaments/show — 대회 상세 (탭: 일정, 순위, 대진표)
export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      tournamentTeams: { include: { team: { select: { name: true } } }, orderBy: [{ wins: "desc" }] },
      tournamentMatches: { orderBy: { scheduledAt: "asc" }, take: 10, include: {
        homeTeam: { include: { team: { select: { name: true } } } },
        awayTeam: { include: { team: { select: { name: true } } } },
      }},
    },
  });
  if (!tournament) return notFound();

  const tabs = [
    { href: `/tournaments/${id}`, label: "개요" },
    { href: `/tournaments/${id}/schedule`, label: "일정" },
    { href: `/tournaments/${id}/standings`, label: "순위" },
    { href: `/tournaments/${id}/bracket`, label: "대진표" },
    { href: `/tournaments/${id}/teams`, label: "참가팀" },
  ];

  return (
    <div>
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <Badge>{tournament.status ?? "draft"}</Badge>
        </div>
        <p className="mt-2 text-sm text-[#A0A0A0]">
          {tournament.format} · {tournament.tournamentTeams.length}팀
          {tournament.startDate && ` · ${tournament.startDate.toLocaleDateString("ko-KR")}`}
          {tournament.endDate && ` ~ ${tournament.endDate.toLocaleDateString("ko-KR")}`}
        </p>
        {tournament.description && <p className="mt-3 text-sm text-[#666666]">{tournament.description}</p>}
      </Card>

      {/* Sub Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className="whitespace-nowrap rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-[#A0A0A0] hover:bg-[#252525] hover:text-white">
            {t.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 최근 경기 */}
        <div>
          <h2 className="mb-3 font-semibold">최근 경기</h2>
          <div className="space-y-2">
            {tournament.tournamentMatches.map((m) => (
              <Card key={m.id.toString()} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">{m.homeTeam?.team.name ?? "TBD"}</span>
                <span className="rounded-full bg-[#252525] px-3 py-1 text-sm font-bold">{m.homeScore}:{m.awayScore}</span>
                <span className="text-sm font-medium">{m.awayTeam?.team.name ?? "TBD"}</span>
              </Card>
            ))}
            {tournament.tournamentMatches.length === 0 && <Card className="text-center text-sm text-[#A0A0A0]">경기가 없습니다.</Card>}
          </div>
        </div>

        {/* 순위 */}
        <div>
          <h2 className="mb-3 font-semibold">순위</h2>
          <Card className="overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-[#2A2A2A] text-[#A0A0A0]">
                <tr><th className="px-4 py-2 text-left">#</th><th className="px-4 py-2 text-left">팀</th><th className="px-4 py-2 text-center">승</th><th className="px-4 py-2 text-center">패</th></tr>
              </thead>
              <tbody>
                {tournament.tournamentTeams.map((t, i) => (
                  <tr key={t.id.toString()} className="border-b border-[#1F1F1F]">
                    <td className="px-4 py-2 font-bold text-[#F4A261]">{i + 1}</td>
                    <td className="px-4 py-2">{t.team.name}</td>
                    <td className="px-4 py-2 text-center">{t.wins ?? 0}</td>
                    <td className="px-4 py-2 text-center">{t.losses ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
