import { apiSuccess, apiError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";

/**
 * /api/web/admin/associations/members
 *
 * 소속 협회 심판 목록 조회.
 * - IDOR 방지: association_id는 세션 기반 admin-guard에서 가져옴
 * - User 정보(이름, 전화번호)는 user_id로 별도 조회하여 매핑
 *
 * 쿼리 파라미터:
 *   verified — "true"/"false" 필터 (자격증 검증 여부 기준)
 *   level    — 심판 등급 필터
 *   page     — 페이지 번호 (기본 1)
 *   limit    — 페이지당 건수 (기본 20)
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    const { associationId } = admin;

    // 쿼리 파라미터 파싱
    const url = new URL(req.url);
    const verifiedParam = url.searchParams.get("verified");
    const levelParam = url.searchParams.get("level");
    // v3: 매칭 상태 필터 — "matched" / "unmatched" / "" (전체)
    const matchStatusParam = url.searchParams.get("match_status");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // where 조건: 소속 협회 + 선택적 필터
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      association_id: associationId,
    };
    if (levelParam) {
      where.level = levelParam;
    }
    // v3: 매칭 상태 필터 적용
    if (matchStatusParam === "matched" || matchStatusParam === "unmatched") {
      where.match_status = matchStatusParam;
    }

    // verified 필터: 자격증 중 하나라도 검증된 심판 / 하나도 없는 심판
    if (verifiedParam === "true") {
      where.certificates = { some: { verified: true } };
    } else if (verifiedParam === "false") {
      where.certificates = { none: { verified: true } };
    }

    // 심판 목록 + 총 건수 병렬 조회
    const [referees, total] = await Promise.all([
      prisma.referee.findMany({
        where,
        include: {
          // 자격증 포함 (검증 상태 확인용)
          certificates: {
            select: {
              id: true,
              cert_type: true,
              cert_grade: true,
              verified: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.referee.count({ where }),
    ]);

    // User 정보 별도 조회 (name, phone 등)
    // v3: user_id가 null인 사전 등록 심판은 제외하고 User 조회
    const userIds = referees
      .map((r) => r.user_id)
      .filter((id): id is bigint => id !== null);
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        })
      : [];

    // User를 id 기준 Map으로 변환
    const userMap = new Map(users.map((u) => [u.id.toString(), u]));

    // 응답 구성: 심판 + User 정보 매핑
    // v3: user_id null이면 registered_name/phone으로 대체 표시
    const items = referees.map((r) => {
      const user = r.user_id ? userMap.get(r.user_id.toString()) : null;
      const totalCerts = r.certificates.length;
      const verifiedCerts = r.certificates.filter((c) => c.verified).length;

      return {
        id: r.id,
        user_id: r.user_id,
        // v3: 매칭된 유저 정보 우선, 없으면 사전 등록 정보 표시
        user_name: user?.name ?? r.registered_name ?? null,
        user_phone: user?.phone ?? r.registered_phone ?? null,
        user_email: user?.email ?? null,
        level: r.level,
        license_number: r.license_number,
        role_type: r.role_type,
        status: r.status,
        // v3: 매칭 상태 추가
        match_status: r.match_status,
        total_certificates: totalCerts,
        verified_certificates: verifiedCerts,
        // 모든 자격증이 검증됐으면 "verified", 하나도 없으면 "none", 일부면 "partial"
        verification_status:
          totalCerts === 0
            ? "none"
            : verifiedCerts === totalCerts
              ? "verified"
              : verifiedCerts > 0
                ? "partial"
                : "unverified",
        joined_at: r.joined_at,
      };
    });

    return apiSuccess({
      items,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  } catch {
    return apiError("심판 목록을 불러올 수 없습니다.", 500);
  }
}
