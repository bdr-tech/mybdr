import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/web/dashboard
 * 홈 히어로 개인 맞춤형 슬라이드 데이터
 *
 * game_applications.status: Int (1=approved, 2=pending 등)
 * games.status: Int (1=open, 2=confirmed 등)
 */
export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  const userId = ctx.userId;

  // 30일 전 / 90일 전 기준 날짜 — 활동 프로필 / 자주 가는 코트 쿼리에 사용
  const now = new Date();
  const days30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const days90ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    nextGame, recentStats, myTeams, activeTournament, recommendedGames,
    frequentCourtsRaw, checkinCount, gameAppCount, pickupPartCount, userPrefs,
  ] =
    await Promise.all([
      // 1. 내 다음 경기 — 승인된 신청 중 가장 가까운 미래 경기
      prisma.game_applications
        .findFirst({
          where: {
            user_id: userId,
            status: 1, // approved
            games: { scheduled_at: { gte: new Date() }, status: { in: [1, 2] } },
          },
          orderBy: { games: { scheduled_at: "asc" } },
          include: {
            games: {
              select: {
                title: true,
                scheduled_at: true,
                venue_name: true,
                city: true,
                game_type: true,
                uuid: true,
              },
            },
          },
        })
        .catch(() => null),

      // 2. 내 최근 스탯 — 가장 최근 경기 기록
      prisma.matchPlayerStat
        .findFirst({
          where: { tournamentTeamPlayer: { userId } },
          orderBy: { createdAt: "desc" },
          include: {
            tournamentMatch: {
              select: {
                scheduledAt: true,
                tournament: { select: { name: true } },
              },
            },
          },
        })
        .catch(() => null),

      // 3. 내 팀 전적 — 활성 팀 멤버십
      prisma.teamMember
        .findMany({
          where: { userId, status: "approved" },
          take: 3,
          include: {
            team: {
              select: {
                id: true,
                name: true,
                wins: true,
                losses: true,
                primaryColor: true,
              },
            },
          },
        })
        .catch(() => []),

      // 4. 참가 중인 대회
      prisma.tournamentTeamPlayer
        .findFirst({
          where: {
            userId,
            is_active: true,
            tournamentTeam: {
              tournament: { status: { in: ["ongoing", "registration_open", "active"] } },
            },
          },
          orderBy: { createdAt: "desc" },
          include: {
            tournamentTeam: {
              include: {
                tournament: {
                  select: { id: true, name: true, status: true, startDate: true, endDate: true },
                },
                team: { select: { name: true } },
              },
            },
          },
        })
        .catch(() => null),

      // 5. 오늘의 추천 경기 — 내 지역 기반
      prisma.user
        .findUnique({ where: { id: userId }, select: { city: true } })
        .then(async (u) => {
          return prisma.games.findMany({
            where: {
              status: { in: [1, 2] },
              scheduled_at: { gte: new Date() },
              ...(u?.city ? { city: u.city } : {}),
            },
            orderBy: { scheduled_at: "asc" },
            take: 3,
            select: {
              uuid: true,
              title: true,
              scheduled_at: true,
              venue_name: true,
              city: true,
              max_participants: true,
              current_participants: true,
              game_type: true,
            },
          });
        })
        .catch(() => []),

      // 6. 자주 가는 코트 TOP 3 — 최근 90일 체크인 기준 그룹화
      prisma.court_sessions
        .groupBy({
          by: ["court_id"],
          where: { user_id: userId, checked_in_at: { gte: days90ago } },
          _count: { court_id: true },
          orderBy: { _count: { court_id: "desc" } },
          take: 3,
        })
        .catch(() => []),

      // 7. 활동 프로필 — 최근 30일 체크인 수
      prisma.court_sessions
        .count({ where: { user_id: userId, checked_in_at: { gte: days30ago } } })
        .catch(() => 0),

      // 8. 활동 프로필 — 최근 30일 경기 신청 수
      prisma.game_applications
        .count({ where: { user_id: userId, created_at: { gte: days30ago }, status: 1 } })
        .catch(() => 0),

      // 9. 활동 프로필 — 최근 30일 픽업 참가 수
      prisma.pickup_participants
        .count({ where: { user_id: userId, joined_at: { gte: days30ago } } })
        .catch(() => 0),

      // 10. 맞춤 설정 — 유저의 preferred_regions, preferred_days
      prisma.user
        .findUnique({
          where: { id: userId },
          select: { preferred_regions: true, preferred_days: true },
        })
        .catch(() => null),
    ]);

  // ─── 자주 가는 코트 이름 조회 (groupBy 결과에서 court_id만 나오므로) ───
  const frequentCourtIds = (frequentCourtsRaw ?? []).map((r) => r.court_id);
  let frequentCourts: { id: string; name: string; visitCount: number }[] = [];
  if (frequentCourtIds.length > 0) {
    const courtNames = await prisma.court_infos.findMany({
      where: { id: { in: frequentCourtIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(courtNames.map((c) => [c.id.toString(), c.name]));
    frequentCourts = (frequentCourtsRaw ?? []).map((r) => ({
      id: r.court_id.toString(),
      name: nameMap.get(r.court_id.toString()) ?? "코트",
      visitCount: r._count.court_id,
    }));
  }

  // ─── 활동 프로필: 주된 활동 유형 판별 ───
  const cCount = checkinCount ?? 0;
  const gCount = gameAppCount ?? 0;
  const pCount = pickupPartCount ?? 0;
  const totalActivity = cCount + gCount + pCount;
  let dominantType: "new" | "checkin" | "game" | "pickup" = "new";
  if (totalActivity > 0) {
    if (cCount >= gCount && cCount >= pCount) dominantType = "checkin";
    else if (gCount >= cCount && gCount >= pCount) dominantType = "game";
    else dominantType = "pickup";
  }

  // 맞춤 지역 파싱 (Json 타입이므로 배열로 캐스팅)
  const preferredRegions = Array.isArray(userPrefs?.preferred_regions)
    ? (userPrefs.preferred_regions as string[])
    : [];
  const preferredDays = Array.isArray(userPrefs?.preferred_days)
    ? (userPrefs.preferred_days as string[])
    : [];

  return apiSuccess({
    nextGame: nextGame
      ? {
          title: nextGame.games.title,
          scheduledAt: nextGame.games.scheduled_at?.toISOString() ?? null,
          venueName: nextGame.games.venue_name,
          city: nextGame.games.city,
          gameType: nextGame.games.game_type,
          uuid: nextGame.games.uuid,
        }
      : null,

    recentStats: recentStats
      ? {
          points: recentStats.points,
          rebounds: recentStats.total_rebounds,
          assists: recentStats.assists,
          steals: recentStats.steals,
          blocks: recentStats.blocks,
          minutes: recentStats.minutesPlayed,
          matchDate: recentStats.tournamentMatch?.scheduledAt?.toISOString() ?? null,
          tournamentName: recentStats.tournamentMatch?.tournament?.name ?? null,
        }
      : null,

    myTeams: myTeams.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      wins: m.team.wins,
      losses: m.team.losses,
      color: m.team.primaryColor,
    })),

    activeTournament: activeTournament
      ? {
          id: activeTournament.tournamentTeam.tournament.id,
          name: activeTournament.tournamentTeam.tournament.name,
          status: activeTournament.tournamentTeam.tournament.status,
          teamName: activeTournament.tournamentTeam.team?.name ?? null,
          startDate: activeTournament.tournamentTeam.tournament.startDate?.toISOString() ?? null,
        }
      : null,

    recommendedGames: (recommendedGames ?? []).map((g) => ({
      uuid: g.uuid,
      title: g.title,
      scheduledAt: g.scheduled_at?.toISOString() ?? null,
      venueName: g.venue_name,
      city: g.city,
      spotsLeft:
        g.max_participants && g.current_participants
          ? g.max_participants - g.current_participants
          : null,
      gameType: g.game_type,
    })),

    // 자주 가는 코트 TOP 3 (최근 90일 기준)
    frequentCourts,

    // 활동 프로필 (최근 30일)
    activityProfile: {
      dominantType,
      checkinCount: cCount,
      gameCount: gCount,
      pickupCount: pCount,
    },

    // 맞춤 설정
    preferredRegions,
    preferredDays,
  });
});
