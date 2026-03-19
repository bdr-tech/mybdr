/**
 * User/Profile Service — 사용자 프로필 관련 비즈니스 로직 중앙화
 *
 * Service 함수는 순수 데이터만 반환한다 (NextResponse 사용 금지).
 */
import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Select 상수
// ---------------------------------------------------------------------------

/** 프로필 상세 조회 select (GET /api/web/profile) */
export const PROFILE_DETAIL_SELECT = {
  // 기존 필드 (profile 조회용)
  nickname: true,
  email: true,
  position: true,
  height: true,
  city: true,
  bio: true,
  profile_image_url: true,
  total_games_participated: true,
  // 신규 필드 (profile/edit 용)
  name: true,
  phone: true,
  birth_date: true,
  district: true,
  weight: true,
  bank_name: true,
  bank_code: true,
  account_number: true,
  account_holder: true,
} as const;

/** 게임 상세에서 사용하는 유저 프로필 select */
export const USER_GAME_PROFILE_SELECT = {
  name: true,
  nickname: true,
  phone: true,
  position: true,
  city: true,
  district: true,
  profile_completed: true,
  profileReminderShownAt: true,
} as const;

// ---------------------------------------------------------------------------
// Service 함수
// ---------------------------------------------------------------------------

/**
 * 프로필 상세 조회 — 팀, 경기, 대회 이력 포함
 */
export async function getProfile(userId: bigint) {
  const [user, teams, gameApplications, tournamentTeams] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_DETAIL_SELECT,
    }),
    prisma.teamMember.findMany({
      where: { userId, status: "active" },
      include: { team: { select: { id: true, name: true } } },
      take: 10,
    }),
    prisma.game_applications.findMany({
      where: { user_id: userId },
      include: {
        games: {
          select: {
            id: true,
            uuid: true,
            title: true,
            scheduled_at: true,
            status: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 10,
    }),
    prisma.tournamentTeamPlayer.findMany({
      where: { userId },
      include: {
        tournamentTeam: {
          include: {
            tournament: {
              select: { id: true, name: true, status: true },
            },
          },
        },
      },
      take: 10,
    }),
  ]);

  return { user, teams, gameApplications, tournamentTeams };
}

/**
 * 프로필 수정
 */
export async function updateProfile(
  userId: bigint,
  data: Record<string, unknown>
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      nickname: true,
      position: true,
      height: true,
      city: true,
      bio: true,
      name: true,
    },
  });
}

/**
 * 유저 게임 프로필 조회 (게임 상세 페이지용)
 */
export async function getUserGameProfile(userId: bigint) {
  return prisma.user
    .findUnique({
      where: { id: userId },
      select: USER_GAME_PROFILE_SELECT,
    })
    .catch(() => null);
}

/**
 * 프로필 스탯 집계 — 커리어 평균 + 시즌 최고
 */
export async function getPlayerStats(userId: bigint) {
  // 유저의 tournamentTeamPlayer IDs 조회
  const players = await prisma.tournamentTeamPlayer.findMany({
    where: { userId },
    select: { id: true },
  });

  const playerIds = players.map((p) => p.id);
  if (playerIds.length === 0) {
    return { careerAverages: null, seasonHighs: null };
  }

  const [aggregate, maxStats] = await Promise.all([
    prisma.matchPlayerStat.aggregate({
      where: { tournamentTeamPlayerId: { in: playerIds } },
      _avg: {
        points: true,
        total_rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
        minutesPlayed: true,
      },
      _count: { id: true },
    }),
    prisma.matchPlayerStat.aggregate({
      where: { tournamentTeamPlayerId: { in: playerIds } },
      _max: {
        points: true,
        total_rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
      },
    }),
  ]);

  return {
    careerAverages: aggregate._count.id > 0
      ? {
          gamesPlayed: aggregate._count.id,
          avgPoints: Number((aggregate._avg.points ?? 0).toFixed(1)),
          avgRebounds: Number((aggregate._avg.total_rebounds ?? 0).toFixed(1)),
          avgAssists: Number((aggregate._avg.assists ?? 0).toFixed(1)),
          avgSteals: Number((aggregate._avg.steals ?? 0).toFixed(1)),
          avgBlocks: Number((aggregate._avg.blocks ?? 0).toFixed(1)),
        }
      : null,
    seasonHighs: {
      maxPoints: maxStats._max.points ?? 0,
      maxRebounds: maxStats._max.total_rebounds ?? 0,
      maxAssists: maxStats._max.assists ?? 0,
    },
  };
}

/**
 * 이번 달 경기 참가 수 — 활동 링 월간 챌린지용
 */
export async function getMonthlyGames(userId: bigint) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const count = await prisma.game_applications.count({
    where: {
      user_id: userId,
      status: 1, // approved
      games: {
        scheduled_at: { gte: monthStart },
      },
    },
  }).catch(() => 0);

  return count;
}

/**
 * 유저 권한 확인 (게임 생성 시)
 */
export async function getUserPermissions(userId: bigint) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { membershipType: true, isAdmin: true },
  });
}
