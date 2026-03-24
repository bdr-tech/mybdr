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

  const [nextGame, recentStats, myTeams, activeTournament, recommendedGames] =
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
    ]);

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
  });
});
