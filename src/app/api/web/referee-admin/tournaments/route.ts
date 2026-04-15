import { apiSuccess, apiError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import type { NextRequest } from "next/server";

/**
 * GET /api/web/referee-admin/tournaments
 *
 * 대회 검색 API (배정 관리 UI의 1단계에서 사용).
 *
 * 이유: 협회 관리자가 심판을 배정할 대회를 고르려면 먼저 대회를 검색해야 한다.
 *      Tournament 테이블은 협회 소속이 아니라 전체 공용이므로, 모든 관리자가 검색 가능.
 *
 * 쿼리 파라미터:
 *   - q: 검색어 (대회명 LIKE 검색)
 *   - status: 상태 필터 (예: in_progress, draft, registration, ended)
 *   - page, limit: 페이징
 *
 * 응답: { items: [{ id, name, status, start_date, end_date, venue_name }], total, page, limit }
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1) 관리자 인증 (열람은 모든 관리자 허용)
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }

  // 2) 쿼리 파라미터 파싱
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const status = (searchParams.get("status") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? "20"))
  );
  const skip = (page - 1) * limit;

  // 3) where 조건 조립 — 검색어가 있으면 name LIKE, 상태 있으면 status=
  const where: Record<string, unknown> = {};
  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }
  if (status) {
    where.status = status;
  }

  try {
    // 4) 병렬: 목록 + 전체 수
    const [items, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
          venue_name: true,
        },
      }),
      prisma.tournament.count({ where }),
    ]);

    // 5) 응답 포맷 — Tournament.id는 UUID(String)이므로 그대로 직렬화됨
    //    snake_case 자동 변환을 위해 startDate를 start_date로 매핑
    return apiSuccess({
      items: items.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        start_date: t.startDate,
        end_date: t.endDate,
        venue_name: t.venue_name,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("[referee-admin/tournaments] GET 실패:", error);
    return apiError("대회 목록을 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}
