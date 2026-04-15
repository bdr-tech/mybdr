import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { findMatchingUser, executeMatch } from "@/lib/services/referee-matching";

/**
 * /api/web/referee-admin/members/[id]/match
 *
 * GET  — 매칭 후보 검색: 사전 등록된 심판의 이름+전화번호로 유저 후보를 찾는다.
 * POST — 수동 매칭 실행: 관리자가 선택한 유저를 심판에 연결한다.
 *
 * 보안:
 *   - getAssociationAdmin() → 세션 기반 관리자 인증
 *   - requirePermission("referee_manage") → 심판 관리 권한 체크
 *   - IDOR 방지: 심판의 association_id가 관리자의 것과 일치하는지 확인
 */

export const dynamic = "force-dynamic";

// ── GET: 매칭 후보 검색 ──
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }
    const denied = requirePermission(admin.role, "referee_manage");
    if (denied) return denied;

    const { id } = await params;
    // BigInt 변환 전 숫자 검증 — 비숫자 입력 시 500 대신 400 반환
    if (!/^\d+$/.test(id)) {
      return apiError("유효하지 않은 ID입니다.", 400, "INVALID_ID");
    }
    const refereeId = BigInt(id);

    // 심판 조회 + IDOR 방지
    const referee = await prisma.referee.findUnique({
      where: { id: refereeId },
      select: {
        association_id: true,
        registered_name: true,
        registered_phone: true,
        match_status: true,
        user_id: true,
      },
    });

    if (!referee) {
      return apiError("심판을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (referee.association_id !== admin.associationId) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 이미 매칭된 심판이면 후보 검색 불필요
    if (referee.match_status === "matched" || referee.user_id !== null) {
      return apiSuccess({
        already_matched: true,
        candidates: [],
        message: "이미 매칭된 심판입니다.",
      });
    }

    // 사전 등록 정보가 없으면 검색 불가
    if (!referee.registered_name || !referee.registered_phone) {
      return apiSuccess({
        already_matched: false,
        candidates: [],
        message: "사전 등록 정보(이름/전화번호)가 없어 검색할 수 없습니다.",
      });
    }

    // 매칭 후보 검색 — 이름+전화번호로 User 탐색
    const matched = await findMatchingUser(
      referee.registered_name,
      referee.registered_phone
    );

    // 후보를 배열로 반환 (0~1건)
    const candidates = matched
      ? [
          {
            user_id: matched.id,
            name: matched.name,
            phone: matched.phone,
            email: matched.email,
            birth_date: matched.birth_date,
          },
        ]
      : [];

    return apiSuccess({
      already_matched: false,
      candidates,
      // 검색 기준 정보도 반환 (관리자가 확인용)
      search_criteria: {
        registered_name: referee.registered_name,
        registered_phone: referee.registered_phone,
      },
    });
  } catch {
    return apiError("매칭 후보 검색에 실패했습니다.", 500);
  }
}

// ── POST: 수동 매칭 실행 ──
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }
    const denied = requirePermission(admin.role, "referee_manage");
    if (denied) return denied;

    const { id } = await params;
    // BigInt 변환 전 숫자 검증
    if (!/^\d+$/.test(id)) {
      return apiError("유효하지 않은 ID입니다.", 400, "INVALID_ID");
    }
    const refereeId = BigInt(id);

    // 요청 본문에서 매칭할 유저 ID 추출
    const body = await req.json();
    const userIdStr = body?.user_id;
    if (!userIdStr) {
      return apiError("매칭할 유저 ID가 필요합니다.", 422, "VALIDATION_ERROR");
    }
    const userId = BigInt(String(userIdStr));

    // 심판 조회 + IDOR 방지
    const referee = await prisma.referee.findUnique({
      where: { id: refereeId },
      select: { association_id: true, match_status: true, user_id: true },
    });

    if (!referee) {
      return apiError("심판을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (referee.association_id !== admin.associationId) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 이미 매칭된 심판인지 확인
    if (referee.match_status === "matched" || referee.user_id !== null) {
      return apiError("이미 매칭된 심판입니다.", 409, "ALREADY_MATCHED");
    }

    // 매칭 실행 (트랜잭션 내에서 원자적 처리)
    const updated = await executeMatch(refereeId, userId);

    return apiSuccess({
      id: updated.id,
      user_id: updated.user_id,
      match_status: updated.match_status,
      matched_at: updated.matched_at,
      message: "심판-유저 매칭이 완료되었습니다.",
    });
  } catch (err) {
    // executeMatch에서 던지는 비즈니스 에러 처리
    if (err instanceof Error) {
      if (err.message.includes("이미 매칭된")) {
        return apiError(err.message, 409, "ALREADY_MATCHED");
      }
      if (err.message.includes("이미 다른 심판")) {
        return apiError(err.message, 409, "USER_ALREADY_LINKED");
      }
      if (err.message.includes("찾을 수 없")) {
        return apiError(err.message, 404, "NOT_FOUND");
      }
    }
    return apiError("매칭 실행에 실패했습니다.", 500);
  }
}
