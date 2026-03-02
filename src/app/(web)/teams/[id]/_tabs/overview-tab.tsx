import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

interface OverviewTabProps {
  teamId: bigint;
  accent: string;
}

export async function OverviewTab({ teamId, accent }: OverviewTabProps) {
  // 최근 경기 — 팀 멤버들이 주최한 일반 경기
  const memberIds = await prisma.teamMember.findMany({
    where: { teamId, status: "active" },
    select: { userId: true },
  });
  const userIds = memberIds.map((m) => m.userId);

  const recentGames = await prisma.games.findMany({
    where: { organizer_id: { in: userIds } },
    orderBy: { scheduled_at: "desc" },
    take: 5,
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

  return (
    <div className="space-y-4">
      {recentGames.length > 0 && (
        <div className="rounded-[16px] bg-white p-5">
          <h3 className="mb-3 font-semibold text-[#111827]">최근 경기</h3>
          <div className="space-y-2">
            {recentGames.map((g) => {
              const href = `/games/${g.uuid?.slice(0, 8) ?? g.id}`;
              return (
                <Link
                  key={g.id.toString()}
                  href={href}
                  className="flex items-center justify-between rounded-[12px] bg-[#EEF2FF] px-4 py-3 transition-colors hover:bg-[#E2E8F0]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#111827]">{g.title}</p>
                    {g.scheduled_at && (
                      <p className="text-xs text-[#9CA3AF]">
                        {g.scheduled_at.toLocaleDateString("ko-KR", { month: "long", day: "numeric", timeZone: "Asia/Seoul" })}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex items-center gap-2 text-xs">
                    <span className="text-[#9CA3AF]">{GAME_TYPE_LABEL[g.game_type ?? 0] ?? "-"}</span>
                    <span
                      className="rounded-full px-2 py-0.5 font-medium"
                      style={{ backgroundColor: `${accent}22`, color: accent }}
                    >
                      {STATUS_LABEL[g.status] ?? String(g.status)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {recentGames.length === 0 && (
        <div className="rounded-[16px] bg-white px-5 py-10 text-center">
          <p className="text-sm text-[#9CA3AF]">경기 기록이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
