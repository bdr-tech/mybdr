import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/web/notifications — unread count (헤더 벨 뱃지용)
export async function GET() {
  const session = await getWebSession();
  if (!session) {
    return apiSuccess({ unreadCount: 0 });
  }

  const unreadCount = await prisma.notifications
    .count({
      where: {
        user_id: BigInt(session.sub),
        status: "unread",
      },
    })
    .catch(() => 0);

  const response = apiSuccess({ unreadCount });
  // 30초 캐시: 빠른 연속 페이지 이동 시 DB 재쿼리 방지
  response.headers.set("Cache-Control", "private, max-age=30");
  return response;
}

// PATCH /api/web/notifications — 전체 읽음 처리
export async function PATCH() {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401);
  }

  await prisma.notifications
    .updateMany({
      where: {
        user_id: BigInt(session.sub),
        status: "unread",
      },
      data: {
        status: "read",
        read_at: new Date(),
      },
    })
    .catch(() => null);

  return apiSuccess({ success: true });
}
