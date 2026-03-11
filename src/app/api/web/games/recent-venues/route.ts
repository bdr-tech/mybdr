import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/response";

export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  // 최근 게임에서 장소 정보를 가져와 중복 제거 후 최대 3개 반환
  const games = await prisma.games.findMany({
    where: {
      organizer_id: ctx.userId,
      city: { not: null },
    },
    select: {
      city: true,
      district: true,
      venue_name: true,
      venue_address: true,
    },
    orderBy: { created_at: "desc" },
    take: 20,
  });

  const seen = new Set<string>();
  const unique: typeof games = [];
  for (const g of games) {
    const key = `${g.city}|${g.district}|${g.venue_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(g);
      if (unique.length === 3) break;
    }
  }

  return apiSuccess({ venues: unique });
});
