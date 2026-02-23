import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";

export const revalidate = 60;

export default async function TournamentTeamsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id },
    include: {
      team: { select: { name: true, primaryColor: true } },
      players: { select: { id: true, jerseyNumber: true, position: true, users: { select: { nickname: true } } } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">참가팀</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {teams.map((t) => (
          <Card key={t.id.toString()}>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: `${t.team.primaryColor ?? "#F4A261"}20`, color: t.team.primaryColor ?? "#F4A261" }}>
                {t.team.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold">{t.team.name}</h3>
                <p className="text-xs text-[#9CA3AF]">{t.groupName && `${t.groupName} · `}{t.players.length}명</p>
              </div>
            </div>
            <div className="space-y-1">
              {t.players.map((p) => (
                <div key={p.id.toString()} className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">#{p.jerseyNumber ?? "-"} {p.users?.nickname ?? "선수"}</span>
                  <span className="text-xs text-[#9CA3AF]">{p.position ?? ""}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
