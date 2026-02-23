import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { updateTournamentStatusAction } from "@/app/actions/admin-tournaments";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "준비중",
  active: "활성",
  registration_open: "모집중",
  registration_closed: "접수마감",
  ongoing: "진행중",
  completed: "완료",
  cancelled: "취소",
};

const STATUS_BADGE: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
  draft: "default",
  active: "success",
  registration_open: "info",
  registration_closed: "warning",
  ongoing: "success",
  completed: "info",
  cancelled: "error",
};

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  hybrid: "혼합",
};

// 각 상태에서 전환 가능한 상태 목록
const TRANSITIONS: Record<string, string[]> = {
  draft: ["registration_open", "cancelled"],
  active: ["registration_open", "cancelled"],
  registration_open: ["registration_closed", "cancelled"],
  registration_closed: ["ongoing", "cancelled"],
  ongoing: ["completed", "cancelled"],
  completed: [],
  cancelled: ["draft"],
};

// FR-062: 토너먼트 관리 (Admin)
export default async function AdminTournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where = q
    ? { name: { contains: q, mode: "insensitive" as const } }
    : undefined;

  const [tournaments, totalCount] = await Promise.all([
    prisma.tournament.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        format: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        _count: { select: { tournamentTeams: true, tournamentMatches: true } },
        users_tournaments_organizer_idTousers: { select: { nickname: true, email: true } },
      },
    }),
    prisma.tournament.count({ where }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">토너먼트 관리</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            전체 <span className="font-semibold text-[#111827]">{totalCount}개</span>
          </p>
        </div>
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="대회명 검색"
            className="rounded-full border border-[#E8ECF0] bg-[#FFFFFF] px-4 py-2 text-sm outline-none focus:border-[#0066FF]"
          />
          <button type="submit" className="rounded-full bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white">
            검색
          </button>
        </form>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E8ECF0] bg-[#F5F7FA] text-[#6B7280]">
              <tr>
                <th className="px-5 py-4 font-medium">대회명</th>
                <th className="px-5 py-4 font-medium">주최자</th>
                <th className="px-5 py-4 font-medium">형식</th>
                <th className="px-5 py-4 font-medium">참가</th>
                <th className="px-5 py-4 font-medium">상태 변경</th>
                <th className="px-5 py-4 font-medium">생성일</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => {
                const status = t.status ?? "draft";
                const organizer = t.users_tournaments_organizer_idTousers;
                const transitions = TRANSITIONS[status] ?? [];

                return (
                  <tr key={t.id} className="border-b border-[#F1F5F9] hover:bg-[#EEF2FF] transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/tournament-admin/tournaments/${t.id}`}
                        className="font-medium text-[#0066FF] hover:underline"
                      >
                        {t.name}
                      </Link>
                      {t.startDate && (
                        <p className="text-xs text-[#9CA3AF]">{t.startDate.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#6B7280]">
                      {organizer?.nickname ?? organizer?.email ?? "-"}
                    </td>
                    <td className="px-5 py-3 text-[#6B7280]">
                      {FORMAT_LABEL[t.format ?? ""] ?? t.format ?? "-"}
                    </td>
                    <td className="px-5 py-3 text-[#6B7280]">
                      {t._count.tournamentTeams}팀 · {t._count.tournamentMatches}경기
                    </td>
                    <td className="px-5 py-3">
                      <form action={updateTournamentStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="tournament_id" value={t.id} />
                        <Badge variant={STATUS_BADGE[status]}>{STATUS_LABEL[status] ?? status}</Badge>
                        {transitions.length > 0 && (
                          <>
                            <select
                              name="status"
                              defaultValue=""
                              className="rounded-full border border-[#E8ECF0] bg-[#FFFFFF] px-3 py-1 text-xs text-[#374151] outline-none focus:border-[#0066FF]"
                            >
                              <option value="" disabled>변경</option>
                              {transitions.map((s) => (
                                <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="rounded-full bg-[#0066FF] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0052CC]"
                            >
                              적용
                            </button>
                          </>
                        )}
                      </form>
                    </td>
                    <td className="px-5 py-3 text-[#9CA3AF]">
                      {t.createdAt.toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {tournaments.length === 0 && (
          <div className="p-8 text-center text-[#6B7280]">등록된 토너먼트가 없습니다.</div>
        )}
      </Card>
    </div>
  );
}
