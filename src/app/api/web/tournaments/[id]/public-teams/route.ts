import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 대회 참가팀 탭 공개 API (인증 불필요)
 * GET /api/web/tournaments/[id]/public-teams
 *
 * 대회 상세 페이지에서 "참가팀" 탭 클릭 시 호출
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return apiError("Invalid tournament ID", 400);
  }

  const teamsWithPlayers = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id },
    include: {
      team: { select: { name: true, primaryColor: true } },
      players: {
        select: {
          id: true,
          jerseyNumber: true,
          position: true,
          users: { select: { nickname: true } },
        },
      },
    },
  });

  // BigInt -> string 직렬화
  const serialized = teamsWithPlayers.map((t) => ({
    id: t.id.toString(),
    teamName: t.team.name,
    primaryColor: t.team.primaryColor,
    groupName: t.groupName,
    players: t.players.map((p) => ({
      id: p.id.toString(),
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      nickname: p.users?.nickname ?? "선수",
    })),
  }));

  return apiSuccess({ teams: serialized });
}
