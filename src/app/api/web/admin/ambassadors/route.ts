/**
 * GET /api/web/admin/ambassadors — 관리자용 앰배서더 신청/목록 조회
 *
 * 쿼리 파라미터:
 * - status: "pending" | "active" | "revoked" | "all" (기본: "all")
 *
 * super_admin만 접근 가능.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  // 관리자 인증 필수
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") {
    return apiError("관리자 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") || "all";

  // 상태 필터 조건 구성
  const where = statusFilter !== "all" ? { status: statusFilter } : undefined;

  const ambassadors = await prisma.court_ambassadors.findMany({
    where,
    orderBy: [{ status: "asc" }, { created_at: "desc" }], // pending 우선
    take: 100,
    include: {
      user: { select: { id: true, nickname: true, profile_image_url: true } },
      court_infos: { select: { id: true, name: true, city: true, district: true } },
    },
  });

  // BigInt 직렬화
  const serialized = ambassadors.map((a) => ({
    id: a.id.toString(),
    userId: a.user_id.toString(),
    nickname: a.user?.nickname ?? "사용자",
    profileImage: a.user?.profile_image_url ?? null,
    courtId: a.court_info_id.toString(),
    courtName: a.court_infos?.name ?? "코트",
    courtCity: a.court_infos?.city ?? "",
    courtDistrict: a.court_infos?.district ?? null,
    status: a.status,
    appointedAt: a.appointed_at?.toISOString() ?? null,
    revokedAt: a.revoked_at?.toISOString() ?? null,
    createdAt: a.created_at.toISOString(),
  }));

  return apiSuccess({ ambassadors: serialized, total: serialized.length });
}
