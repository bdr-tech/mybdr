import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { updateGameStatusAction } from "@/app/actions/admin-games";
import { AdminGamesContent } from "./admin-games-content";

export const dynamic = "force-dynamic";

// 경기 관리 — 서버 컴포넌트: 데이터 패칭만 담당
export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { venue_name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [games, totalCount] = await Promise.all([
    prisma.games.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        game_type: true,
        venue_name: true,
        city: true,
        scheduled_at: true,
        current_participants: true,
        max_participants: true,
        status: true,
        created_at: true,
        users: { select: { nickname: true, email: true } },
      },
    }),
    prisma.games.count({ where }),
  ]);

  // 직렬화: BigInt/Date -> string
  const serialized = games.map((g) => ({
    id: String(g.id),
    title: g.title,
    gameType: g.game_type,
    venueName: g.venue_name,
    city: g.city,
    scheduledAt: g.scheduled_at.toISOString(),
    currentParticipants: g.current_participants,
    maxParticipants: g.max_participants,
    status: g.status ?? 1,
    createdAt: g.created_at.toISOString(),
    hostName: g.users?.nickname ?? null,
    hostEmail: g.users?.email ?? "",
  }));

  return (
    <div>
      <AdminPageHeader
        title="경기 관리"
        subtitle={`전체 ${totalCount}개`}
        searchPlaceholder="제목, 장소 검색"
        searchDefaultValue={q ?? ""}
      />
      <AdminGamesContent
        games={serialized}
        updateStatusAction={updateGameStatusAction}
      />
    </div>
  );
}
