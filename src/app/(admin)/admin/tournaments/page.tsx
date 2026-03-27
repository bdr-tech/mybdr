import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import Link from "next/link";
import { updateTournamentStatusAction } from "@/app/actions/admin-tournaments";
// 공통 상수에서 상태/형식/뱃지/전환 매핑을 가져옴 (중복 제거)
import {
  TOURNAMENT_STATUS_LABEL as STATUS_LABEL,
  TOURNAMENT_STATUS_BADGE as STATUS_BADGE,
  TOURNAMENT_FORMAT_LABEL as FORMAT_LABEL,
  TOURNAMENT_STATUS_TRANSITIONS as TRANSITIONS,
} from "@/lib/constants/tournament-status";

export const dynamic = "force-dynamic";

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
      {/* 공통 헤더: 제목 + 부제 + 검색 통일 */}
      <AdminPageHeader
        title="토너먼트 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="대회명 검색"
        searchDefaultValue={q ?? ""}
      />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col />
              <col className="w-[120px]" />
              <col className="w-[95px]" />
              <col className="w-[115px]" />
              <col className="w-[245px]" />
              <col className="w-[100px]" />
            </colgroup>
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]">
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
                  <tr key={t.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-elevated)] transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/tournament-admin/tournaments/${t.id}`}
                        className="block truncate font-medium text-[var(--color-accent)] hover:underline"
                      >
                        {t.name}
                      </Link>
                      {t.startDate && (
                        <p className="text-xs text-[var(--color-text-muted)]">{t.startDate.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 truncate text-[var(--color-text-muted)]">
                      {organizer?.nickname ?? organizer?.email ?? "-"}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {FORMAT_LABEL[t.format ?? ""] ?? t.format ?? "-"}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
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
                              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-accent)]"
                            >
                              <option value="" disabled>변경</option>
                              {transitions.map((s) => (
                                <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="rounded-[10px] bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)]"
                            >
                              적용
                            </button>
                          </>
                        )}
                      </form>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-muted)]">
                      {t.createdAt.toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {tournaments.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-muted)]">등록된 토너먼트가 없습니다.</div>
        )}
      </Card>
    </div>
  );
}
