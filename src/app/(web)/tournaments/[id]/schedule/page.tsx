import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 30;

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id },
    orderBy: { scheduledAt: "asc" },
    include: {
      homeTeam: { include: { team: { select: { name: true } } } },
      awayTeam: { include: { team: { select: { name: true } } } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">일정</h1>
      <div className="space-y-3">
        {matches.map((m) => (
          <Card key={m.id.toString()} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="min-w-[80px] font-medium">{m.homeTeam?.team.name ?? "TBD"}</span>
              <span className="rounded-full bg-[#252525] px-3 py-1 text-sm font-bold">{m.homeScore}:{m.awayScore}</span>
              <span className="min-w-[80px] font-medium">{m.awayTeam?.team.name ?? "TBD"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#666666]">
              {m.roundName && <span>{m.roundName}</span>}
              {m.scheduledAt && <span>{m.scheduledAt.toLocaleDateString("ko-KR")}</span>}
              <Badge variant={m.status === "completed" ? "info" : m.status === "live" ? "error" : "default"}>
                {m.status === "completed" ? "종료" : m.status === "live" ? "LIVE" : "예정"}
              </Badge>
            </div>
          </Card>
        ))}
        {matches.length === 0 && <Card className="text-center text-[#A0A0A0]">일정이 없습니다.</Card>}
      </div>
    </div>
  );
}
