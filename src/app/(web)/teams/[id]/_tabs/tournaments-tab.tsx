import { prisma } from "@/lib/db/prisma";

interface TournamentsTabProps {
  teamId: bigint;
}

export async function TournamentsTab({ teamId }: TournamentsTabProps) {
  // 기존 쿼리 100% 유지
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
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-10 text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--color-text-muted)] mb-2">emoji_events</span>
        <p className="text-sm text-[var(--color-text-muted)]">대회 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
      <div className="divide-y divide-[var(--color-border-subtle)]">
        {tournamentTeams.map((tt) => {
          const t = tt.tournament;
          const year = t.startDate ? new Date(t.startDate).getFullYear() : null;
          const rankLabel = tt.final_rank ? `${tt.final_rank}위` : null;

          return (
            <div
              key={tt.id.toString()}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--color-surface-bright)]"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* 대회 아이콘 */}
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[var(--color-surface-high)]">
                  <span className="material-symbols-outlined text-base text-[var(--color-text-secondary)]">emoji_events</span>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{t.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {year ? `${year}년` : ""}
                    {tt.division ? ` · ${tt.division}` : ""}
                  </p>
                </div>
              </div>
              <div className="ml-3 flex flex-shrink-0 flex-col items-end gap-0.5">
                {rankLabel && (
                  <span className="rounded bg-[var(--color-surface-high)] px-2 py-0.5 text-xs font-bold text-[var(--color-text-primary)]">
                    {rankLabel}
                  </span>
                )}
                <span className="text-xs text-[var(--color-text-muted)]">{tt.status ?? t.status ?? "-"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
