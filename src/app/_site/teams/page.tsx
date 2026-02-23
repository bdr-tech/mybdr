import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";

export const revalidate = 300;

export default async function SiteTeamsPage() {
  const headersList = await headers();
  const subdomain = headersList.get("x-tournament-subdomain");
  if (!subdomain) return notFound();

  const site = await prisma.tournamentSite.findUnique({
    where: { subdomain },
    select: { tournamentId: true, isPublished: true },
  });
  if (!site || !site.isPublished) return notFound();

  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: site.tournamentId, status: "approved" },
    include: {
      team: { select: { name: true, primaryColor: true, city: true } },
      players: { select: { id: true, role: true, users: { select: { nickname: true, position: true } } } },
    },
    orderBy: [{ wins: "desc" }, { losses: "asc" }],
  });

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">참가팀 ({teams.length})</h2>
      {teams.length === 0 ? (
        <Card className="py-12 text-center text-[#6B7280]">
          <div className="mb-2 text-3xl">🏀</div>
          참가팀이 없습니다.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t, i) => {
            const color = t.team.primaryColor ?? "#F4A261";
            const total = (t.wins ?? 0) + (t.losses ?? 0);
            const winPct = total > 0 ? (((t.wins ?? 0) / total) * 100).toFixed(0) : "0";

            return (
              <Card key={t.id.toString()}>
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-[#111827]"
                    style={{ backgroundColor: color }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold">{t.team.name}</p>
                    {t.team.city && (
                      <p className="text-xs text-[#6B7280]">{t.team.city}</p>
                    )}
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="font-bold text-[#4ADE80]">{t.wins ?? 0}</p>
                    <p className="text-xs text-[#9CA3AF]">승</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#EF4444]">{t.losses ?? 0}</p>
                    <p className="text-xs text-[#9CA3AF]">패</p>
                  </div>
                  <div>
                    <p className="font-bold">{winPct}%</p>
                    <p className="text-xs text-[#9CA3AF]">승률</p>
                  </div>
                </div>

                {t.players.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-[#9CA3AF]">선수 ({t.players.length}명)</p>
                    <div className="flex flex-wrap gap-1">
                      {t.players.map((p) => (
                        <span
                          key={p.id.toString()}
                          className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs"
                        >
                          {p.users?.nickname ?? "선수"}
                          {p.users?.position ? ` (${p.users.position})` : ""}
                          {p.role === "captain" ? " ★" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
