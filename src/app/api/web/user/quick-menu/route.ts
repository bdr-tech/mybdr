import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

const VALID_IDS = new Set([
  "find_game", "my_team", "tournaments", "pickup",
  "my_schedule", "stats", "community", "ranking", "venue", "notifications",
]);
const MAX_ITEMS = 4;

export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { quickMenuItems: true },
    });
    if (!user) return apiError("Not found", 404);

    return apiSuccess({ menu_items: user.quickMenuItems });
  } catch {
    return apiError("Internal error", 500);
  }
});

export const PUT = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const { menu_items } = await req.json() as { menu_items: string[] };

    if (!Array.isArray(menu_items) || menu_items.length === 0 || menu_items.length > MAX_ITEMS) {
      return apiError(`메뉴는 1~${MAX_ITEMS}개 선택해야 합니다.`, 400);
    }
    if (!menu_items.every((id) => VALID_IDS.has(id))) {
      return apiError("유효하지 않은 메뉴 ID", 400);
    }

    await prisma.user.update({
      where: { id: ctx.userId },
      data: { quickMenuItems: menu_items },
    });

    return apiSuccess({ menu_items });
  } catch {
    return apiError("Internal error", 500);
  }
});
