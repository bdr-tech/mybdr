import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/web/tournaments/[id]/site/publish
// body: { publish: boolean }
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: { publish?: boolean } = {};
  try {
    body = await req.json();
  } catch { /* optional */ }

  const site = await prisma.tournamentSite.findFirst({ where: { tournamentId: id } });
  if (!site)
    return NextResponse.json({ error: "사이트가 없습니다. 먼저 사이트를 설정하세요." }, { status: 404 });

  const publish = body.publish ?? !site.isPublished;

  const updated = await prisma.tournamentSite.update({
    where: { id: site.id },
    data: {
      isPublished: publish,
      ...(publish && !site.published_at && { published_at: new Date() }),
    },
  });

  return toJSON(updated);
}
