import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

// POST /api/cron/notification-cleanup — 30일 이상 된 알림 자동 삭제
// Vercel Cron: 매일 03:00 KST 실행
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.notifications.deleteMany({
    where: {
      created_at: { lt: thirtyDaysAgo },
    },
  });

  return apiSuccess({ deleted: result.count });
}
