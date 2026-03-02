import { prisma } from "@/lib/db/prisma";

interface GamesTabProps {
  teamId: bigint;
  accent: string;
}

export async function GamesTab({ teamId, accent }: GamesTabProps) {
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
      <div className="rounded-[16px] bg-white px-5 py-10 text-center">
        <p className="text-sm text-[#9CA3AF]">경기 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] bg-white p-5">
      <div className="space-y-2">
        {games.map((g) => (
          <div
            key={g.id.toString()}
            className="flex items-center justify-between rounded-[12px] bg-[#EEF2FF] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#111827]">{g.title}</p>
              <p className="text-xs text-[#9CA3AF]">
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
            <span
              className="ml-3 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${accent}22`, color: accent }}
            >
              {STATUS_LABEL[g.status] ?? String(g.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
