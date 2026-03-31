import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * Admin 파트너사 관리 API
 * GET  /api/admin/partners — 전체 파트너 목록 (관리자 전용)
 * POST /api/admin/partners — 파트너 등록
 */

// 관리자 인증 헬퍼
async function requireAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") return null;
  return session;
}

// 파트너 목록 조회 (status 필터 지원)
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // pending | approved | rejected | suspended

  const partners = await prisma.partners.findMany({
    where: status ? { status } : undefined,
    orderBy: { created_at: "desc" },
    include: {
      owner: { select: { id: true, nickname: true, email: true } },
      _count: { select: { campaigns: true, members: true } },
    },
  });

  return apiSuccess(
    partners.map((p) => ({
      id: p.id.toString(),
      uuid: p.uuid,
      name: p.name,
      logo_url: p.logo_url,
      website_url: p.website_url,
      contact_email: p.contact_email,
      status: p.status,
      description: p.description,
      owner: {
        id: p.owner.id.toString(),
        nickname: p.owner.nickname,
        email: p.owner.email,
      },
      campaigns_count: p._count.campaigns,
      members_count: p._count.members,
      created_at: p.created_at,
    }))
  );
}

// 파트너 등록 (관리자가 직접 생성)
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  const { name, logo_url, website_url, contact_email, contact_phone, description, owner_id } = body;

  if (!name || !owner_id) {
    return apiError("name and owner_id are required", 400);
  }

  const partner = await prisma.partners.create({
    data: {
      name,
      logo_url: logo_url || null,
      website_url: website_url || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      description: description || null,
      owner_id: BigInt(owner_id),
      status: "approved", // 관리자가 직접 등록하면 바로 승인
    },
  });

  // 소유자를 자동으로 파트너 멤버(owner)로 추가
  await prisma.partner_members.create({
    data: {
      partner_id: partner.id,
      user_id: BigInt(owner_id),
      role: "owner",
    },
  });

  return apiSuccess({ id: partner.id.toString(), uuid: partner.uuid }, 201);
}
