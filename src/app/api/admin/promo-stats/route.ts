import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/admin/promo-stats
// 프로모션 무료 유저 수 (subscription_expires_at = NULL이고 membershipType > 0)
export async function GET() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") {
    return apiError("Unauthorized", 401);
  }

  const results = await Promise.all(
    [1, 2, 3].map(async (mt) => {
      const count = await prisma.user.count({
        where: {
          membershipType: mt,
          subscription_expires_at: null,
        },
      });
      return { membershipType: mt, count };
    })
  );

  return apiSuccess(results);
}
