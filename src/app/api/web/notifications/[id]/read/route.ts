import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * PATCH /api/web/notifications/[id]/read
 *   본인 알림 1건을 읽음 처리.
 *
 * 이유: 벨 드롭다운/목록에서 항목 클릭 시 자동으로 읽음 처리 호출.
 *      이미 read 상태면 멱등으로 200 반환.
 *
 * 보안: session.userId와 notification.user_id 일치 검증 (IDOR 방지).
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  let notifId: bigint;
  try {
    notifId = BigInt(id);
  } catch {
    return apiError("유효하지 않은 ID입니다.", 400, "BAD_REQUEST");
  }

  try {
    // 해당 알림 소유 확인
    const notification = await prisma.notifications.findUnique({
      where: { id: notifId },
      select: { user_id: true, status: true },
    });
    if (!notification) {
      return apiError("알림을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    // IDOR 방지 — 본인 알림이 아니면 거부 (존재 자체는 가려지지 않지만 403)
    if (notification.user_id.toString() !== session.sub) {
      return apiError("권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 이미 read 상태면 멱등 처리 — 굳이 updated_at을 바꾸지 않음
    if (notification.status === "read") {
      return apiSuccess({ already_read: true });
    }

    // unread → read 전환 + read_at 기록
    await prisma.notifications.update({
      where: { id: notifId },
      data: { status: "read", read_at: new Date() },
    });

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("[web/notifications/[id]/read] PATCH 실패:", error);
    return apiError("알림 읽음 처리 실패", 500, "INTERNAL_ERROR");
  }
}
