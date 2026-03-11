import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

function generateSlug(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const base = ascii || "series";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const body = await req.json() as Record<string, unknown>;
    const name = (body.name as string)?.trim();
    const description = (body.description as string)?.trim() || null;
    const customSlug = (body.slug as string)?.trim();

    if (!name) {
      return apiError("시리즈 이름은 필수입니다.", 400);
    }

    // 슈퍼관리자는 구독 체크 우회
    if (ctx.session.role !== "super_admin") {
      const sub = await prisma.user_subscriptions.findFirst({
        where: {
          user_id: ctx.userId,
          feature_key: "tournament_create",
          status: "active",
          OR: [{ expires_at: null }, { expires_at: { gte: new Date() } }],
        },
      });
      if (!sub) {
        return apiError("UPGRADE_REQUIRED", 402);
      }
    }

    // slug 결정 및 중복 방지
    let slug = customSlug
      ? customSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
      : generateSlug(name);

    const existing = await prisma.tournament_series.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
    }

    const series = await prisma.tournament_series.create({
      data: {
        uuid: crypto.randomUUID(),
        name,
        slug,
        description,
        organizer_id: ctx.userId,
        status: "active",
        is_public: true,
        tournaments_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return apiSuccess({
      success: true,
      id: series.id.toString(),
      uuid: series.uuid,
      slug: series.slug,
      name: series.name,
    });
  } catch {
    return apiError("시리즈 생성 중 오류가 발생했습니다.", 500);
  }
});
