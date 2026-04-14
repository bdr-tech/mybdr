import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * POST /api/web/notifications/read-all
 *   본인 알림 전체를 읽음 처리.
 *
 * 이유: referee 플랫폼 벨 드롭다운/목록 페이지의 "전체 읽음" 버튼 전용.
 *      기존 PATCH /api/web/notifications과 동일 동작이지만, REST 관용상
 *      "대량 업데이트" 의도를 명확히 하기 위해 /read-all 경로로 분리.
 */
export async function POST() {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }

  try {
    // 본인 unread 알림 전체를 read로 전환 + read_at 현재시각 기록
    const result = await prisma.notifications.updateMany({
      where: {
        user_id: BigInt(session.sub),
        status: "unread",
      },
      data: {
        status: "read",
        read_at: new Date(),
      },
    });

    return apiSuccess({ updated: result.count });
  } catch (error) {
    console.error("[web/notifications/read-all] POST 실패:", error);
    return apiError("전체 읽음 처리 실패", 500, "INTERNAL_ERROR");
  }
}
