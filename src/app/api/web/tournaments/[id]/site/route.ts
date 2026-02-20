import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/web/tournaments/[id]/site
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const site = await prisma.tournamentSite.findFirst({
    where: { tournamentId: id },
    include: { site_pages: true },
  });

  return toJSON(site);
}

// PATCH /api/web/tournaments/[id]/site
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { subdomain, primaryColor, secondaryColor, site_name, meta_title, meta_description } =
    body as Record<string, string | null | undefined>;

  const existing = await prisma.tournamentSite.findFirst({ where: { tournamentId: id } });

  if (!existing) {
    // 사이트 없으면 생성
    if (!subdomain?.trim())
      return NextResponse.json({ error: "서브도메인이 필요합니다." }, { status: 400 });

    const site = await prisma.tournamentSite.create({
      data: {
        tournamentId: id,
        subdomain: subdomain.trim().toLowerCase(),
        primaryColor: primaryColor ?? "#F4A261",
        secondaryColor: secondaryColor ?? "#E76F51",
        site_name: site_name ?? null,
        meta_title: meta_title ?? null,
        meta_description: meta_description ?? null,
        isPublished: false,
      },
    });
    return toJSON(site);
  }

  // 서브도메인 중복 체크 (자기 자신 제외)
  if (subdomain && subdomain !== existing.subdomain) {
    const dup = await prisma.tournamentSite.findFirst({
      where: { subdomain: subdomain.trim().toLowerCase(), id: { not: existing.id } },
    });
    if (dup)
      return NextResponse.json({ error: "이미 사용 중인 서브도메인입니다." }, { status: 409 });
  }

  const updated = await prisma.tournamentSite.update({
    where: { id: existing.id },
    data: {
      ...(subdomain != null && subdomain !== undefined && { subdomain: subdomain.trim().toLowerCase() }),
      ...(primaryColor !== undefined && { primaryColor }),
      ...(secondaryColor !== undefined && { secondaryColor }),
      ...(site_name !== undefined && { site_name: site_name ?? null }),
      ...(meta_title !== undefined && { meta_title: meta_title ?? null }),
      ...(meta_description !== undefined && { meta_description: meta_description ?? null }),
    },
  });

  return toJSON(updated);
}
