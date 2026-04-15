import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

/**
 * PATCH /api/web/referee-admin/settlements/[id]  — 정산 수정 (amount/memo)
 * DELETE /api/web/referee-admin/settlements/[id] — 정산 삭제 (pending만)
 *
 * 이유: 금액 오류/메모 보완은 자주 발생. 상태 변경은 별도 엔드포인트(/status)로 분리해
 *      전이 화이트리스트 + 서류 검증을 한 곳에 모은다.
 *
 * 보안:
 *   - settlement_manage 권한 (사무국장만)
 *   - IDOR: settlement.referee.association_id === admin.associationId
 *   - DELETE는 status === "pending" 레코드만 허용 (이미 지급된 건은 취소 상태로 돌리는 게 정석)
 */

export const dynamic = "force-dynamic";

// PATCH 스키마 — amount/memo만 수정. 상태 변경은 /status 엔드포인트 사용.
const patchSchema = z.object({
  amount: z.number().int().min(0).optional(),
  memo: z.string().max(500).optional().nullable(),
});

// 공통: params.id → BigInt
function parseIdParam(idStr: string): bigint | null {
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
}

// 공통: 정산 조회 + IDOR 검증. referee_id/status도 함께 반환해 호출자가 재사용.
async function loadOwnedSettlement(
  settlementId: bigint,
  associationId: bigint
) {
  const s = await prisma.refereeSettlement.findUnique({
    where: { id: settlementId },
    select: {
      id: true,
      referee_id: true,
      status: true,
      referee: { select: { association_id: true } },
    },
  });
  if (!s) return { error: "not_found" as const };
  if (s.referee.association_id !== associationId) {
    return { error: "forbidden" as const };
  }
  return { ok: true as const, settlement: s };
}

// ── PATCH ──
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  const denied = requirePermission(admin.role, "settlement_manage");
  if (denied) return denied;

  const { id } = await params;
  const settlementId = parseIdParam(id);
  if (settlementId === null) {
    return apiError("유효하지 않은 ID입니다.", 400, "BAD_REQUEST");
  }

  const loaded = await loadOwnedSettlement(settlementId, admin.associationId);
  if (loaded.error === "not_found") {
    return apiError("정산을 찾을 수 없습니다.", 404, "NOT_FOUND");
  }
  if (loaded.error === "forbidden") {
    return apiError("다른 협회의 정산은 수정할 수 없습니다.", 403, "FORBIDDEN");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }
  const data = parsed.data;
  if (data.amount === undefined && data.memo === undefined) {
    return apiError("변경할 내용이 없습니다.", 400, "NO_CHANGES");
  }

  try {
    const updated = await prisma.refereeSettlement.update({
      where: { id: settlementId },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.memo !== undefined && { memo: data.memo }),
      },
      select: {
        id: true,
        referee_id: true,
        assignment_id: true,
        amount: true,
        status: true,
        scheduled_at: true,
        paid_at: true,
        memo: true,
        updated_at: true,
      },
    });
    return apiSuccess({ settlement: updated });
  } catch (error) {
    console.error("[referee-admin/settlements/[id]] PATCH 실패:", error);
    return apiError("정산 수정에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}

// ── DELETE ──
// pending 상태만 삭제 허용. 이미 진행된 건은 /status로 cancelled/refunded 처리.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  const denied = requirePermission(admin.role, "settlement_manage");
  if (denied) return denied;

  const { id } = await params;
  const settlementId = parseIdParam(id);
  if (settlementId === null) {
    return apiError("유효하지 않은 ID입니다.", 400, "BAD_REQUEST");
  }

  const loaded = await loadOwnedSettlement(settlementId, admin.associationId);
  if (loaded.error === "not_found") {
    return apiError("정산을 찾을 수 없습니다.", 404, "NOT_FOUND");
  }
  if (loaded.error === "forbidden") {
    return apiError("다른 협회의 정산은 삭제할 수 없습니다.", 403, "FORBIDDEN");
  }
  if (loaded.ok && loaded.settlement.status !== "pending") {
    return apiError(
      "지급/예정/취소된 정산은 삭제할 수 없습니다. 상태 변경으로 처리하세요.",
      400,
      "NOT_DELETABLE"
    );
  }

  try {
    await prisma.refereeSettlement.delete({ where: { id: settlementId } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("[referee-admin/settlements/[id]] DELETE 실패:", error);
    return apiError("정산 삭제에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
