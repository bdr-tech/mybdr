import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const teamCount = await prisma.team.count();
    const teams = await prisma.team.findMany({
      where: { status: "active", is_public: true },
      take: 3,
      select: { id: true, name: true, status: true, is_public: true },
    });
    return NextResponse.json({
      ok: true,
      teamCount,
      teams: teams.map((t) => ({ ...t, id: t.id.toString() })),
      dbUrl: process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ":***@"),
    });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
