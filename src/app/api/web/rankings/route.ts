import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

/**
 * GET /api/web/rankings?type=team|player
 *
 * 랭킹 데이터를 반환하는 공개 API (인증 불필요)
 * - type=team (기본값): 팀 랭킹 (승수 기준 내림차순)
 * - type=player: 개인 랭킹 (유저별 스탯 합산, 총득점 기준 내림차순)
 */
export async function GET(request: NextRequest) {
  // 공개 API — IP 기반 rate limit (분당 100회)
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`web-rankings:${ip}`, RATE_LIMITS.api);
  if (!rl.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  try {
    const { searchParams } = request.nextUrl;
    // type 파라미터: "team" 또는 "player" (기본값 "team")
    const type = searchParams.get("type") || "team";

    if (type === "player") {
      return await getPlayerRankings();
    }

    // 기본값: 팀 랭킹
    return await getTeamRankings();
  } catch (error) {
    console.error("[GET /api/web/rankings] Error:", error);
    return apiError("랭킹을 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}

/**
 * 팀 랭킹: Team 테이블에서 wins DESC 정렬
 * - 활성 + 공개 팀만 조회
 * - 승률 계산하여 응답에 포함
 */
async function getTeamRankings() {
  const teams = await prisma.team.findMany({
    where: { status: "active", is_public: true },
    orderBy: [{ wins: "desc" }, { createdAt: "asc" }],
    take: 50,
    select: {
      id: true,
      name: true,
      primaryColor: true,
      secondaryColor: true,
      city: true,
      wins: true,
      losses: true,
      draws: true,
      members_count: true,
      tournaments_count: true,
      _count: { select: { teamMembers: true } },
    },
  });

  // 순위를 매기면서 응답 형태로 변환
  const rankings = teams.map((t, idx) => {
    const wins = t.wins ?? 0;
    const losses = t.losses ?? 0;
    const draws = t.draws ?? 0;
    const total = wins + losses;
    // 승률: 승/(승+패)*100, 둘 다 0이면 0%
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    return {
      rank: idx + 1,
      id: t.id.toString(), // BigInt -> string (JSON 직렬화)
      name: t.name,
      primaryColor: t.primaryColor,
      secondaryColor: t.secondaryColor,
      city: t.city,
      wins,
      losses,
      draws,
      winRate,
      memberCount: t._count.teamMembers, // 실제 멤버 수 (_count 사용)
      tournamentsCount: t.tournaments_count ?? 0,
    };
  });

  // 2분 캐시: 랭킹은 실시간성이 낮으므로 CDN/브라우저 캐시 활용
  const response = apiSuccess({ rankings });
  response.headers.set("Cache-Control", "public, s-maxage=120, max-age=120");
  return response;
}

/**
 * 개인 랭킹: TournamentTeamPlayer를 userId로 groupBy + 합산
 * - 같은 유저가 여러 대회에 참가하면 스탯을 합산
 * - games_played > 0인 선수만 (경기 미참여자 제외)
 * - 합산 후 유저 이름과 최근 팀명을 별도 조회
 */
async function getPlayerRankings() {
  // 1단계: userId별 스탯 합산 (groupBy)
  const grouped = await prisma.tournamentTeamPlayer.groupBy({
    by: ["userId"],
    _sum: {
      total_points: true,
      total_rebounds: true,
      total_assists: true,
      games_played: true,
    },
    where: { games_played: { gt: 0 } },
    orderBy: { _sum: { total_points: "desc" } },
    take: 50,
  });

  // groupBy 결과가 비어있으면 빈 배열 반환
  if (grouped.length === 0) {
    return apiSuccess({ rankings: [] });
  }

  // 2+3단계 병렬 실행: 유저 이름 조회와 최근 팀명 조회는 서로 독립적이므로 동시에 실행
  // userId가 nullable이므로 null 제거 후 사용
  const userIds = grouped.map((g) => g.userId).filter((id): id is bigint => id !== null);
  const [users, latestPlayers] = await Promise.all([
    // 2단계: 유저 ID 목록으로 이름 조회
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, nickname: true },
    }),
    // 3단계: 각 유저의 가장 최근 TournamentTeamPlayer에서 팀명 추출
    // (최근 대회 참가 기준으로 소속팀 표시)
    // tournamentTeam relation 대신 tournamentTeamId로 별도 조회
    prisma.tournamentTeamPlayer.findMany({
      where: { userId: { in: userIds }, games_played: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      distinct: ["userId"], // 유저별 가장 최근 1건만
      select: {
        userId: true,
        tournamentTeamId: true,
      },
    }),
  ]);

  // userId -> 유저 이름 맵
  const userMap = new Map(
    users.map((u) => [u.id.toString(), u.nickname || u.name || "이름 없음"])
  );

  // 팀명 조회: latestPlayers에서 수집한 tournamentTeamId로 팀명 일괄 조회
  const teamIds = [...new Set(latestPlayers.map((p) => p.tournamentTeamId))];
  const tournamentTeams = teamIds.length > 0
    ? await prisma.tournamentTeam.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, team: { select: { name: true } } },
      })
    : [];
  const ttMap = new Map(tournamentTeams.map((tt) => [tt.id.toString(), tt.team?.name ?? "-"]));

  // userId -> 팀명 맵
  const teamMap = new Map(
    latestPlayers
      .filter((p): p is typeof p & { userId: bigint } => p.userId !== null)
      .map((p) => [
        p.userId.toString(),
        ttMap.get(p.tournamentTeamId.toString()) ?? "-",
      ])
  );

  // 4단계: 최종 응답 조합 (순위 + 유저명 + 팀명 + 합산 스탯)
  const rankings = grouped
    .filter((g): g is typeof g & { userId: bigint } => g.userId !== null)
    .map((g, idx) => {
    const uid = g.userId.toString();
    const gamesPlayed = g._sum.games_played ?? 0;
    const totalPoints = g._sum.total_points ?? 0;
    // 평균 득점: 소수점 1자리
    const avgPoints =
      gamesPlayed > 0
        ? Math.round((totalPoints / gamesPlayed) * 10) / 10
        : 0;

    return {
      rank: idx + 1,
      userId: uid,
      name: userMap.get(uid) ?? "이름 없음",
      teamName: teamMap.get(uid) ?? "-",
      gamesPlayed,
      totalPoints,
      avgPoints,
      totalRebounds: g._sum.total_rebounds ?? 0,
      totalAssists: g._sum.total_assists ?? 0,
    };
  });

  // 2분 캐시: 개인 랭킹도 팀 랭킹과 동일한 캐시 정책 적용
  const response = apiSuccess({ rankings });
  response.headers.set("Cache-Control", "public, s-maxage=120, max-age=120");
  return response;
}
