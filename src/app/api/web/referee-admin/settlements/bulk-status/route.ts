import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

/**
 * POST /api/web/referee-admin/settlements/bulk-status
 *
 * 다수 정산의 상태를 한 번에 변경.
 *
 * 이유: 월말 정산 시 수십~수백 건을 "지급예정 → 지급완료"로 동시에 넘겨야 하는 실무 시나리오.
 *      단건 /status와 동일한 전이 규칙·서류 검증을 재사용하되, 미완비 심판은 "자동 제외"하고
 *      (skip) 처리 가능한 것만 일괄 처리한다. force는 위험하므로 일괄에서는 허용하지 않음
 *      (강행이 필요한 건은 단건 /status 엔드포인트로만 가능).
 *
 * body: {
 *   settlement_ids: number[]   // 변경 대상 정산 id
 *   target_status:  string     // 전이 대상 상태
 *   memo?:          string     // 공통 메모 (감사 로그)
 * }
 *
 * 응답: { succeeded: N, skipped: [{ id, reason }], failed: [{ id, reason }] }
 *   - succeeded: 정상 전이 건수
 *   - skipped:   의도적 제외 (서류 미완비/동일 상태/전이 불가)
 *   - failed:    DB 에러 등 예상치 못한 실패
 *
 * 보안: settlement_manage + IDOR (referee.association_id).
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

// 단건 /status 엔드포인트와 동일한 전이 화이트리스트
const TRANSITIONS: Record<SettlementStatus, SettlementStatus[]> = {
  pending: ["scheduled", "cancelled"],
  scheduled: ["paid", "pending", "cancelled"],
  paid: ["refunded"],
  cancelled: ["pending"],
  refunded: ["pending"],
};

const REQUIRED_DOCS = ["certificate", "id_card", "bankbook"] as const;

const bodySchema = z.object({
  settlement_ids: z
    .array(z.union([z.number(), z.string()]).transform((v) => BigInt(v)))
    .min(1)
    .max(500), // 500건 상한
  target_status: z.enum(STATUS_ENUM),
  memo: z.string().max(500).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  const denied = requirePermission(admin.role, "settlement_manage");
  if (denied) return denied;

  // body 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }
  const { target_status, memo } = parsed.data;

  // 중복 제거 (같은 id가 2번 들어오면 1번만 처리)
  const uniqueIds = Array.from(
    new Map(parsed.data.settlement_ids.map((v) => [v.toString(), v])).values()
  );

  const succeeded: string[] = [];
  const skipped: { id: string; reason: string }[] = [];
  const failed: { id: string; reason: string }[] = [];

  try {
    // 1) 대상 정산 일괄 조회 (IDOR + 상태 + 심판 id)
    const settlements = await prisma.refereeSettlement.findMany({
      where: {
        id: { in: uniqueIds },
        referee: { association_id: admin.associationId }, // IDOR — 다른 협회 건은 조회부터 누락
      },
      select: {
        id: true,
        referee_id: true,
        status: true,
      },
    });
    const foundIds = new Set(settlements.map((s) => s.id.toString()));
    // 조회 안 된 id는 IDOR 또는 NOT_FOUND → skipped 처리 (정보 누출 방지 위해 동일 사유로 묶음)
    for (const id of uniqueIds) {
      if (!foundIds.has(id.toString())) {
        skipped.push({ id: id.toString(), reason: "NOT_FOUND_OR_FORBIDDEN" });
      }
    }

    // 2) paid 전환이면 서류 3종 일괄 확인 (N+1 회피: referee_id 모아서 한 번에 조회)
    let docsByReferee = new Map<string, Set<string>>();
    if (target_status === "paid") {
      const refereeIds = Array.from(
        new Set(settlements.map((s) => s.referee_id))
      );
      const docs = refereeIds.length
        ? await prisma.refereeDocument.findMany({
            where: {
              referee_id: { in: refereeIds },
              doc_type: { in: [...REQUIRED_DOCS] },
            },
            select: { referee_id: true, doc_type: true },
          })
        : [];
      docsByReferee = new Map();
      for (const d of docs) {
        const key = d.referee_id.toString();
        if (!docsByReferee.has(key)) docsByReferee.set(key, new Set());
        docsByReferee.get(key)!.add(d.doc_type);
      }
    }

    // 3) 각 항목별 전이 검증 → 통과한 것만 업데이트 목록으로
    const updatePlan: {
      id: bigint;
      updateData: Record<string, unknown>;
    }[] = [];
    const now = new Date();

    for (const s of settlements) {
      const currentStatus = s.status as SettlementStatus;
      if (!(STATUS_ENUM as readonly string[]).includes(currentStatus)) {
        skipped.push({ id: s.id.toString(), reason: "UNKNOWN_STATUS" });
        continue;
      }
      if (currentStatus === target_status) {
        skipped.push({ id: s.id.toString(), reason: "SAME_STATUS" });
        continue;
      }
      const allowed = TRANSITIONS[currentStatus];
      if (!allowed.includes(target_status)) {
        skipped.push({ id: s.id.toString(), reason: "INVALID_TRANSITION" });
        continue;
      }
      // paid 전환 서류 검증 (미완비 자동 제외)
      if (target_status === "paid") {
        const owned = docsByReferee.get(s.referee_id.toString()) ?? new Set();
        const missing = REQUIRED_DOCS.filter((d) => !owned.has(d));
        if (missing.length > 0) {
          skipped.push({
            id: s.id.toString(),
            reason: `MISSING_DOCUMENTS:${missing.join(",")}`,
          });
          continue;
        }
      }

      // 상태별 시각 필드
      const updateData: Record<string, unknown> = { status: target_status };
      if (target_status === "paid") updateData.paid_at = now;
      if (target_status === "scheduled") updateData.scheduled_at = now;
      if (memo !== undefined && memo !== null) updateData.memo = memo;

      updatePlan.push({ id: s.id, updateData });
    }

    // 4) $transaction으로 일괄 업데이트 (원자 처리)
    if (updatePlan.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const p of updatePlan) {
          try {
            await tx.refereeSettlement.update({
              where: { id: p.id },
              data: p.updateData,
            });
            succeeded.push(p.id.toString());
          } catch (err) {
            const e = err as { code?: string };
            failed.push({
              id: p.id.toString(),
              reason: e.code ?? "UPDATE_ERROR",
            });
          }
        }
      });
    }

    return apiSuccess({
      succeeded: succeeded.length,
      succeeded_ids: succeeded,
      skipped,
      failed,
    });
  } catch (error) {
    console.error(
      "[referee-admin/settlements/bulk-status] POST 실패:",
      error
    );
    return apiError("일괄 상태 변경에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
