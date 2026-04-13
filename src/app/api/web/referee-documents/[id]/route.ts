import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

/**
 * /api/web/referee-documents/[id]
 *
 * DELETE — 본인 서류 삭제.
 *
 * 보안:
 *   - 로그인 세션 필수
 *   - 서류의 referee.user_id = 세션 userId인 경우만 삭제 허용 (IDOR 방지)
 *   - id 파라미터는 /^\d+$/ 정규식으로 검증 (BigInt 변환 전)
 */

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1) 세션 확인
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");

  const userId = BigInt(session.sub);

  // 2) id 파라미터 검증 — 비숫자 입력 시 BigInt 변환 에러 방지
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 서류 ID입니다.", 400, "BAD_REQUEST");
  }
  const docId = BigInt(id);

  // 3) 서류 조회 + 소유자 확인 (IDOR 방지)
  const document = await prisma.refereeDocument.findUnique({
    where: { id: docId },
    select: {
      id: true,
      referee: { select: { user_id: true } },
    },
  });

  if (!document) {
    return apiError("서류를 찾을 수 없습니다.", 404, "NOT_FOUND");
  }

  // 본인 서류만 삭제 가능
  if (document.referee.user_id !== userId) {
    return apiError("본인의 서류만 삭제할 수 있습니다.", 403, "FORBIDDEN");
  }

  // 4) 삭제
  await prisma.refereeDocument.delete({ where: { id: docId } });

  return apiSuccess({ deleted: true });
}
