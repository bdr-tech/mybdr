import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess } from "@/lib/api/response";
import { getMyTournaments } from "@/lib/services/tournament";

// FR-022: 내 토너먼트 목록 API
// 주최자 / admin member / 기록원 / super_admin 모두 포함
async function handler(_req: NextRequest, ctx: AuthContext) {
  const userId = BigInt(ctx.userId);
  const isSuperAdmin = ctx.userRole === "super_admin";

  const data = await getMyTournaments(userId, isSuperAdmin);

  return apiSuccess({ success: true, data });
}

export const GET = withErrorHandler(withAuth(handler));
