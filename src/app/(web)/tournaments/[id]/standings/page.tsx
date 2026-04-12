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
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">순위표</h1>
      <Card className="overflow-hidden p-0">
        {/* 모바일에서 테이블이 화면 밖으로 넘칠 때 가로 스크롤 허용 */}
        <div className="overflow-x-auto">
          {/* 모바일: text-xs / sm 이상: text-sm */}
          <table className="w-full text-xs sm:text-sm">
            <thead className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
              {/* 모바일: px-2 py-2.5 / sm 이상: 기존 px-5 py-3 유지 */}
              <tr><th className="px-2 py-2.5 sm:px-5 sm:py-3">#</th><th className="px-2 py-2.5 sm:px-5 sm:py-3 text-left">팀</th><th className="px-2 py-2.5 sm:px-5 sm:py-3">승</th><th className="px-2 py-2.5 sm:px-5 sm:py-3">패</th><th className="px-2 py-2.5 sm:px-5 sm:py-3">승률</th></tr>
            </thead>
            <tbody>
              {teams.map((t, i) => {
                const total = (t.wins ?? 0) + (t.losses ?? 0);
                const pct = total > 0 ? ((t.wins ?? 0) / total).toFixed(3) : ".000";
                return (
                  <tr key={t.id.toString()} className="border-b border-[var(--color-border)]">
                    <td className="px-2 py-2.5 sm:px-5 sm:py-3 text-center font-bold text-[var(--color-primary)]">{i + 1}</td>
                    <td className="px-2 py-2.5 sm:px-5 sm:py-3 font-medium">{t.team.name}</td>
                    <td className="px-2 py-2.5 sm:px-5 sm:py-3 text-center">{t.wins ?? 0}</td>
                    <td className="px-2 py-2.5 sm:px-5 sm:py-3 text-center">{t.losses ?? 0}</td>
                    <td className="px-2 py-2.5 sm:px-5 sm:py-3 text-center">{pct}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
