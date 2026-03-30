/**
 * GET /api/cron/weekly-report
 *
 * Vercel Cron: 매주 월요일 KST 09:00 (UTC 00:00) 실행
 * - 지난주에 1회 이상 운동한 유저에게 "주간 리포트가 도착했어요" 알림 생성
 * - notifications 테이블에 INSERT하여 앱 내 알림으로 전달
 * - CRON_SECRET 헤더 검증으로 외부 호출 차단
 */

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  // Vercel Cron 인증: CRON_SECRET 헤더 검증
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  // 지난주 월~일 범위 계산 (KST 기준)
  const kstOffset = 9 * 60 * 60 * 1000;
  const nowKST = new Date(Date.now() + kstOffset);
  const todayKST = new Date(
    Date.UTC(nowKST.getUTCFullYear(), nowKST.getUTCMonth(), nowKST.getUTCDate())
  );

  const dayMs = 24 * 60 * 60 * 1000;
  const dayOfWeek = todayKST.getUTCDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // 이번주 월요일 KST 자정 (UTC)
  const thisMonday = new Date(todayKST.getTime() - daysFromMonday * dayMs);
  // 지난주 월~일 범위
  const lastWeekStart = new Date(thisMonday.getTime() - 7 * dayMs - kstOffset);
  const lastWeekEnd = new Date(thisMonday.getTime() - kstOffset);

  // 지난주에 체크아웃 완료한 세션이 있는 유저 목록 조회
  // groupBy로 유저별 세션 수와 총 운동 시간을 한번에 집계
  const userSessions = await prisma.court_sessions.groupBy({
    by: ["user_id"],
    where: {
      checked_in_at: { gte: lastWeekStart, lt: lastWeekEnd },
      checked_out_at: { not: null },
    },
    _count: { id: true },
    _sum: { duration_minutes: true },
  });

  if (userSessions.length === 0) {
    return apiSuccess({
      success: true,
      message: "지난주 운동 유저 없음",
      notificationsSent: 0,
    });
  }

  // 유저별 알림 메시지 생성
  const inputs = userSessions.map((row) => {
    const sessions = row._count.id;
    const minutes = row._sum.duration_minutes ?? 0;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    // 운동 시간 포맷: "2시간 30분" 또는 "45분"
    const timeStr =
      hours > 0
        ? mins > 0
          ? `${hours}시간 ${mins}분`
          : `${hours}시간`
        : `${mins}분`;

    return {
      userId: row.user_id,
      notificationType: NOTIFICATION_TYPES.WEEKLY_REPORT,
      title: "주간 운동 리포트가 도착했어요",
      content: `지난주 ${sessions}회 운동, 총 ${timeStr}! 자세한 리포트를 확인해보세요.`,
      actionUrl: "/profile/weekly-report",
    };
  });

  // 일괄 알림 생성
  await createNotificationBulk(inputs);

  return apiSuccess({
    success: true,
    notificationsSent: inputs.length,
    usersProcessed: userSessions.length,
  });
}
