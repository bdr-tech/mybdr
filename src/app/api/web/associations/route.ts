import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/associations
 *
 * 심판 플랫폼의 협회 드롭다운용 공개 엔드포인트.
 * - 로그인 불필요 (공개 목록)
 * - 20개 전체 반환, 계층 구조 그대로 나열 (KBA/KBL/WKBL + 17개 시도협회)
 * - 트리 가공은 클라이언트에서 필요 시 수행
 *
 * 응답 케이스 자동 변환(apiSuccess)으로 BigInt → string, snake_case 유지.
 */

// 공개 엔드포인트이지만 정적 캐시되지 않도록 명시
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const associations = await prisma.association.findMany({
      // level 우선(national → pro_league → sido), 이름 가나다 순
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: {
        id: true,
        parent_id: true,
        name: true,
        code: true,
        level: true,
        region_sido: true,
      },
    });

    // BigInt는 apiSuccess가 자동 문자열 변환. 별도 가공 없이 반환.
    return apiSuccess(associations);
  } catch (err) {
    console.error("[associations] GET error:", err);
    return apiError("협회 목록을 불러올 수 없습니다.", 500);
  }
}
