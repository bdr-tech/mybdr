import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ venues: [] });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ venues: [] });

  const userId = BigInt(session.sub);

  // 최근 게임에서 장소 정보를 가져와 중복 제거 후 최대 3개 반환
  const games = await prisma.games.findMany({
    where: {
      organizer_id: userId,
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

  return NextResponse.json({ venues: unique });
}
