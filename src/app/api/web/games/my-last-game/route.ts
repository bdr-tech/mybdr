import { type NextRequest } from "next/server";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/response";

export const GET = withWebAuth(async (req: NextRequest, ctx: WebAuthContext) => {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "3"), 5);

  const games = await prisma.games.findMany({
    where: {
      organizer_id: ctx.userId,
      status: { in: [1, 2, 3] }, // 모집중, 확정, 완료
    },
    select: {
      game_type: true,
      title: true,
      venue_name: true,
      venue_address: true,
      city: true,
      district: true,
      max_participants: true,
      fee_per_person: true,
      skill_level: true,
      duration_hours: true,
      scheduled_at: true,
      allow_guests: true,
      contact_phone: true,
    },
    orderBy: { created_at: "desc" },
    take: limit,
  });

  // Serialize — Decimal/BigInt 등을 JSON 안전한 형태로 변환
  const serialized = games.map((g) => ({
    game_type: g.game_type,
    title: g.title,
    venue_name: g.venue_name,
    venue_address: g.venue_address,
    city: g.city,
    district: g.district,
    max_participants: g.max_participants ?? 10,
    fee_per_person: Number(g.fee_per_person ?? 0),
    skill_level: g.skill_level,
    duration_hours: g.duration_hours ?? 2,
    scheduled_at: g.scheduled_at?.toISOString() ?? null,
    allow_guests: g.allow_guests ?? true,
    contact_phone: g.contact_phone,
  }));

  return apiSuccess({ games: serialized });
});
