import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

// 인증 없는 공개 엔드포인트 — 라이브 박스스코어
// playerStats(종료 후 집계) + match_events(진행 중 실시간) 모두 지원
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = getClientIp(req);
  const rl = await checkRateLimit(`live-detail:${ip}`, RATE_LIMITS.subdomain);
  if (!rl.allowed) {
    return apiError("Too many requests", 429);
  }

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
            players: {
              include: { users: { select: { name: true, nickname: true } } },
            },
          },
        },
        awayTeam: {
          include: {
            team: { select: { name: true, primaryColor: true } },
            players: {
              include: { users: { select: { name: true, nickname: true } } },
            },
          },
        },
        tournament: { select: { name: true } },
        playerStats: {
          include: {
            tournamentTeamPlayer: {
              include: { users: { select: { name: true, nickname: true } } },
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
    const isLive = match.status === "in_progress" || match.status === "live";

    let homePlayers: PlayerRow[];
    let awayPlayers: PlayerRow[];

    if (isLive || match.playerStats.length === 0) {
      // 진행 중이거나 playerStats가 없으면 match_events에서 실시간 집계
      const events = await prisma.match_events.findMany({
        where: { matchId: BigInt(matchId), undone: false },
        select: {
          eventType: true,
          value: true,
          teamId: true,
          playerId: true,
        },
      });

      // 선수 목록 구성 (roster)
      const allPlayers = [
        ...(match.homeTeam?.players ?? []).map((p) => ({
          id: Number(p.id),
          jerseyNumber: p.jerseyNumber,
          name: p.users?.nickname ?? p.users?.name ?? "-",
          teamId: Number(p.tournamentTeamId),
        })),
        ...(match.awayTeam?.players ?? []).map((p) => ({
          id: Number(p.id),
          jerseyNumber: p.jerseyNumber,
          name: p.users?.nickname ?? p.users?.name ?? "-",
          teamId: Number(p.tournamentTeamId),
        })),
      ];

      // 이벤트 기반 스탯 집계
      const statsMap = new Map<number, PlayerRow>();
      for (const p of allPlayers) {
        statsMap.set(p.id, {
          id: p.id,
          jerseyNumber: p.jerseyNumber,
          name: p.name,
          teamId: p.teamId,
          min: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
          oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fouls: 0,
        });
      }

      for (const e of events) {
        if (!e.playerId) continue;
        const pid = Number(e.playerId);
        const stat = statsMap.get(pid);
        if (!stat) continue;

        const val = e.value ?? 0;
        switch (e.eventType) {
          case "2pt":
            stat.pts += val;
            stat.fgm += 1;
            stat.fga += 1;
            break;
          case "3pt":
            stat.pts += val;
            stat.fgm += 1;
            stat.fga += 1;
            stat.tpm += 1;
            stat.tpa += 1;
            break;
          case "1pt":
            stat.pts += val;
            stat.ftm += 1;
            stat.fta += 1;
            break;
          case "rebound_off":
            stat.oreb += 1;
            stat.reb += 1;
            break;
          case "rebound_def":
            stat.dreb += 1;
            stat.reb += 1;
            break;
          case "assist":
            stat.ast += 1;
            break;
          case "steal":
            stat.stl += 1;
            break;
          case "block":
            stat.blk += 1;
            break;
          case "turnover":
            stat.to += 1;
            break;
          case "foul_personal":
          case "foul_technical":
            stat.fouls += 1;
            break;
        }
      }

      const allStats = Array.from(statsMap.values()).sort((a, b) => b.pts - a.pts);
      homePlayers = allStats.filter((s) => s.teamId === Number(homeTeamId));
      awayPlayers = allStats.filter((s) => s.teamId === Number(awayTeamId));
    } else {
      // 종료된 경기 — playerStats 테이블 사용
      const toPlayerRow = (stat: (typeof match.playerStats)[number]): PlayerRow => {
        const player = stat.tournamentTeamPlayer;
        const user = player.users;
        return {
          id: Number(stat.id),
          jerseyNumber: player.jerseyNumber,
          name: user?.nickname ?? user?.name ?? "-",
          teamId: Number(player.tournamentTeamId),
          min: stat.minutesPlayed ?? 0,
          pts: stat.points ?? 0,
          fgm: stat.fieldGoalsMade ?? 0,
          fga: stat.fieldGoalsAttempted ?? 0,
          tpm: stat.threePointersMade ?? 0,
          tpa: stat.threePointersAttempted ?? 0,
          ftm: stat.freeThrowsMade ?? 0,
          fta: stat.freeThrowsAttempted ?? 0,
          oreb: stat.offensive_rebounds ?? 0,
          dreb: stat.defensive_rebounds ?? 0,
          reb: stat.total_rebounds ?? 0,
          ast: stat.assists ?? 0,
          stl: stat.steals ?? 0,
          blk: stat.blocks ?? 0,
          to: stat.turnovers ?? 0,
          fouls: stat.personal_fouls ?? 0,
        };
      };

      homePlayers = match.playerStats
        .filter((s) => s.tournamentTeamPlayer.tournamentTeamId === homeTeamId)
        .map(toPlayerRow);
      awayPlayers = match.playerStats
        .filter((s) => s.tournamentTeamPlayer.tournamentTeamId === awayTeamId)
        .map(toPlayerRow);
    }

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

interface PlayerRow {
  id: number;
  jerseyNumber: number | null;
  name: string;
  teamId: number;
  min: number;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fouls: number;
}
