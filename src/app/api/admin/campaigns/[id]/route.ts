import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * Admin 캠페인 상세/수정 API
 * PATCH /api/admin/campaigns/:id — 상태 변경 (승인/반려/일시정지 등)
 */

async function requireAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") return null;
  return session;
}

// 캠페인 상태 변경 (승인/반려/일시정지)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await req.json();

  // 허용된 필드만 업데이트
  const allowedFields = ["status", "headline", "description", "image_url", "link_url", "cta_text", "start_date", "end_date"];
  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  const updated = await prisma.ad_campaigns.update({
    where: { id: BigInt(id) },
    data,
  });

  return apiSuccess({ id: updated.id.toString(), status: updated.status });
}
