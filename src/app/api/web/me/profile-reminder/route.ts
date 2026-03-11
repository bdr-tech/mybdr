import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/response";

// PATCH /api/web/me/profile-reminder
// 프로필 완성 안내를 오늘 표시했음을 기록 (fire-and-forget)
export async function PATCH() {
  const session = await getWebSession();
  if (!session) return apiSuccess({});

  await prisma.user
    .update({
      where: { id: BigInt(session.sub) },
      data: { profileReminderShownAt: new Date() },
    })
    .catch(() => null);

  return apiSuccess({ success: true });
}
