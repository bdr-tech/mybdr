import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getPlayerStats, getMonthlyGames } from "@/lib/services/user";

export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  try {
    const [stats, monthlyGames] = await Promise.all([
      getPlayerStats(ctx.userId),
      getMonthlyGames(ctx.userId),
    ]);
    return apiSuccess({ ...stats, monthlyGames });
  } catch {
    return apiError("스탯 조회 실패", 500);
  }
});
