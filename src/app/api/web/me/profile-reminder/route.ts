import { NextResponse } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

// PATCH /api/web/me/profile-reminder
// 프로필 완성 안내를 오늘 표시했음을 기록 (fire-and-forget)
export async function PATCH() {
  const session = await getWebSession();
  if (!session) return NextResponse.json({});

  await prisma.user
    .update({
      where: { id: BigInt(session.sub) },
      data: { profileReminderShownAt: new Date() },
    })
    .catch(() => null);

  return NextResponse.json({ success: true });
}
