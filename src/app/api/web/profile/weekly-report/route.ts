/**
 * GET /api/web/profile/weekly-report
 *
 * 주간 운동 리포트 API (인증 필수)
 * - 이번주(월~현재)와 지난주(월~일) 운동 데이터를 집계
 * - court_sessions 테이블에서 체크아웃 완료된 세션만 집계
 * - DB 추가 없이 기존 테이블(court_sessions, User)만 활용
 */

import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getLevelInfo } from "@/lib/services/gamification";

// KST(한국시간) 기준으로 이번주 월요일 자정과 지난주 월요일 자정을 계산
// 월요일 = 1 (JS Date에서 일요일 = 0)
function getWeekBoundariesKST() {
  const kstOffset = 9 * 60 * 60 * 1000;
  const nowKST = new Date(Date.now() + kstOffset);

  // KST 기준 "오늘" 자정 (UTC 시각으로 변환)
  const todayKST = new Date(
    Date.UTC(nowKST.getUTCFullYear(), nowKST.getUTCMonth(), nowKST.getUTCDate())
  );

  // 이번주 월요일 구하기 (일요일=0이면 -6, 월요일=1이면 0, ...)
  const dayOfWeek = todayKST.getUTCDay(); // 0(일)~6(토)
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const dayMs = 24 * 60 * 60 * 1000;

  // 이번주 월요일 KST 자정 (UTC 시각)
  const thisMonday = new Date(todayKST.getTime() - daysFromMonday * dayMs);
  // 지난주 월요일 KST 자정
  const lastMonday = new Date(thisMonday.getTime() - 7 * dayMs);
  // 지난주 일요일 KST 자정 (= 이번주 월요일)
  const lastSunday = thisMonday;

  // UTC로 변환: KST 자정 = UTC 전날 15:00
  return {
    thisWeekStart: new Date(thisMonday.getTime() - kstOffset),
    lastWeekStart: new Date(lastMonday.getTime() - kstOffset),
    lastWeekEnd: new Date(lastSunday.getTime() - kstOffset),
  };
}

// 특정 기간의 세션 데이터를 집계하는 헬퍼 함수
async function aggregateWeek(userId: bigint, start: Date, end: Date) {
  // 체크아웃 완료된 세션만 집계 (duration_minutes가 있는 것)
  const sessions = await prisma.court_sessions.findMany({
    where: {
      user_id: userId,
      checked_in_at: { gte: start, lt: end },
      checked_out_at: { not: null },
    },
    select: {
      court_id: true,
      duration_minutes: true,
      xp_earned: true,
      checked_in_at: true,
      court_infos: {
        select: { name: true },
      },
    },
    orderBy: { checked_in_at: "desc" },
  });

  // 총 운동 시간 (분)
  const totalMinutes = sessions.reduce(
    (sum, s) => sum + (s.duration_minutes ?? 0),
    0
  );

  // 방문한 고유 코트 수
  const uniqueCourtIds = new Set(sessions.map((s) => s.court_id.toString()));

  // 획득 XP 합계
  const totalXp = sessions.reduce((sum, s) => sum + s.xp_earned, 0);

  // 운동 일수 (같은 날 여러 세션이면 하루로 카운트)
  const kstOffset = 9 * 60 * 60 * 1000;
  const uniqueDays = new Set(
    sessions.map((s) => {
      const kst = new Date(s.checked_in_at.getTime() + kstOffset);
      return kst.toISOString().slice(0, 10); // "YYYY-MM-DD"
    })
  );

  // 가장 많이 방문한 코트 (top 3)
  const courtVisits: Record<string, { name: string; count: number }> = {};
  for (const s of sessions) {
    const key = s.court_id.toString();
    if (!courtVisits[key]) {
      courtVisits[key] = { name: s.court_infos.name ?? "알 수 없음", count: 0 };
    }
    courtVisits[key].count++;
  }
  const topCourts = Object.entries(courtVisits)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([courtId, data]) => ({
      courtId,
      name: data.name,
      visits: data.count,
    }));

  return {
    sessionCount: sessions.length,
    totalMinutes,
    uniqueCourts: uniqueCourtIds.size,
    activeDays: uniqueDays.size,
    totalXp,
    topCourts,
  };
}

export async function GET() {
  // 인증 확인
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const userId = BigInt(session.sub);

  // 유저 정보 조회 (XP/레벨/스트릭)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
      streak_count: true,
      nickname: true,
    },
  });

  if (!user) {
    return apiError("유저를 찾을 수 없습니다", 404, "NOT_FOUND");
  }

  // 주간 경계 계산
  const { thisWeekStart, lastWeekStart, lastWeekEnd } = getWeekBoundariesKST();

  // 이번주 + 지난주 집계를 병렬로 실행 (성능 최적화)
  const [thisWeek, lastWeek] = await Promise.all([
    aggregateWeek(userId, thisWeekStart, new Date()), // 이번주: 월요일 ~ 현재
    aggregateWeek(userId, lastWeekStart, lastWeekEnd), // 지난주: 월~일
  ]);

  // 레벨 정보
  const levelInfo = getLevelInfo(user.xp);

  // 지난주 대비 변화율 계산
  const minutesChange =
    lastWeek.totalMinutes > 0
      ? Math.round(
          ((thisWeek.totalMinutes - lastWeek.totalMinutes) /
            lastWeek.totalMinutes) *
            100
        )
      : thisWeek.totalMinutes > 0
        ? 100
        : 0;

  return apiSuccess({
    nickname: user.nickname ?? "사용자",
    level: levelInfo.level,
    title: levelInfo.title,
    emoji: levelInfo.emoji,
    streak: user.streak_count,
    thisWeek,
    lastWeek,
    // 지난주 대비 운동 시간 변화율 (%, 양수=증가)
    minutesChange,
    // 리포트 기간 표시용
    period: {
      thisWeekStart: thisWeekStart.toISOString(),
      lastWeekStart: lastWeekStart.toISOString(),
      lastWeekEnd: lastWeekEnd.toISOString(),
    },
  });
}
