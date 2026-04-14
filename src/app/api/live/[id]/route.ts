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
    // BUG-01 fix: playerStats가 존재하면(bdr_stat sync 완료) 경기 상태 무관하게 사용.
    // playerStats 없을 때만 match_events 폴백으로 실시간 집계.
    const hasPlayerStats = match.playerStats.length > 0;

    let homePlayers: PlayerRow[];
    let awayPlayers: PlayerRow[];

    if (!hasPlayerStats) {
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
      // 0414: role='player' + is_active !== false 인 선수만 박스스코어 대상
      // (감독/코치/매니저는 제외)
      const filterRoster = (p: { role?: string | null; is_active?: boolean | null }) =>
        (p.role ?? "player") === "player" && p.is_active !== false;

      const allPlayers = [
        ...(match.homeTeam?.players ?? []).filter(filterRoster).map((p) => ({
          id: Number(p.id),
          jerseyNumber: p.jerseyNumber,
          name: p.users?.nickname ?? p.users?.name ?? p.player_name ?? `#${p.jerseyNumber ?? "-"}`,
          teamId: Number(p.tournamentTeamId),
        })),
        ...(match.awayTeam?.players ?? []).filter(filterRoster).map((p) => ({
          id: Number(p.id),
          jerseyNumber: p.jerseyNumber,
          name: p.users?.nickname ?? p.users?.name ?? p.player_name ?? `#${p.jerseyNumber ?? "-"}`,
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
          min: 0, min_seconds: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
          oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
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
          case "made_shot":
            // generic made shot — value carries points
            stat.pts += val;
            stat.fgm += 1;
            stat.fga += 1;
            if (val === 3) { stat.tpm += 1; stat.tpa += 1; }
            if (val === 1) { stat.ftm += 1; stat.fta += 1; stat.fgm -= 1; stat.fga -= 1; }
            break;
          case "missed_shot":
            // generic missed shot
            stat.fga += 1;
            if (val === 3) { stat.tpa += 1; }
            if (val === 1) { stat.fta += 1; stat.fga -= 1; }
            break;
          case "2pt_miss":
            stat.fga += 1;
            break;
          case "3pt_miss":
            stat.fga += 1;
            stat.tpa += 1;
            break;
          case "1pt_miss":
            stat.fta += 1;
            break;
          case "foul_personal":
          case "foul_technical":
            stat.fouls += 1;
            break;
        }
      }

      // 진행 중 경기에서도 match_player_stats의 quarter_stats_json에서 MIN 보강 (dev)
      for (const stat of match.playerStats) {
        const pid = Number(stat.tournamentTeamPlayerId);
        const row = statsMap.get(pid);
        if (!row) continue;
        // 1) quarterStatsJson에서 초 합산 (2인 모드)
        let resolved = false;
        if (stat.quarterStatsJson) {
          try {
            const parsed = JSON.parse(stat.quarterStatsJson) as Record<string, { min?: number; pm?: number }>;
            const total = Object.values(parsed).reduce((sum, q) => sum + (q.min ?? 0), 0);
            if (total > 0) {
              row.min_seconds = total;
              row.min = Math.round(total / 60);
              resolved = true;
            }
          } catch {}
        }
        // 2) fallback: minutesPlayed (초 단위)
        if (!resolved && stat.minutesPlayed && stat.minutesPlayed > 0) {
          row.min_seconds = stat.minutesPlayed;
          row.min = Math.round(stat.minutesPlayed / 60);
        }
        // +/- 보강
        if (stat.plusMinus != null) {
          row.plus_minus = stat.plusMinus;
        }
      }

      // 0414: DNP 플래그 부여 (MIN 보강 후에 판정해야 정확)
      for (const stat of statsMap.values()) {
        stat.dnp = isDnpRow(stat);
      }

      const allStats = Array.from(statsMap.values()).sort((a, b) => {
        // DNP는 항상 마지막. 그 외는 득점 내림차순.
        if ((a.dnp ?? false) !== (b.dnp ?? false)) {
          return (a.dnp ?? false) ? 1 : -1;
        }
        return b.pts - a.pts;
      });
      homePlayers = allStats.filter((s) => s.teamId === Number(homeTeamId));
      awayPlayers = allStats.filter((s) => s.teamId === Number(awayTeamId));
    } else {
      // 종료된 경기 — playerStats 테이블 사용
      // quarter_stats_json에서 초 단위 MIN 합계 계산 (없으면 minutesPlayed * 60 fallback)
      const getSecondsPlayed = (stat: (typeof match.playerStats)[number]): number => {
        // 1) quarterStatsJson에서 초 합산 (2인 모드)
        if (stat.quarterStatsJson) {
          try {
            const parsed = JSON.parse(stat.quarterStatsJson) as Record<string, { min?: number; pm?: number }>;
            const total = Object.values(parsed).reduce((sum, q) => sum + (q.min ?? 0), 0);
            if (total > 0) return total;
          } catch {}
        }
        // 2) fallback: minutesPlayed (초 단위)
        return stat.minutesPlayed ?? 0;
      };

      const toPlayerRow = (stat: (typeof match.playerStats)[number]): PlayerRow => {
        const player = stat.tournamentTeamPlayer;
        const user = player.users;
        const row: PlayerRow = {
          id: Number(stat.id),
          jerseyNumber: player.jerseyNumber,
          name: user?.nickname ?? user?.name ?? player.player_name ?? `#${player.jerseyNumber ?? "-"}`,
          teamId: Number(player.tournamentTeamId),
          min: stat.minutesPlayed ?? 0,
          min_seconds: getSecondsPlayed(stat),
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
          plus_minus: stat.plusMinus ?? 0,
        };
        row.dnp = isDnpRow(row);
        return row;
      };

      // 0414: role='player' + is_active !== false 필터 (감독/코치 제외)
      const isPlayerRole = (stat: (typeof match.playerStats)[number]) => {
        const p = stat.tournamentTeamPlayer;
        return (p.role ?? "player") === "player" && p.is_active !== false;
      };

      // DNP는 항상 마지막, 그 외는 득점 내림차순
      const sortWithDnp = (rows: PlayerRow[]) =>
        rows.sort((a, b) => {
          if ((a.dnp ?? false) !== (b.dnp ?? false)) {
            return (a.dnp ?? false) ? 1 : -1;
          }
          return b.pts - a.pts;
        });

      homePlayers = sortWithDnp(
        match.playerStats
          .filter((s) => s.tournamentTeamPlayer.tournamentTeamId === homeTeamId)
          .filter(isPlayerRole)
          .map(toPlayerRow)
      );
      awayPlayers = sortWithDnp(
        match.playerStats
          .filter((s) => s.tournamentTeamPlayer.tournamentTeamId === awayTeamId)
          .filter(isPlayerRole)
          .map(toPlayerRow)
      );
    }

    // DB quarterScores 파싱 — 앱 포맷({"Q1":{"home":3,"away":3}}) 또는 서버 포맷({"home":{"q1":3},"away":{"q1":3}})
    type QS = { home: { q1: number; q2: number; q3: number; q4: number; ot: number[] }; away: { q1: number; q2: number; q3: number; q4: number; ot: number[] } };
    let quarterScores: QS | null = null;
    const rawQS = match.quarterScores as Record<string, unknown> | null;

    if (rawQS?.home && rawQS?.away) {
      // 서버 포맷 그대로 사용
      quarterScores = rawQS as unknown as QS;
    } else if (rawQS?.Q1 || rawQS?.Q2 || rawQS?.Q3 || rawQS?.Q4) {
      // 앱 포맷 → 서버 포맷 변환
      const get = (key: string, side: string) => ((rawQS[key] as Record<string, number>)?.[side]) ?? 0;
      const otKeys = Object.keys(rawQS).filter(k => k.startsWith("OT")).sort();
      quarterScores = {
        home: { q1: get("Q1","home"), q2: get("Q2","home"), q3: get("Q3","home"), q4: get("Q4","home"), ot: otKeys.map(k => get(k,"home")) },
        away: { q1: get("Q1","away"), q2: get("Q2","away"), q3: get("Q3","away"), q4: get("Q4","away"), ot: otKeys.map(k => get(k,"away")) },
      };
    }

    // DB에 유효한 쿼터 점수가 없으면 PBP 기반으로 계산
    if (!quarterScores) {
      const pbpForScores = await prisma.play_by_plays.findMany({
        where: { tournament_match_id: BigInt(matchId), is_made: true, points_scored: { gt: 0 } },
        select: { quarter: true, points_scored: true, tournament_team_id: true },
      });
      const homeId = Number(homeTeamId);
      const qMap: Record<number, { home: number; away: number }> = {};
      for (const p of pbpForScores) {
        const q = p.quarter ?? 1;
        if (!qMap[q]) qMap[q] = { home: 0, away: 0 };
        if (Number(p.tournament_team_id) === homeId) {
          qMap[q].home += p.points_scored ?? 0;
        } else {
          qMap[q].away += p.points_scored ?? 0;
        }
      }
      quarterScores = {
        home: { q1: qMap[1]?.home ?? 0, q2: qMap[2]?.home ?? 0, q3: qMap[3]?.home ?? 0, q4: qMap[4]?.home ?? 0, ot: [] },
        away: { q1: qMap[1]?.away ?? 0, q2: qMap[2]?.away ?? 0, q3: qMap[3]?.away ?? 0, q4: qMap[4]?.away ?? 0, ot: [] },
      };
      // OT 처리
      for (const q of Object.keys(qMap).map(Number).filter(n => n > 4).sort()) {
        quarterScores.home.ot.push(qMap[q].home);
        quarterScores.away.ot.push(qMap[q].away);
      }
    }

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
        playByPlays: [],
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
  min_seconds?: number;
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
  plus_minus?: number;
  // 0414: DNP(Did Not Play) — 등록됐으나 출전 0 + 스탯 0
  dnp?: boolean;
}

/// 선수가 "코트에서 뛴 기록이 전혀 없음" 여부 (DNP 판정)
function isDnpRow(p: {
  min_seconds?: number;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fouls: number;
}): boolean {
  return (
    (p.min_seconds ?? 0) === 0 &&
    p.pts === 0 &&
    p.fgm === 0 && p.fga === 0 &&
    p.tpm === 0 && p.tpa === 0 &&
    p.ftm === 0 && p.fta === 0 &&
    p.oreb === 0 && p.dreb === 0 &&
    p.ast === 0 && p.stl === 0 && p.blk === 0 &&
    p.to === 0 && p.fouls === 0
  );
}
