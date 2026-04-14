import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

/**
 * PATCH /api/web/referee-admin/settlements/[id]/status
 *   정산 상태 전이 엔드포인트. 사무국장만.
 *
 * 이유: 정산 라이프사이클(pending → scheduled → paid → refunded 등)은 실무상
 *      엄격한 전이 순서가 필요. 전이 화이트리스트를 한 곳에 모아 관리하고,
 *      paid 전환 시 서류 3종 완비 확인을 강제한다(미완비 시 force+memo 필수).
 *
 * 상태 전이 화이트리스트:
 *   pending   → scheduled, cancelled
 *   scheduled → paid, pending, cancelled
 *   paid      → refunded
 *   cancelled → pending
 *   refunded  → pending
 *
 * 보안:
 *   - settlement_manage 권한
 *   - IDOR(settlement.referee.association_id === admin.associationId)
 *   - paid 전환 시 서류 3종(certificate/id_card/bankbook) 완비 확인
 *     미완비 시 force=true + memo 필수 (감사 로그로 memo 남김)
 */

export const dynamic = "force-dynamic";

const STATUS_ENUM = [
  "pending",
  "scheduled",
  "paid",
  "cancelled",
  "refunded",
] as const;
type SettlementStatus = (typeof STATUS_ENUM)[number];

// 전이 화이트리스트: 키 = 현재 상태, 값 = 전이 허용 상태 목록
const TRANSITIONS: Record<SettlementStatus, SettlementStatus[]> = {
  pending: ["scheduled", "cancelled"],
  scheduled: ["paid", "pending", "cancelled"],
  paid: ["refunded"],
  cancelled: ["pending"],
  refunded: ["pending"],
};

// 필수 서류 3종
const REQUIRED_DOCS = ["certificate", "id_card", "bankbook"] as const;

const patchSchema = z.object({
  status: z.enum(STATUS_ENUM),
  force: z.boolean().optional(), // 서류 미완비에도 paid 강행
  memo: z.string().max(500).optional().nullable(), // 강행 시 필수
});

function parseIdParam(idStr: string): bigint | null {
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
}

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

  // body 파싱
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
  const { status: nextStatus, force, memo } = parsed.data;

  try {
    // 정산 조회 + IDOR
    const settlement = await prisma.refereeSettlement.findUnique({
      where: { id: settlementId },
      select: {
        id: true,
        referee_id: true,
        status: true,
        memo: true,
        referee: { select: { association_id: true } },
      },
    });
    if (!settlement) {
      return apiError("정산을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (settlement.referee.association_id !== admin.associationId) {
      return apiError(
        "다른 협회의 정산은 변경할 수 없습니다.",
        403,
        "FORBIDDEN"
      );
    }

    // 현재 상태가 enum에 포함돼야만 전이 맵 사용 가능 (방어적)
    const currentStatus = settlement.status as SettlementStatus;
    if (!(STATUS_ENUM as readonly string[]).includes(currentStatus)) {
      return apiError(
        `알 수 없는 현재 상태: ${currentStatus}`,
        500,
        "UNKNOWN_STATUS"
      );
    }

    // 동일 상태 전이는 거부(의미 없음)
    if (currentStatus === nextStatus) {
      return apiError(
        "현재 상태와 동일합니다.",
        400,
        "SAME_STATUS"
      );
    }

    // 전이 화이트리스트 검증
    const allowed = TRANSITIONS[currentStatus];
    if (!allowed.includes(nextStatus)) {
      return apiError(
        `'${currentStatus}' → '${nextStatus}' 전이는 허용되지 않습니다.`,
        400,
        "INVALID_TRANSITION"
      );
    }

    // paid 전환 시 서류 3종 완비 검증
    if (nextStatus === "paid") {
      const docs = await prisma.refereeDocument.findMany({
        where: {
          referee_id: settlement.referee_id,
          doc_type: { in: [...REQUIRED_DOCS] },
        },
        select: { doc_type: true },
      });
      const owned = new Set(docs.map((d) => d.doc_type));
      const missing = REQUIRED_DOCS.filter((d) => !owned.has(d));
      if (missing.length > 0) {
        // 강행 플래그가 없으면 거부
        if (!force) {
          return apiError(
            `필수 서류가 부족합니다: ${missing.join(", ")}`,
            400,
            "MISSING_DOCUMENTS",
            { missing_documents: missing }
          );
        }
        // 강행 시 memo 필수 (감사 로그)
        if (!memo || memo.trim().length === 0) {
          return apiError(
            "서류 미완비로 강행 지급 시 사유(memo)가 필수입니다.",
            400,
            "MEMO_REQUIRED_FOR_FORCE"
          );
        }
      }
    }

    // 상태별 시각 필드 동시 업데이트
    //   paid로 전환 → paid_at = now()
    //   scheduled로 전환 → scheduled_at = now()
    //   그 외 상태(pending/cancelled/refunded) → 시각 필드 터치 안 함 (이력 보존)
    const now = new Date();
    const updateData: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "paid") updateData.paid_at = now;
    if (nextStatus === "scheduled") updateData.scheduled_at = now;
    // memo가 전달되면 추가 기록 (강행 케이스 포함)
    if (memo !== undefined) {
      updateData.memo = memo;
    }

    const updated = await prisma.refereeSettlement.update({
      where: { id: settlementId },
      data: updateData,
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

    return apiSuccess({
      settlement: updated,
      previous_status: currentStatus,
    });
  } catch (error) {
    console.error(
      "[referee-admin/settlements/[id]/status] PATCH 실패:",
      error
    );
    return apiError("상태 변경에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
