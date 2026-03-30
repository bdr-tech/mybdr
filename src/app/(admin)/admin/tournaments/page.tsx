import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { updateTournamentStatusAction } from "@/app/actions/admin-tournaments";
import { AdminTournamentsContent } from "./admin-tournaments-content";

export const dynamic = "force-dynamic";

// FR-062: 토너먼트 관리 (Admin)
// 서버 컴포넌트: 데이터 패칭만 담당하고, UI는 클라이언트에 위임
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

  // Date -> string 직렬화 (서버 -> 클라이언트 전달용)
  const serialized = tournaments.map((t) => ({
    id: t.id.toString(),
    name: t.name,
    format: t.format,
    status: t.status ?? "draft",
    startDate: t.startDate?.toISOString() ?? null,
    endDate: t.endDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    teamCount: t._count.tournamentTeams,
    matchCount: t._count.tournamentMatches,
    organizerName: t.users_tournaments_organizer_idTousers?.nickname ?? null,
    organizerEmail: t.users_tournaments_organizer_idTousers?.email ?? null,
  }));

  return (
    <div>
      <AdminPageHeader
        title="토너먼트 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="대회명 검색"
        searchDefaultValue={q ?? ""}
      />
      {/* 클라이언트 컴포넌트: 탭 필터 + 테이블 + 상세 모달 */}
      <AdminTournamentsContent
        tournaments={serialized}
        updateStatusAction={updateTournamentStatusAction}
      />
    </div>
  );
}
