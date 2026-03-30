/**
 * 게이미피케이션 서비스 (서버사이드 전용)
 *
 * 핵심 함수 4개:
 * - addXP: XP 누적 + 레벨업 자동 판정
 * - updateStreak: 연속 출석 갱신 (KST 기준)
 * - checkCourtBadges: 도장깨기 마일스톤 체크
 * - getLevelInfo: XP로 레벨/칭호/진행률 계산 (순수 함수)
 */

import { prisma } from "@/lib/db/prisma";
import { LEVELS, COURT_MILESTONES, LEVEL_BADGES, XP_REWARDS } from "@/lib/constants/gamification";

// ─────────────────────────────────────────
// getLevelInfo: XP로 현재 레벨 + 다음 레벨까지 진행률 계산
// 순수 함수라 클라이언트에서도 사용 가능 (DB 접근 없음)
// ─────────────────────────────────────────
export function getLevelInfo(xp: number) {
  // 현재 레벨 찾기: XP 이하인 레벨 중 가장 높은 것
  let currentLevel = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xp) {
      currentLevel = lvl;
    } else {
      break;
    }
  }

  // 다음 레벨 정보 (최대 레벨이면 null)
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1) ?? null;

  // 현재 레벨 내 진행률 (0~100%)
  let progress = 100; // 최대 레벨이면 100%
  if (nextLevel) {
    const levelXpRange = nextLevel.xp - currentLevel.xp; // 이 레벨에서 다음 레벨까지 필요 XP
    const xpInLevel = xp - currentLevel.xp;              // 이 레벨 내에서 모은 XP
    progress = Math.round((xpInLevel / levelXpRange) * 100);
  }

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    emoji: currentLevel.emoji,
    xp,
    progress,
    nextLevelXp: nextLevel?.xp ?? null,
    xpToNextLevel: nextLevel ? nextLevel.xp - xp : 0,
  };
}

// ─────────────────────────────────────────
// addXP: 유저에게 XP를 추가하고 레벨업 여부를 판정
// 레벨업 시 level 필드 업데이트 + 레벨 뱃지 체크
// 반환: { newXp, newLevel, leveledUp, levelUpBadge }
// ─────────────────────────────────────────
export async function addXP(userId: bigint, amount: number, _reason: string) {
  // atomic increment로 XP 추가 (동시 요청 시 유실 방지)
  // findUnique+update 대신 increment를 사용하면 DB가 원자적으로 처리
  let updatedUser;
  try {
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
      select: { xp: true, level: true },
    });
  } catch {
    // 유저가 존재하지 않으면 update가 실패함
    return null;
  }

  const oldLevel = updatedUser.level;
  const newXp = updatedUser.xp; // increment 후 반환된 최신 값

  // 새 레벨 계산
  const newLevelInfo = getLevelInfo(newXp);
  const leveledUp = newLevelInfo.level > oldLevel;

  // 레벨이 변경되었을 때만 추가 update (불필요한 쿼리 방지)
  if (leveledUp) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevelInfo.level },
    });
  }

  // 레벨업 시 뱃지 체크 (Lv5, Lv10 등 특별 레벨)
  let levelUpBadge: string | null = null;
  if (leveledUp) {
    const badge = LEVEL_BADGES.find((b) => b.level === newLevelInfo.level);
    if (badge) {
      // 중복 방지: upsert 사용
      await prisma.user_badges.upsert({
        where: {
          user_id_badge_type: { user_id: userId, badge_type: badge.badge_type },
        },
        create: {
          user_id: userId,
          badge_type: badge.badge_type,
          badge_name: badge.name,
          badge_data: { level: newLevelInfo.level },
        },
        update: {}, // 이미 있으면 변경 없음
      });
      levelUpBadge = badge.name;
    }
  }

  return {
    newXp,
    newLevel: newLevelInfo.level,
    newTitle: newLevelInfo.title,
    leveledUp,
    levelUpBadge,
  };
}

// ─────────────────────────────────────────
// updateStreak: 연속 출석 갱신 (KST 기준)
//
// 날짜 비교 로직:
// - streak_last_date가 "어제" → streak_count + 1
// - streak_last_date가 "오늘" → 변경 없음 (이미 갱신됨)
// - 그 외(이틀 이상 전 또는 null) → 1로 리셋
//
// 7일 달성 시 보너스 XP 자동 부여
// ─────────────────────────────────────────
export async function updateStreak(userId: bigint) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak_count: true, streak_last_date: true },
  });
  if (!user) return null;

  // 한국 시간(KST = UTC+9) 기준으로 "오늘" 날짜 계산
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayStr = nowKST.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // "어제" 날짜 계산
  const yesterdayKST = new Date(nowKST);
  yesterdayKST.setDate(yesterdayKST.getDate() - 1);
  const yesterdayStr = yesterdayKST.toISOString().slice(0, 10);

  // 마지막 스트릭 날짜를 KST 문자열로 변환
  let lastDateStr: string | null = null;
  if (user.streak_last_date) {
    // DB에 Date로 저장되므로 UTC 기준 → KST 변환
    const lastKST = new Date(user.streak_last_date.getTime() + 9 * 60 * 60 * 1000);
    lastDateStr = lastKST.toISOString().slice(0, 10);
  }

  let newStreak: number;
  let streakBonus = false;

  if (lastDateStr === todayStr) {
    // 오늘 이미 갱신됨 → 변경 없음
    return { streak: user.streak_count, bonus: false };
  } else if (lastDateStr === yesterdayStr) {
    // 어제 → 연속! streak_count + 1
    newStreak = user.streak_count + 1;
  } else {
    // 이틀 이상 전이거나 null → 리셋
    newStreak = 1;
  }

  // DB 업데이트: streak_last_date는 KST 자정을 정확히 저장
  // "+09:00"을 붙여야 KST 자정 = UTC 전날 15:00으로 정확히 변환됨
  // "Z"(UTC)를 쓰면 읽을 때 +9 보정 시 날짜가 어긋남
  await prisma.user.update({
    where: { id: userId },
    data: {
      streak_count: newStreak,
      streak_last_date: new Date(todayStr + "T00:00:00+09:00"),
    },
  });

  // 7일 달성 시 보너스 XP + 뱃지
  if (newStreak === 7) {
    await addXP(userId, XP_REWARDS.streak_7, "streak_7");
    // 스트릭 뱃지 부여
    await prisma.user_badges.upsert({
      where: {
        user_id_badge_type: { user_id: userId, badge_type: "streak_7" },
      },
      create: {
        user_id: userId,
        badge_type: "streak_7",
        badge_name: "7일 연속 출석!",
        badge_data: { streak: 7 },
      },
      update: {}, // 이미 있으면 변경 없음
    });
    streakBonus = true;
  }

  return { streak: newStreak, bonus: streakBonus };
}

// ─────────────────────────────────────────
// checkCourtBadges: 도장깨기 뱃지 체크
//
// court_sessions에서 유저가 방문한 DISTINCT 코트 수를 세고,
// 마일스톤(5/10/20/30/50곳)에 도달하면 뱃지를 부여한다.
// 반환: 새로 획득한 뱃지 이름 배열
// ─────────────────────────────────────────
export async function checkCourtBadges(userId: bigint) {
  // 유저가 체크아웃 완료한 고유 코트 수 조회
  // Prisma에서 DISTINCT count는 groupBy로 처리
  const distinctCourts = await prisma.court_sessions.groupBy({
    by: ["court_id"],
    where: {
      user_id: userId,
      checked_out_at: { not: null }, // 체크아웃 완료된 세션만
    },
  });
  const courtCount = distinctCourts.length;

  // 기존에 획득한 도장깨기 뱃지 조회
  const existingBadges = await prisma.user_badges.findMany({
    where: {
      user_id: userId,
      badge_type: { startsWith: "court_explorer_" },
    },
    select: { badge_type: true },
  });
  const existingTypes = new Set(existingBadges.map((b) => b.badge_type));

  // 달성한 마일스톤 중 아직 뱃지가 없는 것만 부여
  const newBadges: string[] = [];
  for (const milestone of COURT_MILESTONES) {
    if (courtCount >= milestone.count && !existingTypes.has(milestone.badge_type)) {
      await prisma.user_badges.create({
        data: {
          user_id: userId,
          badge_type: milestone.badge_type,
          badge_name: milestone.name,
          badge_data: { courts: courtCount },
        },
      });
      newBadges.push(milestone.name);
    }
  }

  return { courtCount, newBadges };
}

// ─────────────────────────────────────────
// completeSession: 체크아웃 시 게이미피케이션 일괄 처리
//
// $transaction으로 감싸서 addXP + updateStreak + checkCourtBadges를
// 하나의 단위로 실행한다. 하나라도 실패하면 전체 롤백.
// checkin/route.ts의 DELETE에서 이 함수 하나만 호출하면 된다.
// ─────────────────────────────────────────
export async function completeSession(userId: bigint, xpEarned: number) {
  // Interactive transaction: 콜백 안의 모든 DB 작업이 하나의 트랜잭션
  // 중간에 실패하면 자동 롤백되어 데이터 불일치 방지
  return await prisma.$transaction(async () => {
    // 1) 세션에서 계산된 XP를 User.xp에 누적
    const xpResult = await addXP(userId, xpEarned, "checkin");

    // 2) 연속 출석 갱신 (오늘 첫 체크아웃이면 +1)
    const streakResult = await updateStreak(userId);

    // 3) 도장깨기 마일스톤 체크 (방문 코트 수 -> 뱃지)
    const courtBadgeResult = await checkCourtBadges(userId);

    return { xpResult, streakResult, courtBadgeResult };
  });
}
