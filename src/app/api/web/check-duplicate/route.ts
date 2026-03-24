import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const value = req.nextUrl.searchParams.get("value")?.trim();

  if (!type || !value) {
    return NextResponse.json({ error: "type과 value가 필요합니다." }, { status: 400 });
  }

  if (type === "email") {
    const exists = await prisma.user.findUnique({ where: { email: value }, select: { id: true } });
    return NextResponse.json({ available: !exists });
  }

  if (type === "nickname") {
    const exists = await prisma.user.findFirst({
      where: { nickname: { equals: value, mode: "insensitive" } },
      select: { id: true },
    });
    return NextResponse.json({ available: !exists });
  }

  return NextResponse.json({ error: "type은 email 또는 nickname이어야 합니다." }, { status: 400 });
}
