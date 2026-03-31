import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * Admin 캠페인 관리 API
 * GET /api/admin/campaigns — 전체 캠페인 목록
 */

async function requireAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") return null;
  return session;
}

// 캠페인 목록 조회 (status 필터 지원)
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const campaigns = await prisma.ad_campaigns.findMany({
    where: status ? { status } : undefined,
    orderBy: { created_at: "desc" },
    include: {
      partner: { select: { id: true, name: true, logo_url: true } },
      _count: { select: { placements: true } },
    },
  });

  return apiSuccess(
    campaigns.map((c) => ({
      id: c.id.toString(),
      uuid: c.uuid,
      partner_id: c.partner_id.toString(),
      partner_name: c.partner.name,
      partner_logo: c.partner.logo_url,
      title: c.title,
      headline: c.headline,
      description: c.description,
      image_url: c.image_url,
      link_url: c.link_url,
      cta_text: c.cta_text,
      status: c.status,
      start_date: c.start_date,
      end_date: c.end_date,
      impressions: c.impressions,
      clicks: c.clicks,
      placements_count: c._count.placements,
      created_at: c.created_at,
    }))
  );
}
