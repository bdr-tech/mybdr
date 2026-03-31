import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * slug 생성: 한글 이름을 그대로 slug로 쓸 수 없으므로
 * 영문/숫자만 남기고, 빈 결과면 "org" + 랜덤 suffix 부여
 */
function generateSlug(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const base = ascii || "org";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

/**
 * POST /api/web/organizations — 단체 생성
 * 필수: name, slug(선택), description, region
 * 생성 시 organization_members에 owner로 자동 추가
 */
export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const name = (body.name as string)?.trim();
    const description = (body.description as string)?.trim() || null;
    const region = (body.region as string)?.trim() || null;
    const customSlug = (body.slug as string)?.trim();
    const logoUrl = (body.logo_url as string)?.trim() || null;
    const contactEmail = (body.contact_email as string)?.trim() || null;
    const websiteUrl = (body.website_url as string)?.trim() || null;

    // 이름 필수 검증
    if (!name) {
      return apiError("단체 이름은 필수입니다.", 400);
    }

    // slug 결정: 커스텀이 있으면 사용, 없으면 이름 기반 자동 생성
    let slug = customSlug
      ? customSlug
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
      : generateSlug(name);

    // slug 중복 방지: 이미 존재하면 랜덤 suffix 추가
    const existing = await prisma.organizations.findUnique({
      where: { slug },
    });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
    }

    // 트랜잭션: 단체 생성 + 소유자 멤버 자동 추가를 원자적으로 처리
    const org = await prisma.$transaction(async (tx) => {
      const created = await tx.organizations.create({
        data: {
          name,
          slug,
          description,
          region,
          logo_url: logoUrl,
          contact_email: contactEmail,
          website_url: websiteUrl,
          owner_id: ctx.userId,
          status: "active",
          is_public: true,
          series_count: 0,
        },
      });

      // 소유자를 멤버 테이블에 "owner" 역할로 자동 추가
      await tx.organization_members.create({
        data: {
          organization_id: created.id,
          user_id: ctx.userId,
          role: "owner",
          is_active: true,
        },
      });

      return created;
    });

    return apiSuccess({
      success: true,
      id: org.id.toString(),
      uuid: org.uuid,
      slug: org.slug,
      name: org.name,
    });
  } catch {
    return apiError("단체 생성 중 오류가 발생했습니다.", 500);
  }
});

/**
 * GET /api/web/organizations — 내가 소속된 단체 목록
 * organization_members에서 user_id로 조인 조회
 */
export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  try {
    // 내가 멤버로 있는 단체들을 조회 (역할 정보 포함)
    const memberships = await prisma.organization_members.findMany({
      where: { user_id: ctx.userId, is_active: true },
      include: {
        organization: {
          select: {
            id: true,
            uuid: true,
            name: true,
            slug: true,
            logo_url: true,
            region: true,
            status: true,
            series_count: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const orgs = memberships.map((m) => ({
      id: m.organization.id.toString(),
      uuid: m.organization.uuid,
      name: m.organization.name,
      slug: m.organization.slug,
      logoUrl: m.organization.logo_url,
      region: m.organization.region,
      status: m.organization.status,
      seriesCount: m.organization.series_count,
      myRole: m.role, // 내 역할 (owner/admin/member)
      createdAt: m.organization.created_at,
    }));

    return apiSuccess({ organizations: orgs });
  } catch {
    return apiError("단체 목록 조회 중 오류가 발생했습니다.", 500);
  }
});
