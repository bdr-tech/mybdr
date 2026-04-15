import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";

/**
 * /api/web/admin/associations/members/[id]
 *
 * 특정 심판 상세 조회 (관리자 전용).
 * - IDOR 방지: 해당 심판의 association_id가 관리자의 associationId와 일치하는지 확인
 * - 자격증, 최근 배정 10건, 최근 정산 10건 포함
 */

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    const { id } = await params;
    const refereeId = BigInt(id);

    // 심판 조회 + 관계 데이터 포함
    const referee = await prisma.referee.findUnique({
      where: { id: refereeId },
      include: {
        certificates: {
          orderBy: { issued_at: "desc" },
        },
        assignments: {
          orderBy: { assigned_at: "desc" },
          take: 10,
        },
        settlements: {
          orderBy: { created_at: "desc" },
          take: 10,
        },
      },
    });

    if (!referee) {
      return apiError("심판을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // IDOR 방지: 해당 심판이 관리자의 소속 협회 소속인지 확인
    if (!referee.association_id || referee.association_id !== admin.associationId) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // User 정보 별도 조회 — v3: user_id null이면 스킵
    const user = referee.user_id
      ? await prisma.user.findUnique({
          where: { id: referee.user_id },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            birth_date: true,
          },
        })
      : null;

    return apiSuccess({
      referee: {
        id: referee.id,
        user_id: referee.user_id,
        // v3: 매칭된 유저 정보 우선, 없으면 사전 등록 정보
        user_name: user?.name ?? referee.registered_name ?? null,
        user_phone: user?.phone ?? referee.registered_phone ?? null,
        user_email: user?.email ?? null,
        user_birth_date: user?.birth_date ?? referee.registered_birth_date ?? null,
        level: referee.level,
        license_number: referee.license_number,
        role_type: referee.role_type,
        status: referee.status,
        region_sido: referee.region_sido,
        region_sigungu: referee.region_sigungu,
        bio: referee.bio,
        verified_name: referee.verified_name,
        verified_birth_date: referee.verified_birth_date,
        verified_phone: referee.verified_phone,
        // v3: 매칭 상태 정보
        match_status: referee.match_status,
        matched_at: referee.matched_at,
        registered_name: referee.registered_name,
        registered_phone: referee.registered_phone,
        joined_at: referee.joined_at,
      },
      certificates: referee.certificates,
      assignments: referee.assignments,
      settlements: referee.settlements,
    });
  } catch {
    return apiError("심판 정보를 불러올 수 없습니다.", 500);
  }
}
