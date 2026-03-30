/**
 * GET /api/web/profile/gamification
 *
 * 내 게이미피케이션 종합 현황 조회 (인증 필수)
 * - XP, 레벨, 칭호, 다음 레벨 진행률
 * - 스트릭 (연속 출석 일수)
 * - 뱃지 컬렉션
 * - 도장깨기 현황 (방문 코트 수 + 마일스톤)
 */

import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getLevelInfo } from "@/lib/services/gamification";
import { COURT_MILESTONES } from "@/lib/constants/gamification";

export async function GET() {
  // 인증 확인
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const userId = BigInt(session.sub);

  // 유저 XP/레벨/스트릭 조회
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
      streak_count: true,
      streak_last_date: true,
    },
  });

  if (!user) {
    return apiError("유저를 찾을 수 없습니다", 404, "NOT_FOUND");
  }

  // 레벨 상세 정보 계산
  const levelInfo = getLevelInfo(user.xp);

  // 뱃지 컬렉션 조회
  const badges = await prisma.user_badges.findMany({
    where: { user_id: userId },
    orderBy: { earned_at: "desc" },
  });

  // 도장깨기 현황: 방문한 고유 코트 수
  const distinctCourts = await prisma.court_sessions.groupBy({
    by: ["court_id"],
    where: {
      user_id: userId,
      checked_out_at: { not: null },
    },
  });
  const courtCount = distinctCourts.length;

  // 마일스톤 진행 상황 계산
  const milestones = COURT_MILESTONES.map((m) => ({
    count: m.count,
    name: m.name,
    icon: m.icon,
    achieved: courtCount >= m.count,
  }));

  // 다음 미달성 마일스톤
  const nextMilestone = milestones.find((m) => !m.achieved) ?? null;

  return apiSuccess({
    xp: user.xp,
    level: levelInfo.level,
    title: levelInfo.title,
    emoji: levelInfo.emoji,
    progress: levelInfo.progress,
    nextLevelXp: levelInfo.nextLevelXp,
    xpToNextLevel: levelInfo.xpToNextLevel,
    streak: user.streak_count,
    streakLastDate: user.streak_last_date?.toISOString() ?? null,
    badges: badges.map((b) => ({
      id: b.id.toString(),
      badgeType: b.badge_type,
      badgeName: b.badge_name,
      badgeData: b.badge_data,
      earnedAt: b.earned_at.toISOString(),
    })),
    courtStamps: {
      count: courtCount,
      milestones,
      nextMilestone,
    },
  });
}
