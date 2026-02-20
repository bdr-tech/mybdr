import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";

export const revalidate = 60;

export default async function SiteResultsPage() {
  const headersList = await headers();
  const subdomain = headersList.get("x-tournament-subdomain");
  if (!subdomain) return notFound();

  const site = await prisma.tournamentSite.findUnique({
    where: { subdomain },
    select: { tournamentId: true, isPublished: true },
  });
  if (!site || !site.isPublished) return notFound();

  const completed = await prisma.tournamentMatch.findMany({
    where: { tournamentId: site.tournamentId, status: "completed" },
    orderBy: [{ scheduledAt: "desc" }],
    include: {
      homeTeam: { include: { team: { select: { name: true, primaryColor: true } } } },
      awayTeam: { include: { team: { select: { name: true, primaryColor: true } } } },
    },
  });

  // 라운드별 그룹
  const rounds = Array.from(new Set(completed.map((m) => m.round_number ?? 0))).sort(
    (a, b) => b - a
  );

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">경기 결과</h2>

      {completed.length === 0 ? (
        <Card className="py-12 text-center text-[#A0A0A0]">
          <div className="mb-2 text-3xl">📋</div>
          아직 종료된 경기가 없습니다.
        </Card>
      ) : (
        <div className="space-y-6">
          {rounds.map((roundNum) => {
            const roundMatches = completed.filter((m) => (m.round_number ?? 0) === roundNum);
            const label = roundMatches[0]?.roundName ?? `라운드 ${roundNum}`;

            return (
              <div key={roundNum}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#A0A0A0]">
                  {label}
                </h3>
                <div className="space-y-2">
                  {roundMatches.map((m) => {
                    const homeWin = m.winner_team_id === m.homeTeamId && m.homeTeamId;
                    const awayWin = m.winner_team_id === m.awayTeamId && m.awayTeamId;

                    return (
                      <Card key={m.id.toString()}>
                        <div className="flex items-center gap-4">
                          {/* 홈팀 */}
                          <div className="flex flex-1 items-center justify-end gap-2">
                            {homeWin && (
                              <span className="text-xs font-bold text-[#F4A261]">WIN</span>
                            )}
                            <div className="flex items-center gap-2">
                              {m.homeTeam?.team.primaryColor && (
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: m.homeTeam.team.primaryColor }}
                                />
                              )}
                              <span
                                className={`font-semibold ${homeWin ? "text-[#F4A261]" : "text-white"}`}
                              >
                                {m.homeTeam?.team.name ?? "TBD"}
                              </span>
                            </div>
                          </div>

                          {/* 스코어 */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`min-w-[2rem] text-center text-2xl font-bold ${homeWin ? "text-[#F4A261]" : ""}`}
                            >
                              {m.homeScore}
                            </span>
                            <span className="text-[#666666]">:</span>
                            <span
                              className={`min-w-[2rem] text-center text-2xl font-bold ${awayWin ? "text-[#F4A261]" : ""}`}
                            >
                              {m.awayScore}
                            </span>
                          </div>

                          {/* 원정팀 */}
                          <div className="flex flex-1 items-center gap-2">
                            <div className="flex items-center gap-2">
                              {m.awayTeam?.team.primaryColor && (
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: m.awayTeam.team.primaryColor }}
                                />
                              )}
                              <span
                                className={`font-semibold ${awayWin ? "text-[#F4A261]" : "text-white"}`}
                              >
                                {m.awayTeam?.team.name ?? "TBD"}
                              </span>
                            </div>
                            {awayWin && (
                              <span className="text-xs font-bold text-[#F4A261]">WIN</span>
                            )}
                          </div>
                        </div>

                        {m.scheduledAt && (
                          <p className="mt-1 text-center text-xs text-[#666666]">
                            {m.scheduledAt.toLocaleDateString("ko-KR")}
                            {m.venue_name ? ` · ${m.venue_name}` : ""}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
