import { NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/web/notifications — 알림 목록 + unread count
// ?list=true → 전체 목록 반환, 없으면 카운트만 (헤더 벨 뱃지용)
export async function GET(request: NextRequest) {
  const session = await getWebSession();
  if (!session) {
    return apiSuccess({ unreadCount: 0, notifications: [] });
  }

  const userId = BigInt(session.sub);
  const wantList = request.nextUrl.searchParams.get("list") === "true";

  if (!wantList) {
    const unreadCount = await prisma.notifications
      .count({ where: { user_id: userId, status: "unread" } })
      .catch(() => 0);

    const response = apiSuccess({ unreadCount });
    response.headers.set("Cache-Control", "private, max-age=30");
    return response;
  }

  // 알림 목록 (최신 50개)
  const [notifications, unreadCount] = await Promise.all([
    prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        content: true,
        notification_type: true,
        status: true,
        action_url: true,
        created_at: true,
        read_at: true,
      },
    }).catch(() => []),
    prisma.notifications
      .count({ where: { user_id: userId, status: "unread" } })
      .catch(() => 0),
  ]);

  return apiSuccess({
    unreadCount,
    notifications: notifications.map((n) => ({
      id: n.id.toString(),
      title: n.title,
      content: n.content,
      type: n.notification_type,
      status: n.status,
      actionUrl: n.action_url,
      createdAt: n.created_at?.toISOString() ?? null,
      readAt: n.read_at?.toISOString() ?? null,
    })),
  });
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
