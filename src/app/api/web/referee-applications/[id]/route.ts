import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

/**
 * DELETE /api/web/referee-applications/[id]
 *
 * 본인 배정 신청 취소.
 *
 * 이유: 심판이 신청한 후 일정 변동으로 취소가 필요할 수 있다.
 *      관리자 선정 이전까지는 본인 신청을 자유롭게 취소 가능.
 *      (2차에서 "이미 선정됨" 상태면 취소 차단 로직 추가 예정)
 *
 * 보안:
 *   - 세션 기반 본인 신청만 삭제 (IDOR 방지)
 *   - Cascade로 application_dates 함께 삭제됨
 */

export const dynamic = "force-dynamic";

function parseId(raw: string): bigint | null {
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export const DELETE = withWebAuth(
  async (
    _req: Request,
    routeCtx: { params: Promise<{ id: string }> },
    ctx: WebAuthContext
  ) => {
    const { id: idRaw } = await routeCtx.params;
    const id = parseId(idRaw);
    if (id === null) return apiError("유효하지 않은 id입니다.", 400, "BAD_REQUEST");

    try {
      // 본인 Referee 조회
      const referee = await prisma.referee.findUnique({
        where: { user_id: ctx.userId },
        select: { id: true },
      });
      if (!referee) {
        return apiError("먼저 심판 프로필을 등록하세요.", 404, "NO_REFEREE_PROFILE");
      }

      // 신청 존재 + 본인 소유 확인
      const app = await prisma.assignmentApplication.findUnique({
        where: { id },
        select: { referee_id: true },
      });
      if (!app) return apiError("신청을 찾을 수 없습니다.", 404, "NOT_FOUND");
      if (app.referee_id !== referee.id) {
        return apiError("본인 신청만 취소할 수 있습니다.", 403, "FORBIDDEN");
      }

      // Cascade로 dates 함께 삭제
      await prisma.assignmentApplication.delete({ where: { id } });

      return apiSuccess({ deleted: true });
    } catch (error) {
      console.error("[referee-applications/:id] DELETE 실패:", error);
      return apiError("신청을 취소하지 못했습니다.", 500, "INTERNAL_ERROR");
    }
  }
);
