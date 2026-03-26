import { NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

// POST /api/web/notifications/read — 개별 알림 읽음 처리
// body: { id: string }
export async function POST(request: NextRequest) {
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  if (!body.id) return apiError("알림 ID가 필요합니다.", 400);

  let notifId: bigint;
  try {
    notifId = BigInt(body.id);
  } catch {
    return apiError("잘못된 알림 ID입니다.", 400);
  }

  // IDOR 방지: 본인 알림만 읽음 처리
  await prisma.notifications.updateMany({
    where: {
      id: notifId,
      user_id: BigInt(session.sub),
      status: "unread",
    },
    data: {
      status: "read",
      read_at: new Date(),
    },
  });

  return apiSuccess({ success: true });
}
