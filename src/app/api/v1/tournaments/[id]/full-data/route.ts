import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, notFound, forbidden } from "@/lib/api/response";
import { getTournamentFullData, hasAccessToTournament } from "@/lib/services/tournament";

// FR-024: 토너먼트 전체 데이터 다운로드 (Flutter 오프라인 동기화)
// 이 라우트는 Flutter와의 호환성을 위해 명시적 snake_case 사용
async function handler(
  _req: NextRequest,
  ctx: AuthContext,
  tournamentId: string
) {
  // IDOR 방지 (super_admin은 모든 대회 접근 가능)
  if (ctx.userRole !== "super_admin") {
    const hasAccess = await hasAccessToTournament(tournamentId, BigInt(ctx.userId));
    if (!hasAccess) return forbidden("No access to this tournament");
  }

  const fullData = await getTournamentFullData(tournamentId);
  if (!fullData) return notFound("Tournament not found");

  const { tournament, teams, players, matches, playerStats } = fullData;

  return apiSuccess({
    tournament: {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      start_date: tournament.startDate?.toISOString() ?? null,
      end_date: tournament.endDate?.toISOString() ?? null,
      venue_name: tournament.venue_name,
      venue_address: tournament.venue_address,
      team_count: teams.length,
    },
    teams: teams.map((t) => ({
      id: Number(t.id),
      tournament_id: t.tournamentId,
      team_id: Number(t.teamId),
      team_name: t.team.name,
      primary_color: t.team.primaryColor,
      secondary_color: t.team.secondaryColor,
      group_name: t.groupName,
      seed_number: t.seedNumber,
      wins: t.wins,
      losses: t.losses,
    })),
    players: players.map((p) => ({
      id: Number(p.id),
      tournament_team_id: Number(p.tournamentTeamId),
      user_id: p.userId?.toString(),
      user_name: p.users?.nickname ?? `Player #${p.jerseyNumber ?? p.id}`,
      jersey_number: p.jerseyNumber,
      position: p.position,
      role: p.role,
      is_starter: p.isStarter ?? false,
    })),
    matches: matches.map((m) => ({
      id: Number(m.id),
      uuid: m.uuid,
      tournament_id: m.tournamentId,
      home_team_id: m.homeTeamId ? Number(m.homeTeamId) : null,
      away_team_id: m.awayTeamId ? Number(m.awayTeamId) : null,
      round_name: m.roundName,
      round_number: m.round_number,
      group_name: m.group_name,
      scheduled_at: m.scheduledAt?.toISOString() ?? null,
      status: m.status,
      home_score: m.homeScore,
      away_score: m.awayScore,
      quarter_scores: m.quarterScores,
    })),
    player_stats: playerStats.map((s) => ({
      id: Number(s.id),
      tournament_match_id: Number(s.tournamentMatchId),
      tournament_team_player_id: Number(s.tournamentTeamPlayerId),
      is_starter: s.isStarter ?? false,
      minutes_played: s.minutesPlayed ?? 0,
      points: s.points ?? 0,
      field_goals_made: s.fieldGoalsMade ?? 0,
      field_goals_attempted: s.fieldGoalsAttempted ?? 0,
      two_pointers_made: s.two_pointers_made ?? 0,
      two_pointers_attempted: s.two_pointers_attempted ?? 0,
      three_pointers_made: s.threePointersMade ?? 0,
      three_pointers_attempted: s.threePointersAttempted ?? 0,
      free_throws_made: s.freeThrowsMade ?? 0,
      free_throws_attempted: s.freeThrowsAttempted ?? 0,
      offensive_rebounds: s.offensive_rebounds ?? 0,
      defensive_rebounds: s.defensive_rebounds ?? 0,
      total_rebounds: s.total_rebounds ?? 0,
      assists: s.assists ?? 0,
      steals: s.steals ?? 0,
      blocks: s.blocks ?? 0,
      turnovers: s.turnovers ?? 0,
      personal_fouls: s.personal_fouls ?? 0,
      plus_minus: s.plusMinus ?? 0,
      fouled_out: s.fouled_out ?? false,
      ejected: s.ejected ?? false,
    })),
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return handler(r, authCtx, id);
  }))(req);
}
