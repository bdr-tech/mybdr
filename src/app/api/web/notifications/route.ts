import { NextResponse } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

// GET /api/web/notifications — unread count (헤더 벨 뱃지용)
export async function GET() {
  const session = await getWebSession();
  if (!session) {
    return NextResponse.json({ unreadCount: 0 });
  }

  const unreadCount = await prisma.notifications
    .count({
      where: {
        user_id: BigInt(session.sub),
        status: "unread",
      },
    })
    .catch(() => 0);

  return NextResponse.json({ unreadCount });
}

// PATCH /api/web/notifications — 전체 읽음 처리
export async function PATCH() {
  const session = await getWebSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
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

  return NextResponse.json({ success: true });
}
