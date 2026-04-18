import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

// 인증 없는 공개 엔드포인트 — 라이브 박스스코어
// playerStats(종료 후 합계) + play_by_plays(쿼터별 상세 집계)
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
            // 팀 로고 URL 추가 (티빙 스타일 스코어카드 — 큰 원형 로고 표시용)
            // tournament_teams에는 logo_url 컬럼이 없으므로 teams.logoUrl만 사용
            team: { select: { name: true, primaryColor: true, logoUrl: true } },
            players: {
              include: { users: { select: { name: true, nickname: true } } },
            },
          },
        },
        awayTeam: {
          include: {
            team: { select: { name: true, primaryColor: true, logoUrl: true } },
            players: {
              include: { users: { select: { name: true, nickname: true } } },
            },
          },
        },
        // 경기장명 fallback용으로 tournament.venue_name 같이 가져옴
        tournament: { select: { name: true, venue_name: true } },
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
    // playerStats 없을 때만 play_by_plays 로 실시간 집계.
    const hasPlayerStats = match.playerStats.length > 0;

    // 2026-04-17: 쿼터별 집계 소스를 match_events → play_by_plays 로 전환.
    // 배경: 현재 Flutter recording/ 화면은 /api/v1/tournaments/:id/matches/sync 로 play_by_plays만 채운다.
    //       match_events 는 레거시 recorder/ 화면(/api/v1/matches/:id/events/batch) 전용 — 현재 앱은 사용 안 함.
    //       match 92/98~104 전부 match_events=0건으로 확인됨. play_by_plays 가 단일 진실 원천.
    // 이 한 번의 쿼리에서 얻은 allPbps 로 (a) 선수별 쿼터 스탯, (b) 팀 쿼터 점수, (c) MIN fallback 모두 계산한다.
    // 2026-04-18: game_clock_seconds, sub_in/out 추가 — MIN 추정 + DNP 완화 판정에 사용.
    const allPbps = await prisma.play_by_plays.findMany({
      where: { tournament_match_id: BigInt(matchId) },
      select: {
        tournament_team_player_id: true,
        tournament_team_id: true,
        quarter: true,
        action_type: true,
        action_subtype: true,
        is_made: true,
        points_scored: true,
        game_clock_seconds: true,
        sub_in_player_id: true,
        sub_out_player_id: true,
      },
    });

    // 쿼터별 상세 스탯 존재 여부 — PBP 가 1건이라도 있으면 true.
    const hasQuarterEventDetail = allPbps.length > 0;

    // 2026-04-18: PBP 에 등장한 선수 ID 집합 — DNP 완화 판정용.
    // 본인 액션(tournament_team_player_id) 또는 교체 투입(sub_in_player_id) 으로 코트에 나타났던 선수 포함.
    const playedPlayerIds = new Set<number>();
    for (const p of allPbps) {
      if (p.tournament_team_player_id) playedPlayerIds.add(Number(p.tournament_team_player_id));
      if (p.sub_in_player_id) playedPlayerIds.add(Number(p.sub_in_player_id));
    }


    // 쿼터별 스탯 집계 헬퍼 — playerId → { "1": {...}, "2": {...}, ... }
    // min/min_seconds/plus_minus 는 PBP 만으로 산출 불가 → 0 고정. quarterStatsJson 에서 나중에 주입.
    type QuarterStatEntry = {
      min: number; min_seconds: number; pts: number;
      fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number;
      oreb: number; dreb: number; reb: number;
      ast: number; stl: number; blk: number; to: number; fouls: number; plus_minus: number;
    };
    const emptyQStat = (): QuarterStatEntry => ({
      min: 0, min_seconds: 0, pts: 0,
      fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
      oreb: 0, dreb: 0, reb: 0,
      ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
    });

    // playerId별 쿼터 집계 Map 구성 — Flutter action_type 매핑
    // - 'shot' + subtype "2pt"/"3pt" + is_made
    // - 'missed_shot' (2인 모드)
    // - 'free_throw' + is_made
    // - 'rebound' + subtype "offensive"/"defensive"
    // - 'assist' / 'steal' / 'block' / 'turnover' / 'foul'
    // 제외: 'team_foul', 'timeout', 'substitution', 'jump_ball'
    const quarterStatsByPlayer = new Map<number, Record<string, QuarterStatEntry>>();
    for (const p of allPbps) {
      if (!p.tournament_team_player_id) continue;
      const pid = Number(p.tournament_team_player_id);
      const q = String(p.quarter ?? 1);
      let byQ = quarterStatsByPlayer.get(pid);
      if (!byQ) {
        byQ = {};
        quarterStatsByPlayer.set(pid, byQ);
      }
      if (!byQ[q]) byQ[q] = emptyQStat();
      const s = byQ[q];
      const isMade = p.is_made === true;
      const pts = p.points_scored ?? 0;
      const sub = p.action_subtype ?? "";
      const isThree = sub === "3pt" || pts === 3;

      switch (p.action_type) {
        case "shot":
          // 1인 모드 (game_recording_screen): is_made 로 성공/실패 구분
          if (isMade) {
            s.pts += pts;
            s.fgm += 1; s.fga += 1;
            if (isThree) { s.tpm += 1; s.tpa += 1; }
          } else {
            s.fga += 1;
            if (isThree) { s.tpa += 1; }
          }
          break;
        case "made_shot":
          // 2인 모드 (duo_recording_screen): 성공 슛은 made_shot 으로 기록됨
          s.pts += pts;
          s.fgm += 1; s.fga += 1;
          if (isThree) { s.tpm += 1; s.tpa += 1; }
          break;
        case "missed_shot":
          // 2인 모드: 실패 슛은 missed_shot
          s.fga += 1;
          if (isThree) { s.tpa += 1; }
          break;
        case "free_throw":
          s.fta += 1;
          if (isMade) { s.ftm += 1; s.pts += 1; }
          break;
        case "rebound":
          s.reb += 1;
          if (sub === "offensive") s.oreb += 1;
          else if (sub === "defensive") s.dreb += 1;
          break;
        case "assist":  s.ast += 1; break;
        case "steal":   s.stl += 1; break;
        case "block":   s.blk += 1; break;
        case "turnover":s.to  += 1; break;
        case "foul":    s.fouls += 1; break;
        // team_foul / timeout / substitution / jump_ball: 선수 개인 스탯 집계 제외
      }
    }

    let homePlayers: PlayerRow[];
    let awayPlayers: PlayerRow[];

    if (!hasPlayerStats) {
      // 진행 중이거나 playerStats가 없으면 play_by_plays 에서 실시간 집계
      // 선수 목록 구성 (roster)
      // 0414: role='player' + is_active !== false 인 선수만 박스스코어 대상 (감독/코치/매니저 제외)
      const filterRoster = (p: { role?: string | null; is_active?: boolean | null }) =>
        (p.role ?? "player") === "player" && p.is_active !== false;

      // 2026-04-15: roster에 isStarter 포함 (TournamentTeamPlayer.isStarter fallback 용)
      const allPlayers = [
        ...(match.homeTeam?.players ?? []).filter(filterRoster).map((p) => ({
          id: Number(p.id),
          jerseyNumber: p.jerseyNumber,
          name: p.users?.nickname ?? p.users?.name ?? p.player_name ?? `#${p.jerseyNumber ?? "-"}`,
          teamId: Number(p.tournamentTeamId),
          isStarter: p.isStarter ?? false,
        })),
        ...(match.awayTeam?.players ?? []).filter(filterRoster).map((p) => ({
          id: Number(p.id),
          jerseyNumber: p.jerseyNumber,
          name: p.users?.nickname ?? p.users?.name ?? p.player_name ?? `#${p.jerseyNumber ?? "-"}`,
          teamId: Number(p.tournamentTeamId),
          isStarter: p.isStarter ?? false,
        })),
      ];

      const statsMap = new Map<number, PlayerRow>();
      for (const p of allPlayers) {
        statsMap.set(p.id, {
          id: p.id,
          jerseyNumber: p.jerseyNumber,
          name: p.name,
          teamId: p.teamId,
          min: 0, min_seconds: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
          oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
          isStarter: p.isStarter,
        });
      }

      // 2026-04-17: PBP → 전체 합계 스탯 집계 (쿼터별 집계와 동일한 매핑 규칙)
      for (const p of allPbps) {
        if (!p.tournament_team_player_id) continue;
        const pid = Number(p.tournament_team_player_id);
        const stat = statsMap.get(pid);
        if (!stat) continue;

        const isMade = p.is_made === true;
        const pts = p.points_scored ?? 0;
        const sub = p.action_subtype ?? "";
        const isThree = sub === "3pt" || pts === 3;

        switch (p.action_type) {
          case "shot":
            if (isMade) {
              stat.pts += pts;
              stat.fgm += 1; stat.fga += 1;
              if (isThree) { stat.tpm += 1; stat.tpa += 1; }
            } else {
              stat.fga += 1;
              if (isThree) { stat.tpa += 1; }
            }
            break;
          case "made_shot":
            // 2인 모드: 성공 슛
            stat.pts += pts;
            stat.fgm += 1; stat.fga += 1;
            if (isThree) { stat.tpm += 1; stat.tpa += 1; }
            break;
          case "missed_shot":
            stat.fga += 1;
            if (isThree) { stat.tpa += 1; }
            break;
          case "free_throw":
            stat.fta += 1;
            if (isMade) { stat.ftm += 1; stat.pts += 1; }
            break;
          case "rebound":
            stat.reb += 1;
            if (sub === "offensive") stat.oreb += 1;
            else if (sub === "defensive") stat.dreb += 1;
            break;
          case "assist":  stat.ast += 1; break;
          case "steal":   stat.stl += 1; break;
          case "block":   stat.blk += 1; break;
          case "turnover":stat.to  += 1; break;
          case "foul":    stat.fouls += 1; break;
          // team_foul / timeout / substitution / jump_ball: 선수 개인 스탯 집계 제외
        }
      }

      // 진행 중 경기에서도 match_player_stats의 quarter_stats_json에서 MIN 보강 (dev)
      for (const stat of match.playerStats) {
        const pid = Number(stat.tournamentTeamPlayerId);
        const row = statsMap.get(pid);
        if (!row) continue;
        // 1) quarterStatsJson에서 초 합산 (2인 모드)
        //    2026-04-15: 집계뿐 아니라 "쿼터별" min/pm을 row.quarter_stats에도 주입하여 쿼터 필터 지원
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
            // 쿼터별 min/pm → quarter_stats[qKey] 덮어쓰기
            // JSON 키 "Q1"→"1", ..., "OT1"→"5" 매핑 (현행 quarter_stats 키 체계와 통일)
            if (!row.quarter_stats) row.quarter_stats = {};
            for (const [jsonKey, qv] of Object.entries(parsed)) {
              const qKey = jsonKey.startsWith("OT")
                ? String(4 + Number(jsonKey.slice(2))) // "OT1"→"5", "OT2"→"6"
                : jsonKey.replace(/^Q/, ""); // "Q1"→"1"
              if (!qKey) continue;
              if (!row.quarter_stats[qKey]) {
                // 이벤트 기반 집계가 없던 쿼터 — 0 초기값으로 생성해서 MIN/PM만 채움
                row.quarter_stats[qKey] = {
                  min: 0, min_seconds: 0, pts: 0,
                  fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
                  oreb: 0, dreb: 0, reb: 0,
                  ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
                };
              }
              const minSec = qv.min ?? 0;
              row.quarter_stats[qKey].min_seconds = minSec;
              row.quarter_stats[qKey].min = Math.round(minSec / 60);
              row.quarter_stats[qKey].plus_minus = qv.pm ?? 0;
            }
          } catch {}
        }
        // 2) fallback: minutesPlayed (초 단위)
        if (!resolved && stat.minutesPlayed && stat.minutesPlayed > 0) {
          row.min_seconds = stat.minutesPlayed;
          row.min = Math.round(stat.minutesPlayed / 60);
        }
        // +/- 보강 (전체 집계 레벨)
        if (stat.plusMinus != null) {
          row.plus_minus = stat.plusMinus;
        }
        // 2026-04-15: MatchPlayerStat.isStarter가 있으면 TournamentTeamPlayer fallback을 덮어쓰기
        if (stat.isStarter != null) {
          row.isStarter = stat.isStarter;
        }
      }

      // 0414: DNP 플래그 부여 (MIN 보강 후에 판정해야 정확)
      // 2026-04-18: is_starter 또는 PBP 에 등장한 선수는 DNP 해제 (출전 선수는 "00:00" 으로 표시)
      for (const stat of statsMap.values()) {
        const dnp = isDnpRow(stat);
        if (dnp && (stat.isStarter || playedPlayerIds.has(stat.id))) {
          stat.dnp = false;
        } else {
          stat.dnp = dnp;
        }
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
      // 쿼터별 집계 주입 (진행 중 분기) — stat.id는 tournamentTeamPlayer.id와 동일하게 세팅되어 있어 그대로 매칭됨
      for (const row of [...homePlayers, ...awayPlayers]) {
        const qs = quarterStatsByPlayer.get(row.id);
        if (qs && Object.keys(qs).length > 0) {
          row.quarter_stats = qs;
        }
      }
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
          // 2026-04-15: 스타팅 여부 — MatchPlayerStat 우선, TournamentTeamPlayer fallback
          isStarter: stat.isStarter ?? player.isStarter ?? false,
        };

        // 2026-04-18: MIN fallback 은 롤백 (DNP 조건까지만 조정, MIN fake 주입 안 함).
        const playerIdNum = Number(player.id);

        row.dnp = isDnpRow(row);
        // 2026-04-18: DNP 완화 — is_starter 또는 PBP 에 등장한 선수는 DNP 표시 해제 (출전선수를 "DNP"→"00:00" 로)
        if (row.isStarter || playedPlayerIds.has(playerIdNum)) {
          row.dnp = false;
        }
        // 쿼터별 집계 주입 (종료 경기 분기) — tournamentTeamPlayerId로 Map 조회
        const qs = quarterStatsByPlayer.get(Number(player.id));
        if (qs && Object.keys(qs).length > 0) {
          row.quarter_stats = qs;
        }
        // 2026-04-15: quarterStatsJson의 쿼터별 min(초)/pm을 quarter_stats에 주입
        // "Q1"→"1", "OT1"→"5" 키 매핑. 이벤트 기반에 해당 쿼터가 없으면 0초기화 후 MIN/PM만 채움.
        if (stat.quarterStatsJson) {
          try {
            const parsed = JSON.parse(stat.quarterStatsJson) as Record<string, { min?: number; pm?: number }>;
            if (!row.quarter_stats) row.quarter_stats = {};
            for (const [jsonKey, qv] of Object.entries(parsed)) {
              const qKey = jsonKey.startsWith("OT")
                ? String(4 + Number(jsonKey.slice(2)))
                : jsonKey.replace(/^Q/, "");
              if (!qKey) continue;
              if (!row.quarter_stats[qKey]) {
                row.quarter_stats[qKey] = {
                  min: 0, min_seconds: 0, pts: 0,
                  fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
                  oreb: 0, dreb: 0, reb: 0,
                  ast: 0, stl: 0, blk: 0, to: 0, fouls: 0, plus_minus: 0,
                };
              }
              const minSec = qv.min ?? 0;
              row.quarter_stats[qKey].min_seconds = minSec;
              row.quarter_stats[qKey].min = Math.round(minSec / 60);
              row.quarter_stats[qKey].plus_minus = qv.pm ?? 0;
            }
          } catch {}
        }

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

    // 2026-04-17: quarter_scores 는 play_by_plays 기반으로 "항상" 재계산 (DB match.quarterScores 무시)
    // 이유: match 99~104 에서 DB quarterScores 와 실제 score 불일치 발생. PBP 가 진실 원천.
    // 이미 상단에서 조회한 allPbps 를 재사용하므로 추가 쿼리 없음.
    type QS = { home: { q1: number; q2: number; q3: number; q4: number; ot: number[] }; away: { q1: number; q2: number; q3: number; q4: number; ot: number[] } };
    const homeIdForQS = Number(homeTeamId);
    const qMap: Record<number, { home: number; away: number }> = {};
    for (const p of allPbps) {
      if (p.is_made !== true) continue;
      const pts = p.points_scored ?? 0;
      if (pts <= 0) continue;
      const q = p.quarter ?? 1;
      if (!qMap[q]) qMap[q] = { home: 0, away: 0 };
      if (Number(p.tournament_team_id) === homeIdForQS) {
        qMap[q].home += pts;
      } else {
        qMap[q].away += pts;
      }
    }
    const quarterScores: QS = {
      home: { q1: qMap[1]?.home ?? 0, q2: qMap[2]?.home ?? 0, q3: qMap[3]?.home ?? 0, q4: qMap[4]?.home ?? 0, ot: [] },
      away: { q1: qMap[1]?.away ?? 0, q2: qMap[2]?.away ?? 0, q3: qMap[3]?.away ?? 0, q4: qMap[4]?.away ?? 0, ot: [] },
    };
    for (const q of Object.keys(qMap).map(Number).filter(n => n > 4).sort()) {
      quarterScores.home.ot.push(qMap[q].home);
      quarterScores.away.ot.push(qMap[q].away);
    }

    // 진행 중인 쿼터 계산 — 가장 최근 PBP 이벤트의 quarter
    // 라이브가 아니거나 PBP가 없으면 null. 프런트에서 isLive && current_quarter 조건으로 표시 분기.
    const latestPbp = await prisma.play_by_plays.findFirst({
      where: { tournament_match_id: BigInt(matchId) },
      orderBy: [{ created_at: "desc" }],
      select: { quarter: true },
    });
    const currentQuarter = latestPbp?.quarter ?? null;

    // 경기장명: tournament_matches.venue_name 우선 → 없으면 tournament.venue_name fallback
    const venueName = match.venue_name ?? match.tournament?.venue_name ?? null;

    // 합계 점수: DB homeScore가 0이면 playerStats 합산으로 fallback
    // 이유: 종료된 경기에서 homeScore/awayScore가 sync 안 된 경우 있음 (e.g. match 102)
    // 우선순위: DB homeScore(>0) > playerStats pts 합산
    const homePlayerPts = homePlayers.reduce((sum, p) => sum + p.pts, 0);
    const awayPlayerPts = awayPlayers.reduce((sum, p) => sum + p.pts, 0);
    const finalHomeScore = (match.homeScore && match.homeScore > 0) ? match.homeScore : homePlayerPts;
    const finalAwayScore = (match.awayScore && match.awayScore > 0) ? match.awayScore : awayPlayerPts;

    // 임시 디버그 (쿼터별 집계 불일치 진단용) — ?debug=1 시 PBP 샘플/매핑 노출
    const debugEnabled = req.nextUrl.searchParams.get("debug") === "1";
    const debugPayload = debugEnabled
      ? {
          pbp_count: allPbps.length,
          pbp_sample: allPbps.slice(0, 10).map((p) => ({
            player_id: p.tournament_team_player_id != null ? String(p.tournament_team_player_id) : null,
            team_id:   p.tournament_team_id   != null ? String(p.tournament_team_id)   : null,
            quarter: p.quarter,
            action_type: p.action_type,
            action_subtype: p.action_subtype,
            is_made: p.is_made,
            points_scored: p.points_scored,
          })),
          pbp_distinct_player_ids: Array.from(new Set(allPbps.map((p) => String(p.tournament_team_player_id)))),
          map_keys: Array.from(quarterStatsByPlayer.keys()),
          roster_player_ids_home: (match.homeTeam?.players ?? []).map((p) => String(p.id)),
          roster_player_ids_away: (match.awayTeam?.players ?? []).map((p) => String(p.id)),
        }
      : undefined;

    return apiSuccess({
      match: {
        id: Number(match.id),
        status: match.status ?? "scheduled",
        homeScore: finalHomeScore,
        awayScore: finalAwayScore,
        roundName: match.roundName,
        quarterScores,
        // 경기 날짜 필드 — 프런트에서 4/11~12 게임 클럭 부정확 안내 분기에 사용
        // scheduledAt(예정일) / started_at(실제 시작 시각) 둘 다 내려줘서 프런트가 우선순위로 선택 가능하게 함
        scheduledAt: match.scheduledAt?.toISOString() ?? null,
        startedAt: match.started_at?.toISOString() ?? null,
        tournamentName: match.tournament?.name ?? "",
        // 티빙 스타일 스코어카드 신규 필드 — 경기장명 + 진행 쿼터
        venueName,
        currentQuarter,
        // 2026-04-16: 쿼터별 이벤트 기반 상세 스탯 존재 여부 (프론트 안내 배너 + "—" 처리용)
        // apiSuccess가 camelCase → snake_case 변환하므로 클라이언트는 has_quarter_event_detail로 수신
        hasQuarterEventDetail,
        homeTeam: {
          id: Number(match.homeTeam?.id ?? 0),
          name: match.homeTeam?.team?.name ?? "홈",
          color: match.homeTeam?.team?.primaryColor ?? "#F97316",
          // 팀 로고 URL — 없으면 null (프런트에서 팀색 원 + 이니셜로 fallback)
          logoUrl: match.homeTeam?.team?.logoUrl ?? null,
        },
        awayTeam: {
          id: Number(match.awayTeam?.id ?? 0),
          name: match.awayTeam?.team?.name ?? "원정",
          color: match.awayTeam?.team?.primaryColor ?? "#10B981",
          logoUrl: match.awayTeam?.team?.logoUrl ?? null,
        },
        homePlayers,
        awayPlayers,
        playByPlays: [],
        updatedAt: match.updatedAt.toISOString(),
        ...(debugPayload ? { _debug: debugPayload } : {}),
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
  // 2026-04-15: 스타팅 5 여부 — 박스스코어 상단 정렬에 사용
  // 우선순위: MatchPlayerStat.isStarter → TournamentTeamPlayer.isStarter fallback → false
  isStarter?: boolean;
  // 2026-04-15: 쿼터별 스탯 (박스스코어 쿼터 필터 버튼용)
  // 키: "1"=Q1, "2"=Q2, ..., "5"=OT1. 해당 쿼터에 기록이 없으면 키 자체가 없음.
  quarter_stats?: Record<string, {
    min: number; min_seconds: number; pts: number;
    fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number;
    oreb: number; dreb: number; reb: number;
    ast: number; stl: number; blk: number; to: number; fouls: number; plus_minus: number;
  }>;
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
