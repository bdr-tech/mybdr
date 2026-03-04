import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";

type Ctx = { params: Promise<{ id: string }> };

// TC-NEW-017: 서브도메인 포맷 검증 (영문 소문자, 숫자, 하이픈, 3-63자)
const SUBDOMAIN_RE = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$|^[a-z0-9]{2,3}$/;
// TC-NEW-019: HEX 색상 코드 검증
const HEX_COLOR_RE = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

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

  const { subdomain, primaryColor, secondaryColor, site_name, meta_title, meta_description, siteTemplateSlug } =
    body as Record<string, string | null | undefined>;

  // TC-NEW-017: 서브도메인 포맷 검증
  if (subdomain !== undefined && subdomain !== null && subdomain.trim() !== "") {
    const sub = subdomain.trim().toLowerCase();
    if (!SUBDOMAIN_RE.test(sub)) {
      return NextResponse.json(
        { error: "서브도메인은 영문 소문자, 숫자, 하이픈만 사용 가능합니다 (3-63자)." },
        { status: 400 }
      );
    }
  }

  // TC-NEW-019: HEX 색상 코드 검증
  if (primaryColor !== undefined && primaryColor !== null && !HEX_COLOR_RE.test(primaryColor)) {
    return NextResponse.json({ error: "유효하지 않은 primaryColor 색상 코드입니다." }, { status: 400 });
  }
  if (secondaryColor !== undefined && secondaryColor !== null && !HEX_COLOR_RE.test(secondaryColor)) {
    return NextResponse.json({ error: "유효하지 않은 secondaryColor 색상 코드입니다." }, { status: 400 });
  }

  // 템플릿 slug → id 변환
  let siteTemplateId: bigint | null | undefined = undefined;
  if (siteTemplateSlug !== undefined) {
    if (siteTemplateSlug) {
      const tpl = await prisma.siteTemplate.findUnique({ where: { slug: siteTemplateSlug }, select: { id: true } });
      siteTemplateId = tpl?.id ?? null;
    } else {
      siteTemplateId = null;
    }
  }

  const existing = await prisma.tournamentSite.findFirst({ where: { tournamentId: id } });

  if (!existing) {
    // 사이트 없으면 생성
    if (!subdomain?.trim())
      return NextResponse.json({ error: "서브도메인이 필요합니다." }, { status: 400 });

    try {
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
          ...(siteTemplateId !== undefined && { siteTemplateId }),
        },
      });
      return toJSON(site);
    } catch (e) {
      // TC-NEW-018: 동시 중복 서브도메인 요청 처리
      if ((e as { code?: string }).code === "P2002") {
        return NextResponse.json({ error: "이미 사용 중인 서브도메인입니다." }, { status: 409 });
      }
      throw e;
    }
  }

  // 서브도메인 중복 체크 (자기 자신 제외)
  if (subdomain && subdomain !== existing.subdomain) {
    const dup = await prisma.tournamentSite.findFirst({
      where: { subdomain: subdomain.trim().toLowerCase(), id: { not: existing.id } },
    });
    if (dup)
      return NextResponse.json({ error: "이미 사용 중인 서브도메인입니다." }, { status: 409 });
  }

  try {
    const updated = await prisma.tournamentSite.update({
      where: { id: existing.id },
      data: {
        ...(subdomain != null && subdomain !== undefined && { subdomain: subdomain.trim().toLowerCase() }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(secondaryColor !== undefined && { secondaryColor }),
        ...(site_name !== undefined && { site_name: site_name ?? null }),
        ...(meta_title !== undefined && { meta_title: meta_title ?? null }),
        ...(meta_description !== undefined && { meta_description: meta_description ?? null }),
        ...(siteTemplateId !== undefined && { siteTemplateId }),
      },
    });

    return toJSON(updated);
  } catch (e) {
    // TC-NEW-018: 동시 중복 서브도메인 요청 처리
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "이미 사용 중인 서브도메인입니다." }, { status: 409 });
    }
    throw e;
  }
}
