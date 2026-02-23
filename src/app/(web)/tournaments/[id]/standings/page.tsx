import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";

export const revalidate = 30;

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id },
    include: { team: { select: { name: true } } },
    orderBy: [{ wins: "desc" }, { losses: "asc" }],
  });
  if (!teams) return notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">순위표</h1>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-[#E8ECF0] text-[#6B7280]">
            <tr><th className="px-5 py-3">#</th><th className="px-5 py-3 text-left">팀</th><th className="px-5 py-3">승</th><th className="px-5 py-3">패</th><th className="px-5 py-3">승률</th></tr>
          </thead>
          <tbody>
            {teams.map((t, i) => {
              const total = (t.wins ?? 0) + (t.losses ?? 0);
              const pct = total > 0 ? ((t.wins ?? 0) / total).toFixed(3) : ".000";
              return (
                <tr key={t.id.toString()} className="border-b border-[#F1F5F9]">
                  <td className="px-5 py-3 text-center font-bold text-[#F4A261]">{i + 1}</td>
                  <td className="px-5 py-3 font-medium">{t.team.name}</td>
                  <td className="px-5 py-3 text-center">{t.wins ?? 0}</td>
                  <td className="px-5 py-3 text-center">{t.losses ?? 0}</td>
                  <td className="px-5 py-3 text-center">{pct}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
