import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 300; // 5분 ISR

export default async function SitePage() {
  const headersList = await headers();
  const subdomain = headersList.get("x-tournament-subdomain");
  if (!subdomain) return notFound();

  const site = await prisma.tournamentSite.findUnique({
    where: { subdomain },
    select: { tournamentId: true, isPublished: true },
  });

  if (!site || !site.isPublished) return notFound();

  const tournamentId = site.tournamentId;

  // ★ 멀티테넌트 격리: tournamentId 조건 필수
  const [matches, teams] = await Promise.all([
    prisma.tournamentMatch.findMany({
      where: { tournamentId },
      orderBy: { scheduledAt: "asc" },
      include: {
        homeTeam: { include: { team: { select: { name: true } } } },
        awayTeam: { include: { team: { select: { name: true } } } },
      },
    }),
    prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: { team: { select: { name: true, primaryColor: true } } },
      orderBy: [{ wins: "desc" }, { losses: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 text-xl font-bold">일정</h2>
        <div className="grid gap-3">
          {matches.map((m) => (
            <Card key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold">{m.homeTeam?.team.name ?? "TBD"}</span>
                <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-sm font-bold">
                  {m.homeScore} : {m.awayScore}
                </span>
                <span className="font-semibold">{m.awayTeam?.team.name ?? "TBD"}</span>
              </div>
              <div className="flex items-center gap-2">
                {m.roundName && <span className="text-xs text-[#9CA3AF]">{m.roundName}</span>}
                <Badge
                  variant={
                    m.status === "completed" ? "info" : m.status === "live" ? "error" : "default"
                  }
                >
                  {m.status === "completed" ? "종료" : m.status === "live" ? "LIVE" : "예정"}
                </Badge>
              </div>
            </Card>
          ))}
          {matches.length === 0 && (
            <Card className="text-center text-[#6B7280]">경기 일정이 없습니다.</Card>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">순위</h2>
        <Card className="overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E8ECF0] text-[#6B7280]">
              <tr>
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">팀</th>
                <th className="px-5 py-3 font-medium text-center">승</th>
                <th className="px-5 py-3 font-medium text-center">패</th>
                <th className="px-5 py-3 font-medium text-center">승률</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t, i) => {
                const total = (t.wins ?? 0) + (t.losses ?? 0);
                const winPct = total > 0 ? ((t.wins ?? 0) / total).toFixed(3) : ".000";
                return (
                  <tr key={t.id} className="border-b border-[#F1F5F9]">
                    <td className="px-5 py-3 font-bold text-[#F4A261]">{i + 1}</td>
                    <td className="px-5 py-3 font-medium">{t.team.name}</td>
                    <td className="px-5 py-3 text-center">{t.wins ?? 0}</td>
                    <td className="px-5 py-3 text-center">{t.losses ?? 0}</td>
                    <td className="px-5 py-3 text-center">{winPct}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {teams.length === 0 && (
            <div className="p-6 text-center text-[#6B7280]">참가 팀이 없습니다.</div>
          )}
        </Card>
      </section>
    </div>
  );
}
