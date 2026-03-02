import { prisma } from "@/lib/db/prisma";

interface TournamentsTabProps {
  teamId: bigint;
}

export async function TournamentsTab({ teamId }: TournamentsTabProps) {
  const tournamentTeams = await prisma.tournamentTeam.findMany({
    where: { teamId },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
          startDate: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  }).catch(() => []);

  if (tournamentTeams.length === 0) {
    return (
      <div className="rounded-[16px] bg-white px-5 py-10 text-center">
        <p className="text-sm text-[#9CA3AF]">대회 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] bg-white p-5">
      <div className="space-y-2">
        {tournamentTeams.map((tt) => {
          const t = tt.tournament;
          const year = t.startDate ? new Date(t.startDate).getFullYear() : null;
          const rankLabel = tt.final_rank ? `${tt.final_rank}위` : null;
          return (
            <div
              key={tt.id.toString()}
              className="flex items-center justify-between rounded-[12px] bg-[#EEF2FF] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#111827]">{t.name}</p>
                <p className="text-xs text-[#9CA3AF]">
                  {year ? `${year}년` : ""}
                  {tt.division ? ` · ${tt.division}` : ""}
                </p>
              </div>
              <div className="ml-3 flex flex-shrink-0 flex-col items-end gap-0.5">
                {rankLabel && (
                  <span className="rounded-full bg-[#E8ECF0] px-2 py-0.5 text-xs font-medium text-[#6B7280]">
                    {rankLabel}
                  </span>
                )}
                <span className="text-xs text-[#9CA3AF]">{tt.status ?? t.status ?? "-"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
