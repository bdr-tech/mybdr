import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { updateTeamStatusAction } from "@/app/actions/admin-teams";
import { AdminTeamsContent } from "./admin-teams-content";

export const dynamic = "force-dynamic";

// 팀 관리 — 서버 컴포넌트: 데이터 패칭만 담당
export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { city: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [teams, totalCount] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        city: true,
        members_count: true,
        wins: true,
        losses: true,
        draws: true,
        status: true,
        createdAt: true,
        users_teams_captain_idTousers: {
          select: { nickname: true, email: true },
        },
      },
    }),
    prisma.team.count({ where }),
  ]);

  // 직렬화
  const serialized = teams.map((t) => ({
    id: t.id.toString(),
    name: t.name,
    city: t.city,
    membersCount: t.members_count ?? 0,
    wins: t.wins ?? 0,
    losses: t.losses ?? 0,
    draws: t.draws ?? 0,
    status: t.status ?? "active",
    createdAt: t.createdAt.toISOString(),
    captainName: t.users_teams_captain_idTousers?.nickname ?? null,
    captainEmail: t.users_teams_captain_idTousers?.email ?? null,
  }));

  return (
    <div>
      <AdminPageHeader
        title="팀 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="팀명, 도시 검색"
        searchDefaultValue={q ?? ""}
      />
      <AdminTeamsContent
        teams={serialized}
        updateStatusAction={updateTeamStatusAction}
      />
    </div>
  );
}
