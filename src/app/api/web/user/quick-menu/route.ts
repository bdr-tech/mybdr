import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

const VALID_IDS = new Set([
  "find_game", "my_team", "tournaments", "pickup",
  "my_schedule", "stats", "community", "ranking", "venue", "notifications",
]);
const MAX_ITEMS = 4;

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(session.sub) },
      select: { quickMenuItems: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ menu_items: user.quickMenuItems });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { menu_items } = await req.json() as { menu_items: string[] };

    if (!Array.isArray(menu_items) || menu_items.length === 0 || menu_items.length > MAX_ITEMS) {
      return NextResponse.json({ error: `메뉴는 1~${MAX_ITEMS}개 선택해야 합니다.` }, { status: 400 });
    }
    if (!menu_items.every((id) => VALID_IDS.has(id))) {
      return NextResponse.json({ error: "유효하지 않은 메뉴 ID" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: BigInt(session.sub) },
      data: { quickMenuItems: menu_items },
    });

    return NextResponse.json({ menu_items });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
