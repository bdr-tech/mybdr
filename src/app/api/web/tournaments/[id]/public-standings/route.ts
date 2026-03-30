import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 대회 순위 탭 공개 API (인증 불필요)
 * GET /api/web/tournaments/[id]/public-standings
 *
 * 대회 상세 페이지에서 "순위" 탭 클릭 시 호출
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return apiError("Invalid tournament ID", 400);
  }

  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id },
    include: { team: { select: { name: true } } },
    orderBy: [{ wins: "desc" }, { losses: "asc" }],
  });

  // BigInt -> string 직렬화
  const serialized = teams.map((t) => ({
    id: t.id.toString(),
    teamName: t.team.name,
    wins: t.wins ?? 0,
    losses: t.losses ?? 0,
    draws: t.draws ?? 0,
    groupName: t.groupName,
  }));

  return apiSuccess({ teams: serialized });
}
