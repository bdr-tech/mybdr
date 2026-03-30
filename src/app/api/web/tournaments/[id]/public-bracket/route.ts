import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { buildRoundGroups } from "@/lib/tournaments/bracket-builder";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 대회 대진표 탭 공개 API (인증 불필요)
 * GET /api/web/tournaments/[id]/public-bracket
 *
 * 대회 상세 페이지에서 "대진표" 탭 클릭 시 호출
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return apiError("Invalid tournament ID", 400);
  }

  // 대회 기본 정보 (대진표 헤더용)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { name: true, venue_name: true, city: true, entry_fee: true },
  });

  if (!tournament) {
    return apiError("Tournament not found", 404);
  }

  const [matches, tournamentTeams] = await Promise.all([
    // 매치 데이터
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }],
      include: {
        homeTeam: {
          include: {
            team: { select: { name: true, primaryColor: true } },
          },
        },
        awayTeam: {
          include: {
            team: { select: { name: true, primaryColor: true } },
          },
        },
      },
    }),
    // 참가팀
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      include: {
        team: { select: { name: true } },
      },
      orderBy: [{ wins: "desc" }, { losses: "asc" }],
    }),
  ]);

  const liveMatchCount = matches.filter((m) => m.status === "in_progress").length;

  const bracketOnlyMatches = matches.filter(
    (m) => m.round_number != null && m.bracket_position != null
  );

  const finalsDate = bracketOnlyMatches.length > 0
    ? (() => {
        const maxRound = Math.max(...bracketOnlyMatches.map((m) => m.round_number!));
        const finalMatch = bracketOnlyMatches.find((m) => m.round_number === maxRound);
        return finalMatch?.scheduledAt?.toISOString() ?? null;
      })()
    : null;

  // 그룹 팀 데이터
  const groupTeams = tournamentTeams
    .filter((t) => t.groupName != null)
    .map((t) => ({
      id: t.id.toString(),
      teamName: t.team.name,
      groupName: t.groupName,
      wins: t.wins ?? 0,
      losses: t.losses ?? 0,
      draws: t.draws ?? 0,
      pointsFor: t.points_for ?? 0,
      pointsAgainst: t.points_against ?? 0,
      pointDifference: t.point_difference ?? 0,
    }));

  // 라운드 그룹 빌드
  const rounds = bracketOnlyMatches.length > 0 ? buildRoundGroups(bracketOnlyMatches) : [];

  return apiSuccess({
    tournamentName: tournament.name,
    totalTeams: tournamentTeams.length,
    liveMatchCount,
    finalsDate,
    groupTeams,
    rounds,
    venueName: tournament.venue_name,
    city: tournament.city,
    entryFee: tournament.entry_fee ? Number(tournament.entry_fee) : null,
  });
}
