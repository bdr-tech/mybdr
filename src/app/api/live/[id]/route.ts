import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

// 인증 없는 공개 엔드포인트 — 팀장 QR 스캔용 박스스코어
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const matchId = Number(id);
  if (isNaN(matchId)) {
    return apiError("Invalid match ID", 400);
  }

  try {
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: BigInt(matchId) },
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
        tournament: {
          select: { name: true },
        },
        playerStats: {
          include: {
            tournamentTeamPlayer: {
              include: {
                users: { select: { name: true, nickname: true } },
              },
            },
          },
          orderBy: { points: "desc" },
        },
      },
    });

    if (!match) {
      return apiError("Match not found", 404);
    }

    const homeTeamId = match.homeTeamId;
    const awayTeamId = match.awayTeamId;

    const toPlayerRow = (stat: (typeof match.playerStats)[number]) => {
      const player = stat.tournamentTeamPlayer;
      const user = player.users;
      return {
        id: Number(stat.id),
        jerseyNumber: player.jerseyNumber,
        name: user.nickname ?? user.name ?? "-",
        teamId: Number(player.tournamentTeamId),
        pts: stat.points ?? 0,
        reb: stat.total_rebounds ?? 0,
        ast: stat.assists ?? 0,
        stl: stat.steals ?? 0,
        blk: stat.blocks ?? 0,
        to: stat.turnovers ?? 0,
        fouls: stat.personal_fouls ?? 0,
        fgm: stat.fieldGoalsMade ?? 0,
        fga: stat.fieldGoalsAttempted ?? 0,
        tpm: stat.threePointersMade ?? 0,
        tpa: stat.threePointersAttempted ?? 0,
        ftm: stat.freeThrowsMade ?? 0,
        fta: stat.freeThrowsAttempted ?? 0,
      };
    };

    const homePlayers = match.playerStats
      .filter((s) => s.tournamentTeamPlayer.tournamentTeamId === homeTeamId)
      .map(toPlayerRow);

    const awayPlayers = match.playerStats
      .filter((s) => s.tournamentTeamPlayer.tournamentTeamId === awayTeamId)
      .map(toPlayerRow);

    const quarterScores = match.quarterScores as {
      home: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
      away: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
    } | null;

    return apiSuccess({
      match: {
        id: Number(match.id),
        status: match.status ?? "scheduled",
        homeScore: match.homeScore ?? 0,
        awayScore: match.awayScore ?? 0,
        roundName: match.roundName,
        quarterScores,
        tournamentName: match.tournament?.name ?? "",
        homeTeam: {
          id: Number(match.homeTeam?.id ?? 0),
          name: match.homeTeam?.team?.name ?? "홈",
          color: match.homeTeam?.team?.primaryColor ?? "#F97316",
        },
        awayTeam: {
          id: Number(match.awayTeam?.id ?? 0),
          name: match.awayTeam?.team?.name ?? "원정",
          color: match.awayTeam?.team?.primaryColor ?? "#10B981",
        },
        homePlayers,
        awayPlayers,
        updatedAt: match.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[live/id] error:", err);
    return apiError("Server error", 500);
  }
}
