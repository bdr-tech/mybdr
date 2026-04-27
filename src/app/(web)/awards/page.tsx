/* ============================================================
 * /awards — 수상 아카이브 (서버 컴포넌트)
 *
 * 왜 서버 컴포넌트:
 * - PM 결정 (Phase 5 Awards): 서버에서 prisma 직접 호출.
 *   API/route.ts/Prisma 스키마/서비스 0 변경. 신규 fetch 0건.
 * - 글로벌 톱레벨 라우트 — profile 하위 X. 비로그인도 열람 가능.
 * - 카페 세션 무관.
 *
 * 어떻게:
 * - URL 쿼리 ?series=<slug> 로 시즌(=tournament_series 1:1) 선택.
 *   미지정 시 전체 series 통합. "전체" 라벨도 명시 옵션으로 표시.
 * - 데이터 5블록을 서버에서 Prisma 직접 쿼리:
 *   1) seasons: prisma.tournament_series.findMany (셀렉터 옵션)
 *   2) seasonMvp: 해당 series 내 가장 최근 종료 대회의 mvp_player_id
 *   3) leaders: MatchPlayerStat 시즌 평균 1위 (득점/어시/리바)
 *      → 단일 raw SQL로 GROUP BY player + officialMatchWhere() 가드.
 *   4) finalsMvp: 해당 series 내 최신 결승전(round_name LIKE '%final%' OR is_final 추정)의 mvp
 *      → 결승 식별 로직: 라운드 이름 LIKE '결승|final|finals' 우선 + 폴백으로 max(scheduledAt).
 *   5) champions: 역대 우승팀 10건 (champion_team_id IS NOT NULL) + 준우승 + 결승 점수
 *
 * 보안/규칙:
 * - 비로그인 허용. session 검증 X.
 * - is_public=true 만 노출 (운영자 비공개 대회 제외).
 * - officialMatchWhere() 필수 사용 (미래/예정 경기 제외).
 * - BigInt → string, Decimal → number, Date → ISO 변환 page.tsx 에서 처리.
 *
 * DB 미지원 → 클라에서 "준비 중" 표시:
 * - 팀 ELO 레이팅 (Team.rating 컬럼 미존재)
 * - 올해의 감독 (Team.coach_user_id 미존재)
 * - 올스타 1st/2nd (season_all_star_teams 테이블 미존재)
 * - MVP 코멘트 (tournament_mvp_quotes 테이블 미존재)
 * - NEW FACE (루키 식별 로직 미정)
 * - 변동(d:+48 등) — series_history snapshot 미존재
 * ============================================================ */

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  officialMatchNestedFilter,
  OFFICIAL_MATCH_SQL_CONDITION,
} from "@/lib/tournaments/official-match";

import { AwardsContent } from "./_v2/awards-content";

export const dynamic = "force-dynamic";

/* ---- DTO 타입 ---- */

export interface SeasonOption {
  slug: string;
  name: string;
}

export interface PlayerRefDTO {
  userId: string;
  name: string;
  /** 시즌 평균 등 표시용 raw value (예: 22.4) — 미지원이면 null */
  metricValue: number | null;
  /** PPG / APG / RPG 같은 라벨 */
  metricLabel: string;
  /** 팀명 — 가장 최근 대회 기준 */
  teamName: string | null;
  /** 팀 태그 — DB 없음, 이름 첫 3자 fallback (UI에서 처리) */
  position: string | null;
  /** 시안 컬러 — Tournament.primary_color 우선, 없으면 #0F5FCC */
  teamColor: string | null;
}

export interface SeasonMvpDTO {
  player: PlayerRefDTO | null;
  /** 시즌 평균 4셀 (PPG/APG/RPG/WIN%) — WIN%는 미지원이면 null */
  ppg: number | null;
  apg: number | null;
  rpg: number | null;
  winPct: number | null;
}

export interface ChampionRowDTO {
  /** 시즌(=series) 라벨 */
  seasonLabel: string;
  /** 대회 이름 */
  tournamentName: string;
  /** 우승팀 이름 */
  championName: string | null;
  /** 준우승팀 이름 (final_rank=2) */
  runnerUpName: string | null;
  /** 결승 스코어 "78–71" 또는 null */
  finalScore: string | null;
  /** Finals MVP 이름 */
  finalsMvpName: string | null;
}

export interface AwardsDataDTO {
  seasons: SeasonOption[];
  /** 현재 선택된 시즌 라벨 ("2026 Spring 결산" 또는 "전체 시즌 결산") */
  currentSeasonLabel: string;
  /** 현재 선택된 series slug — 없으면 "all" */
  currentSeasonSlug: string;
  seasonMvp: SeasonMvpDTO | null;
  finalsMvp: PlayerRefDTO | null;
  scoringLeader: PlayerRefDTO | null;
  assistsLeader: PlayerRefDTO | null;
  reboundsLeader: PlayerRefDTO | null;
  champions: ChampionRowDTO[];
}

/* ---- 헬퍼 ---- */

/** Decimal → number 변환 (null 안전) */
function dec(d: Prisma.Decimal | number | null | undefined): number | null {
  if (d === null || d === undefined) return null;
  if (typeof d === "number") return d;
  // Prisma.Decimal
  return Number(d.toString());
}

/** "<홈>–<원정>" 결승 스코어 포맷 */
function fmtScore(home: number | null, away: number | null): string | null {
  if (home === null || away === null) return null;
  // 큰 점수가 우승팀 점수가 아닐 수 있으므로 그대로 표기 (시안: 78–71)
  // 시안의 1위/2위 스코어 의미상 "우승–준우승" 이지만 DB는 home/away 단순.
  // → 항상 큰 수가 앞에 오도록 정렬 (UX 일관성)
  const a = Math.max(home, away);
  const b = Math.min(home, away);
  return `${a}–${b}`;
}

/** 라운드명 결승 식별 (한국어/영어 둘 다) */
const FINAL_ROUND_KEYWORDS = ["결승", "final", "finals", "championship"];

function isFinalsRound(roundName: string | null | undefined): boolean {
  if (!roundName) return false;
  const lower = roundName.toLowerCase();
  return FINAL_ROUND_KEYWORDS.some((k) => lower.includes(k));
}

/* ---- 메인 페이지 ---- */

interface PageProps {
  searchParams: Promise<{ series?: string }>;
}

export default async function AwardsPage({ searchParams }: PageProps) {
  // ----- 1) 시즌 셀렉터 옵션 -----
  // tournament_series 전체 (is_public=true) — name desc 시간 역순
  // 시안의 "전체" 옵션 추가.
  const seriesList = await prisma.tournament_series
    .findMany({
      where: { is_public: true, status: "active" },
      select: { id: true, slug: true, name: true },
      orderBy: { created_at: "desc" },
      take: 20,
    })
    .catch(() => [] as Array<{ id: bigint; slug: string; name: string }>);

  const seasons: SeasonOption[] = [
    { slug: "all", name: "전체" },
    ...seriesList.map((s) => ({ slug: s.slug, name: s.name })),
  ];

  // ----- 2) 현재 선택된 시즌 식별 -----
  const sp = await searchParams;
  const requestedSlug = sp.series ?? "all";
  const currentSeason = seasons.find((s) => s.slug === requestedSlug) ?? seasons[0];
  const currentSeasonSlug = currentSeason.slug;
  const currentSeasonLabel =
    currentSeason.slug === "all" ? "전체 시즌 결산" : `${currentSeason.name} 결산`;

  // 현재 시즌 series_id (전체면 undefined → 모든 series 조회)
  const currentSeriesId =
    currentSeason.slug === "all"
      ? undefined
      : seriesList.find((s) => s.slug === currentSeason.slug)?.id;

  // 현재 시즌 범위에 속하는 tournament IDs (champion/leaders 쿼리 공통 사용)
  // - 전체: 모든 is_public 토너먼트
  // - 특정: 해당 series_id 만
  const tournamentWhere: Prisma.TournamentWhereInput = {
    is_public: true,
    ...(currentSeriesId ? { series_id: currentSeriesId } : {}),
  };

  // ----- 3) 시즌 MVP — 해당 series 내 가장 최근 종료 대회의 mvp_player_id -----
  let seasonMvp: SeasonMvpDTO | null = null;
  try {
    const mvpTournament = await prisma.tournament.findFirst({
      where: {
        ...tournamentWhere,
        mvp_player_id: { not: null },
      },
      orderBy: { endDate: "desc" },
      select: {
        id: true,
        primary_color: true,
        users_tournaments_mvp_player_idTousers: {
          select: { id: true, nickname: true, name: true, position: true },
        },
      },
    });

    if (mvpTournament?.users_tournaments_mvp_player_idTousers) {
      const u = mvpTournament.users_tournaments_mvp_player_idTousers;
      // MVP 의 가장 최근 등록된 팀 이름 조회 (이름 표시용)
      const ttp = await prisma.tournamentTeamPlayer.findFirst({
        where: { userId: u.id, tournamentTeam: { tournamentId: mvpTournament.id } },
        select: {
          tournamentTeam: { select: { team: { select: { name: true } } } },
        },
      });

      // 시즌 평균 (PPG/APG/RPG) — MVP 본인의 해당 시즌 평균
      // matchPlayerStat aggregate: tournament 가 시즌 범위에 속하는 것만
      const agg = await prisma.matchPlayerStat.aggregate({
        where: {
          tournamentTeamPlayer: { userId: u.id },
          tournamentMatch: {
            ...officialMatchNestedFilter(),
            tournament: tournamentWhere,
          },
        },
        _avg: { points: true, assists: true, total_rebounds: true },
        _count: { id: true },
      });

      seasonMvp = {
        player: {
          userId: u.id.toString(),
          name: u.nickname || u.name || `Player#${u.id}`,
          metricValue: dec(agg._avg.points),
          metricLabel: "PPG",
          teamName: ttp?.tournamentTeam?.team?.name ?? null,
          position: u.position,
          teamColor: mvpTournament.primary_color || "#0F5FCC",
        },
        ppg: dec(agg._avg.points),
        apg: dec(agg._avg.assists),
        rpg: dec(agg._avg.total_rebounds),
        // WIN% 미지원 — 별도 집계 필요 (해당 선수 출전 경기 중 팀 승률)
        winPct: null,
      };
    }
  } catch {
    seasonMvp = null;
  }

  // ----- 4) 시즌 리더 (득점/어시/리바왕) -----
  // matchPlayerStat GROUP BY user_id (tournamentTeamPlayer 조인) → 시즌 평균 1위
  // - officialMatchWhere() 필수 (raw SQL 단편 사용)
  // - 시즌 범위는 tournament.is_public=true + (series_id 매칭)
  // - games_played 최소 1 이상
  // raw SQL 1번으로 3 metric 동시 조회 → CTE 또는 3번 쿼리. 단순화 위해 3번 쿼리 분리.
  let scoringLeader: PlayerRefDTO | null = null;
  let assistsLeader: PlayerRefDTO | null = null;
  let reboundsLeader: PlayerRefDTO | null = null;

  // series 필터 raw SQL 단편 — currentSeriesId 가 있으면 AND t.series_id = $X
  // BigInt 파라미터는 Prisma.sql 로 안전하게 바인딩
  const seriesFilterSql = currentSeriesId
    ? Prisma.sql`AND t.series_id = ${currentSeriesId}`
    : Prisma.sql``;

  try {
    // 득점왕 — AVG(points) DESC, MIN 3경기
    const scoring = await prisma.$queryRaw<
      Array<{
        user_id: bigint;
        nickname: string | null;
        name: string | null;
        position: string | null;
        avg_value: number;
        team_name: string | null;
      }>
    >(Prisma.sql`
      SELECT u.id AS user_id, u.nickname, u.name, u.position,
             AVG(s.points)::float AS avg_value,
             (SELECT tm.name FROM teams tm
              JOIN tournament_teams tt ON tt.team_id = tm.id
              JOIN tournament_team_players ttp2 ON ttp2.tournament_team_id = tt.id
              WHERE ttp2.user_id = u.id
              ORDER BY ttp2.created_at DESC LIMIT 1) AS team_name
      FROM match_player_stats s
      JOIN tournament_team_players ttp ON ttp.id = s.tournament_team_player_id
      JOIN users u ON u.id = ttp.user_id
      JOIN tournament_matches tm ON tm.id = s.tournament_match_id
      JOIN tournaments t ON t.id = tm.tournament_id
      WHERE ${Prisma.raw(OFFICIAL_MATCH_SQL_CONDITION)}
        AND t.is_public = true
        ${seriesFilterSql}
        AND ttp.user_id IS NOT NULL
      GROUP BY u.id, u.nickname, u.name, u.position
      HAVING COUNT(s.id) >= 1
      ORDER BY avg_value DESC NULLS LAST
      LIMIT 1
    `);
    if (scoring[0]) {
      const r = scoring[0];
      scoringLeader = {
        userId: r.user_id.toString(),
        name: r.nickname || r.name || `Player#${r.user_id}`,
        metricValue: r.avg_value,
        metricLabel: "PPG",
        teamName: r.team_name,
        position: r.position,
        teamColor: null,
      };
    }
  } catch {
    scoringLeader = null;
  }

  try {
    const assists = await prisma.$queryRaw<
      Array<{
        user_id: bigint;
        nickname: string | null;
        name: string | null;
        position: string | null;
        avg_value: number;
        team_name: string | null;
      }>
    >(Prisma.sql`
      SELECT u.id AS user_id, u.nickname, u.name, u.position,
             AVG(s.assists)::float AS avg_value,
             (SELECT tm.name FROM teams tm
              JOIN tournament_teams tt ON tt.team_id = tm.id
              JOIN tournament_team_players ttp2 ON ttp2.tournament_team_id = tt.id
              WHERE ttp2.user_id = u.id
              ORDER BY ttp2.created_at DESC LIMIT 1) AS team_name
      FROM match_player_stats s
      JOIN tournament_team_players ttp ON ttp.id = s.tournament_team_player_id
      JOIN users u ON u.id = ttp.user_id
      JOIN tournament_matches tm ON tm.id = s.tournament_match_id
      JOIN tournaments t ON t.id = tm.tournament_id
      WHERE ${Prisma.raw(OFFICIAL_MATCH_SQL_CONDITION)}
        AND t.is_public = true
        ${seriesFilterSql}
        AND ttp.user_id IS NOT NULL
      GROUP BY u.id, u.nickname, u.name, u.position
      HAVING COUNT(s.id) >= 1
      ORDER BY avg_value DESC NULLS LAST
      LIMIT 1
    `);
    if (assists[0]) {
      const r = assists[0];
      assistsLeader = {
        userId: r.user_id.toString(),
        name: r.nickname || r.name || `Player#${r.user_id}`,
        metricValue: r.avg_value,
        metricLabel: "APG",
        teamName: r.team_name,
        position: r.position,
        teamColor: null,
      };
    }
  } catch {
    assistsLeader = null;
  }

  try {
    const rebounds = await prisma.$queryRaw<
      Array<{
        user_id: bigint;
        nickname: string | null;
        name: string | null;
        position: string | null;
        avg_value: number;
        team_name: string | null;
      }>
    >(Prisma.sql`
      SELECT u.id AS user_id, u.nickname, u.name, u.position,
             AVG(s.total_rebounds)::float AS avg_value,
             (SELECT tm.name FROM teams tm
              JOIN tournament_teams tt ON tt.team_id = tm.id
              JOIN tournament_team_players ttp2 ON ttp2.tournament_team_id = tt.id
              WHERE ttp2.user_id = u.id
              ORDER BY ttp2.created_at DESC LIMIT 1) AS team_name
      FROM match_player_stats s
      JOIN tournament_team_players ttp ON ttp.id = s.tournament_team_player_id
      JOIN users u ON u.id = ttp.user_id
      JOIN tournament_matches tm ON tm.id = s.tournament_match_id
      JOIN tournaments t ON t.id = tm.tournament_id
      WHERE ${Prisma.raw(OFFICIAL_MATCH_SQL_CONDITION)}
        AND t.is_public = true
        ${seriesFilterSql}
        AND ttp.user_id IS NOT NULL
      GROUP BY u.id, u.nickname, u.name, u.position
      HAVING COUNT(s.id) >= 1
      ORDER BY avg_value DESC NULLS LAST
      LIMIT 1
    `);
    if (rebounds[0]) {
      const r = rebounds[0];
      reboundsLeader = {
        userId: r.user_id.toString(),
        name: r.nickname || r.name || `Player#${r.user_id}`,
        metricValue: r.avg_value,
        metricLabel: "RPG",
        teamName: r.team_name,
        position: r.position,
        teamColor: null,
      };
    }
  } catch {
    reboundsLeader = null;
  }

  // ----- 5) Finals MVP — 해당 시즌 내 결승전 mvp -----
  // 결승 식별: round_name LIKE '결승|final' 우선 + 폴백으로 max(scheduledAt)
  let finalsMvp: PlayerRefDTO | null = null;
  try {
    // 1차: round_name 키워드 매칭
    const finalsMatches = await prisma.tournamentMatch.findMany({
      where: {
        ...officialMatchNestedFilter(),
        tournament: tournamentWhere,
        mvp_player_id: { not: null },
        OR: [
          { roundName: { contains: "결승", mode: "insensitive" } },
          { roundName: { contains: "final", mode: "insensitive" } },
          { roundName: { contains: "championship", mode: "insensitive" } },
        ],
      },
      orderBy: { scheduledAt: "desc" },
      take: 1,
      select: {
        id: true,
        roundName: true,
        users: {
          select: { id: true, nickname: true, name: true, position: true },
        },
      },
    });

    let mvpUser = finalsMatches[0]?.users ?? null;

    // 2차 폴백: round_name 매칭이 없으면 시즌 가장 최근 mvp 매치
    if (!mvpUser) {
      const fallback = await prisma.tournamentMatch.findFirst({
        where: {
          ...officialMatchNestedFilter(),
          tournament: tournamentWhere,
          mvp_player_id: { not: null },
        },
        orderBy: { scheduledAt: "desc" },
        select: {
          users: {
            select: { id: true, nickname: true, name: true, position: true },
          },
        },
      });
      mvpUser = fallback?.users ?? null;
    }

    if (mvpUser) {
      // Finals MVP 의 해당 시즌 통산 평균 (PPG · APG)
      const agg = await prisma.matchPlayerStat.aggregate({
        where: {
          tournamentTeamPlayer: { userId: mvpUser.id },
          tournamentMatch: {
            ...officialMatchNestedFilter(),
            tournament: tournamentWhere,
          },
        },
        _avg: { points: true, assists: true },
        _sum: { points: true, assists: true },
      });
      const ppgVal = dec(agg._avg.points);
      const apgVal = dec(agg._avg.assists);
      finalsMvp = {
        userId: mvpUser.id.toString(),
        name: mvpUser.nickname || mvpUser.name || `Player#${mvpUser.id}`,
        metricValue: ppgVal,
        // 시안 "31 PTS · 9 AST" 와 가까운 라벨 — 시즌 평균이라 PPG/APG로 표기
        metricLabel:
          ppgVal !== null && apgVal !== null
            ? `${ppgVal.toFixed(1)} PPG · ${apgVal.toFixed(1)} APG`
            : "PPG",
        teamName: null,
        position: mvpUser.position,
        teamColor: null,
      };
    }
  } catch {
    finalsMvp = null;
  }

  // ----- 6) 역대 우승팀 (전체 시즌 통합) — 시안 "역대 우승팀" 섹션 -----
  // - champion_team_id IS NOT NULL 인 토너먼트 ORDER BY endDate desc 10건
  // - 준우승: tournament_teams where final_rank=2
  // - 결승 점수: tournament_matches where roundName 키워드 매칭 (없으면 최신 매치)
  // - mvp 이름: tournament.mvp_player_id 또는 결승 매치 mvp
  let champions: ChampionRowDTO[] = [];
  try {
    const winnerTournaments = await prisma.tournament.findMany({
      where: {
        is_public: true,
        champion_team_id: { not: null },
      },
      orderBy: { endDate: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        endDate: true,
        teams: { select: { id: true, name: true } }, // 우승팀 (champion_team)
        tournament_series: { select: { name: true } },
        users_tournaments_mvp_player_idTousers: {
          select: { nickname: true, name: true },
        },
        // 준우승 — final_rank=2 tournamentTeams
        tournamentTeams: {
          where: { final_rank: 2 },
          take: 1,
          select: { team: { select: { name: true } } },
        },
        // 결승 매치 — 라운드명 매칭 우선
        tournamentMatches: {
          where: {
            status: { in: ["completed", "live"] },
            scheduledAt: { not: null },
            OR: [
              { roundName: { contains: "결승", mode: "insensitive" } },
              { roundName: { contains: "final", mode: "insensitive" } },
              { roundName: { contains: "championship", mode: "insensitive" } },
            ],
          },
          orderBy: { scheduledAt: "desc" },
          take: 1,
          select: {
            homeScore: true,
            awayScore: true,
            users: { select: { nickname: true, name: true } },
          },
        },
      },
    });

    champions = winnerTournaments.map((t) => {
      const finalsMatch = t.tournamentMatches[0];
      const finalsMvpName =
        finalsMatch?.users?.nickname ||
        finalsMatch?.users?.name ||
        t.users_tournaments_mvp_player_idTousers?.nickname ||
        t.users_tournaments_mvp_player_idTousers?.name ||
        null;

      return {
        seasonLabel: t.tournament_series?.name ?? (t.endDate ? new Date(t.endDate).getFullYear().toString() : "—"),
        tournamentName: t.name,
        championName: t.teams?.name ?? null,
        runnerUpName: t.tournamentTeams[0]?.team?.name ?? null,
        finalScore: fmtScore(finalsMatch?.homeScore ?? null, finalsMatch?.awayScore ?? null),
        finalsMvpName,
      };
    });
  } catch {
    champions = [];
  }

  // ----- DTO 패키징 -----
  const data: AwardsDataDTO = {
    seasons,
    currentSeasonLabel,
    currentSeasonSlug,
    seasonMvp,
    finalsMvp,
    scoringLeader,
    assistsLeader,
    reboundsLeader,
    champions,
  };

  return <AwardsContent data={data} />;
}
