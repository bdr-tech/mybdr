import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * Admin 파트너 상세/수정 API
 * GET   /api/admin/partners/:id — 상세 조회
 * PATCH /api/admin/partners/:id — 수정 (상태 변경 포함)
 */

async function requireAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") return null;
  return session;
}

// 파트너 상세 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;

  const partner = await prisma.partners.findUnique({
    where: { id: BigInt(id) },
    include: {
      owner: { select: { id: true, nickname: true, email: true } },
      members: {
        include: { user: { select: { id: true, nickname: true, email: true } } },
      },
      campaigns: {
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          uuid: true,
          title: true,
          headline: true,
          status: true,
          impressions: true,
          clicks: true,
          created_at: true,
        },
      },
    },
  });

  if (!partner) return apiError("Partner not found", 404);

  return apiSuccess({
    id: partner.id.toString(),
    uuid: partner.uuid,
    name: partner.name,
    logo_url: partner.logo_url,
    website_url: partner.website_url,
    contact_email: partner.contact_email,
    contact_phone: partner.contact_phone,
    description: partner.description,
    status: partner.status,
    owner: {
      id: partner.owner.id.toString(),
      nickname: partner.owner.nickname,
      email: partner.owner.email,
    },
    members: partner.members.map((m) => ({
      id: m.id.toString(),
      user_id: m.user.id.toString(),
      nickname: m.user.nickname,
      email: m.user.email,
      role: m.role,
      is_active: m.is_active,
    })),
    campaigns: partner.campaigns.map((c) => ({
      id: c.id.toString(),
      uuid: c.uuid,
      title: c.title,
      headline: c.headline,
      status: c.status,
      impressions: c.impressions,
      clicks: c.clicks,
      created_at: c.created_at,
    })),
    created_at: partner.created_at,
  });
}

// 파트너 수정 (이름, 상태, 연락처 등)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await req.json();

  // 허용된 필드만 업데이트
  const allowedFields = ["name", "logo_url", "website_url", "contact_email", "contact_phone", "description", "status"];
  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  const updated = await prisma.partners.update({
    where: { id: BigInt(id) },
    data,
  });

  return apiSuccess({ id: updated.id.toString(), status: updated.status });
}
