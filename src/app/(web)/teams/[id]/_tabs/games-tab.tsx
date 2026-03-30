import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

interface GamesTabProps {
  teamId: bigint;
  accent: string;
}

export async function GamesTab({ teamId, accent }: GamesTabProps) {
  // 기존 쿼리 100% 유지
  const memberIds = await prisma.teamMember.findMany({
    where: { teamId, status: "active" },
    select: { userId: true },
  });
  const userIds = memberIds.map((m) => m.userId);

  const games = await prisma.games.findMany({
    where: { organizer_id: { in: userIds } },
    orderBy: { scheduled_at: "desc" },
    take: 30,
    select: {
      id: true,
      uuid: true,
      title: true,
      scheduled_at: true,
      status: true,
      game_type: true,
    },
  }).catch(() => []);

  const GAME_TYPE_LABEL: Record<number, string> = { 0: "픽업", 1: "게스트", 2: "팀대결" };
  const STATUS_LABEL: Record<number, string> = { 0: "임시", 1: "모집중", 2: "확정", 3: "완료", 4: "취소" };

  if (games.length === 0) {
    return (
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-10 text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--color-text-muted)] mb-2">sports_basketball</span>
        <p className="text-sm text-[var(--color-text-muted)]">경기 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
      <div className="divide-y divide-[var(--color-border-subtle)]">
        {games.map((g) => {
          const href = `/games/${g.uuid?.slice(0, 8) ?? g.id}`;
          const statusNum = g.status;
          const statusColor =
            statusNum === 3 ? "text-green-500 bg-green-500/10" :
            statusNum === 4 ? "text-red-500 bg-red-500/10" :
            statusNum === 1 ? `bg-[${accent}22]` :
            "text-[var(--color-text-muted)] bg-[var(--color-surface-high)]";

          return (
            <Link
              key={g.id.toString()}
              href={href}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--color-surface-bright)]"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* 경기 타입 아이콘 */}
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-[var(--color-surface-high)] text-sm font-bold text-[var(--color-text-secondary)]">
                  {GAME_TYPE_LABEL[g.game_type ?? 0]?.charAt(0) ?? "-"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{g.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {g.scheduled_at?.toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "Asia/Seoul",
                    }) ?? "-"}
                    {" · "}
                    {GAME_TYPE_LABEL[g.game_type ?? 0] ?? "-"}
                  </p>
                </div>
              </div>
              <span
                className={`ml-3 flex-shrink-0 rounded px-2 py-0.5 text-xs font-bold ${statusColor}`}
                style={statusNum === 1 ? { backgroundColor: `${accent}22`, color: accent } : undefined}
              >
                {STATUS_LABEL[g.status] ?? String(g.status)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
