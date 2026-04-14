import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import type { NextRequest } from "next/server";

/**
 * GET /api/web/notifications
 *   - 기본(list 미지정): unreadCount만 반환 (헤더 벨 뱃지용, 30초 캐시)
 *   - ?list=true: 본인 알림 목록 + total + unread_count 반환
 *     쿼리: unread_only=true / page=1 / limit=20(최대 100)
 *
 * 이유: 기존 헤더 뱃지용 엔드포인트를 깨지 않으면서, referee 플랫폼 벨 드롭다운/
 *      전체 목록 페이지가 동일 경로를 재사용하도록 list 모드 추가.
 *      본인 알림만 반환(user_id = session.userId)으로 IDOR 자동 차단.
 */
export async function GET(req: NextRequest) {
  const session = await getWebSession();
  if (!session) {
    return apiSuccess({ unreadCount: 0 });
  }

  const userId = BigInt(session.sub);
  const { searchParams } = new URL(req.url);
  const listMode = searchParams.get("list") === "true";

  // list 모드가 아니면 기존 동작 유지 (헤더 벨 뱃지용 unreadCount만)
  if (!listMode) {
    const unreadCount = await prisma.notifications
      .count({
        where: { user_id: userId, status: "unread" },
      })
      .catch(() => 0);

    const response = apiSuccess({ unreadCount });
    // 30초 캐시: 빠른 연속 페이지 이동 시 DB 재쿼리 방지
    response.headers.set("Cache-Control", "private, max-age=30");
    return response;
  }

  // list 모드 — 페이지네이션 + unread_only 필터
  const unreadOnly = searchParams.get("unread_only") === "true";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? "20"))
  );
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { user_id: userId };
  if (unreadOnly) where.status = "unread";

  try {
    // 목록/전체 건수/안읽음 건수 병렬 — 인덱스(user_id+created_at / user_id+status) 활용
    const [items, total, unread_count] = await Promise.all([
      prisma.notifications.findMany({
        where,
        orderBy: [{ created_at: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          notification_type: true,
          title: true,
          content: true,
          action_url: true,
          action_type: true,
          status: true,
          read_at: true,
          created_at: true,
        },
      }),
      prisma.notifications.count({ where }),
      // unread_count는 unread_only 상관없이 "전체 안읽음 수"
      prisma.notifications.count({
        where: { user_id: userId, status: "unread" },
      }),
    ]);

    return apiSuccess({ items, total, unread_count, page, limit });
  } catch (error) {
    console.error("[web/notifications] GET list 실패:", error);
    return apiError("알림을 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
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
