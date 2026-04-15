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
  // format / status도 함께 조회해서 클라이언트가 포맷별 분기 렌더링을 할 수 있게 한다.
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { name: true, venue_name: true, city: true, entry_fee: true, format: true, status: true },
  });

  if (!tournament) {
    return apiError("Tournament not found", 404);
  }

  // 풀리그 포맷 판별 (리그 순위표/일정을 추가로 반환할지 결정)
  // round_robin: 순수 풀리그 / full_league: 풀리그만 / full_league_knockout: 풀리그 후 토너먼트
  const isLeague =
    tournament.format === "round_robin" ||
    tournament.format === "full_league" ||
    tournament.format === "full_league_knockout";

  const [matches, tournamentTeams] = await Promise.all([
    // 매치 데이터
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }],
      include: {
        // 홈팀: 매치카드 시드 뱃지용 seedNumber 필드 명시 포함
        // select로 한정하면 불필요한 필드 전송을 줄이고 타입 일관성 확보
        // Phase 2C: 대진표 카드에 대표 언어 기준 한 줄만 표기하기 위해 name_en/name_primary 포함
        homeTeam: {
          select: {
            id: true,
            teamId: true,
            seedNumber: true,
            team: { select: { name: true, name_en: true, name_primary: true, primaryColor: true } },
          },
        },
        awayTeam: {
          select: {
            id: true,
            teamId: true,
            seedNumber: true,
            team: { select: { name: true, name_en: true, name_primary: true, primaryColor: true } },
          },
        },
        // 핫픽스(2026-04-16): Flutter "최종 스탯 입력 모드"로 저장된 경기는
        // TournamentMatch.homeScore/awayScore가 0인 채로 저장되는 경우가 있어서
        // 리그 순위표 wins/losses 집계가 전부 0으로 나오는 버그가 있음.
        // MatchPlayerStat.points 합산을 fallback으로 쓰기 위해 include 추가.
        // points와 tournamentTeamId만 가져와서 응답 크기 부담 최소화.
        playerStats: {
          select: {
            points: true,
            tournamentTeamPlayer: {
              select: { tournamentTeamId: true },
            },
          },
        },
      },
    }),
    // 참가팀
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      include: {
        // Phase 2C: 리그/조별 순위표 한 줄 표기용 name_en/name_primary 포함
        team: { select: { name: true, name_en: true, name_primary: true } },
      },
      orderBy: [{ wins: "desc" }, { losses: "asc" }],
    }),
  ]);

  const liveMatchCount = matches.filter((m) => m.status === "in_progress").length;

  // 전체/완료 경기 수 (대시보드 진행률 카드용)
  const totalMatchCount = matches.length;
  const completedMatchCount = matches.filter((m) => m.status === "completed").length;

  // 핫팀 계산: 경기 결과 기반 승률→득실차→다득점 1위 팀
  // Phase 2C: teamStats에 name_en/name_primary도 캐시해두어 리그 순위표/핫팀 응답에 함께 내려줌
  const teamStats: Record<string, {
    wins: number; losses: number;
    pointsFor: number; pointsAgainst: number;
    teamId: bigint; teamName: string;
    teamNameEn: string | null; teamNamePrimary: string | null;
  }> = {};

  for (const t of tournamentTeams) {
    teamStats[t.id.toString()] = {
      wins: 0, losses: 0,
      pointsFor: 0, pointsAgainst: 0,
      teamId: t.teamId, teamName: t.team.name,
      // Phase 2C: 한/영 병기 필드
      teamNameEn: t.team.name_en,
      teamNamePrimary: t.team.name_primary,
    };
  }

  for (const m of matches) {
    if (!m.homeTeamId || !m.awayTeamId) continue;
    if (m.status !== "completed" && m.status !== "live") continue;
    const hid = m.homeTeamId.toString();
    const aid = m.awayTeamId.toString();

    // 핫픽스(2026-04-16): DB 점수가 0이면 MatchPlayerStat.points 합산으로 fallback
    // Flutter 최종 스탯 입력 모드로 저장된 경기 대응 (homeScore/awayScore=0인 채 저장됨)
    // BigInt 비교: ps.tournamentTeamPlayer.tournamentTeamId와 m.homeTeamId 모두 bigint라 === 가능
    const homePtsSum = (m.playerStats ?? [])
      .filter((ps) => ps.tournamentTeamPlayer?.tournamentTeamId === m.homeTeamId)
      .reduce((s, p) => s + (p.points ?? 0), 0);
    const awayPtsSum = (m.playerStats ?? [])
      .filter((ps) => ps.tournamentTeamPlayer?.tournamentTeamId === m.awayTeamId)
      .reduce((s, p) => s + (p.points ?? 0), 0);

    // DB 점수가 0보다 크면 그대로 사용, 아니면 playerStats 합산으로 대체
    const hs = m.homeScore && m.homeScore > 0 ? m.homeScore : homePtsSum;
    const as_ = m.awayScore && m.awayScore > 0 ? m.awayScore : awayPtsSum;

    if (teamStats[hid]) { teamStats[hid].pointsFor += hs; teamStats[hid].pointsAgainst += as_; }
    if (teamStats[aid]) { teamStats[aid].pointsFor += as_; teamStats[aid].pointsAgainst += hs; }

    if (m.status === "completed" || m.status === "live") {
      if (hs > as_) {
        if (teamStats[hid]) teamStats[hid].wins++;
        if (teamStats[aid]) teamStats[aid].losses++;
      } else if (as_ > hs) {
        if (teamStats[aid]) teamStats[aid].wins++;
        if (teamStats[hid]) teamStats[hid].losses++;
      }
    }
  }

  // 경기 1개 이상 한 팀 중 승률→득실차→다득점 순 정렬
  const ranked = Object.values(teamStats)
    .filter((t) => (t.wins + t.losses) > 0)
    .sort((a, b) => {
      const aRate = a.wins / (a.wins + a.losses);
      const bRate = b.wins / (b.wins + b.losses);
      if (bRate !== aRate) return bRate - aRate;
      const aDiff = a.pointsFor - a.pointsAgainst;
      const bDiff = b.pointsFor - b.pointsAgainst;
      if (bDiff !== aDiff) return bDiff - aDiff;
      return b.pointsFor - a.pointsFor;
    });

  const hotTeam = ranked[0]
    ? {
        teamId: ranked[0].teamId.toString(),
        teamName: ranked[0].teamName,
        // Phase 2C: 핫팀 카드도 대표언어 기준 표기를 위해 내려줌
        teamNameEn: ranked[0].teamNameEn,
        teamNamePrimary: ranked[0].teamNamePrimary,
      }
    : null;

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
      teamId: t.teamId.toString(), // Team 테이블의 실제 id (팀 페이지 링크용)
      teamName: t.team.name,
      // Phase 2C: 조별 순위표 한 줄 표기용
      teamNameEn: t.team.name_en,
      teamNamePrimary: t.team.name_primary,
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

  // 풀리그(리그전) 순위표 데이터
  // 이미 위에서 teamStats로 집계한 wins/losses/pointsFor/pointsAgainst를 재사용한다.
  // 순위 탭(public-standings)과 동일한 형식(winRate, gamesPlayed, pointDifference)으로 맞춰서 클라이언트가 그대로 렌더링 가능하게 한다.
  const leagueTeams = isLeague
    ? tournamentTeams
        .map((t) => {
          const stats = teamStats[t.id.toString()] ?? {
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
          };
          const gamesPlayed = stats.wins + stats.losses;
          // 소수점 3자리까지 유지 (KBL 형식)
          const winRate = gamesPlayed > 0 ? Math.round((stats.wins / gamesPlayed) * 1000) / 1000 : 0;
          return {
            id: t.id.toString(),
            teamId: t.teamId.toString(),
            teamName: t.team.name,
            // Phase 2C: 리그 순위표 한 줄 표기용
            teamNameEn: t.team.name_en,
            teamNamePrimary: t.team.name_primary,
            wins: stats.wins,
            losses: stats.losses,
            gamesPlayed,
            winRate,
            pointsFor: stats.pointsFor,
            pointsAgainst: stats.pointsAgainst,
            pointDifference: stats.pointsFor - stats.pointsAgainst,
          };
        })
        .sort((a, b) => {
          // 1순위: 승률 → 2순위: 득실차 → 3순위: 다득점
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
          return b.pointsFor - a.pointsFor;
        })
    : [];

  // 풀리그 경기 일정 (전체 경기 시간순 정렬)
  // 토너먼트 트리와 달리 풀리그는 라운드 개념이 없으므로 시간순 리스트로 표시
  const leagueMatches = isLeague
    ? matches
        .map((m) => ({
          id: m.id.toString(),
          // homeTeam/awayTeam은 TournamentTeam을 가리키고, 그 안의 teamId가 실제 Team.id
          homeTeamId: m.homeTeam?.teamId?.toString() ?? null,
          awayTeamId: m.awayTeam?.teamId?.toString() ?? null,
          homeTeamName: m.homeTeam?.team?.name ?? null,
          awayTeamName: m.awayTeam?.team?.name ?? null,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          status: m.status,
          scheduledAt: m.scheduledAt?.toISOString() ?? null,
          courtNumber: m.court_number,
        }))
        .sort((a, b) => {
          // 일정 미정(scheduledAt=null)은 맨 뒤로
          if (!a.scheduledAt && !b.scheduledAt) return 0;
          if (!a.scheduledAt) return 1;
          if (!b.scheduledAt) return -1;
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        })
    : [];

  return apiSuccess({
    tournamentName: tournament.name,
    totalTeams: tournamentTeams.length,
    liveMatchCount,
    finalsDate,
    totalMatches: totalMatchCount,
    completedMatches: completedMatchCount,
    hotTeam,
    groupTeams,
    rounds,
    venueName: tournament.venue_name,
    city: tournament.city,
    entryFee: tournament.entry_fee ? Number(tournament.entry_fee) : null,
    // 포맷별 조건부 렌더링용
    format: tournament.format,
    tournamentStatus: tournament.status,
    leagueTeams,
    leagueMatches,
  });
}
