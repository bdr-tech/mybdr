import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

/**
 * PATCH /api/web/referee-admin/assignments/[id]  — 배정 수정 (role/status/memo)
 * DELETE /api/web/referee-admin/assignments/[id] — 배정 삭제
 *
 * 이유: 이미 등록된 배정의 역할/상태/메모를 조정하거나, 실수로 등록한 배정을 제거.
 *
 * 보안: requirePermission("assignment_manage") + IDOR(우리 협회 소속 심판 배정만 접근).
 */

export const dynamic = "force-dynamic";

// PATCH body 스키마
const patchSchema = z.object({
  role: z.enum(["main", "sub", "recorder", "timer"]).optional(),
  // 상태 전이: assigned/confirmed/declined/cancelled/completed
  status: z
    .enum(["assigned", "confirmed", "declined", "cancelled", "completed"])
    .optional(),
  memo: z.string().max(500).optional().nullable(),
  // 배정워크플로우 3차: 재배정 시 pool_id 변경. null이면 풀 연결 해제.
  pool_id: z
    .union([z.number(), z.string(), z.null()])
    .transform((v) => (v === null ? null : BigInt(v)))
    .optional(),
  // 정산 1차: 개별 배정비. null이면 단가표 기본값으로 돌림.
  fee: z
    .union([z.number().int().min(0), z.null()])
    .optional(),
});

// 공통: 배정 조회 + 협회 소속 검증 + referee_id·tournament_match_id 동반 반환
async function loadOwnedAssignment(
  assignmentId: bigint,
  associationId: bigint
) {
  const a = await prisma.refereeAssignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      referee_id: true,
      tournament_match_id: true,
      referee: { select: { association_id: true } },
    },
  });
  if (!a) return { error: "not_found" as const };
  if (a.referee.association_id !== associationId) {
    return { error: "forbidden" as const };
  }
  return { ok: true as const, assignment: a };
}

// 공통: params.id를 BigInt로 변환
function parseIdParam(idStr: string): bigint | null {
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
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
  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  const { id } = await params;
  const assignmentId = parseIdParam(id);
  if (assignmentId === null) {
    return apiError("유효하지 않은 ID입니다.", 400, "BAD_REQUEST");
  }

  // IDOR 검증
  const loaded = await loadOwnedAssignment(assignmentId, admin.associationId);
  if (loaded.error === "not_found") {
    return apiError("배정을 찾을 수 없습니다.", 404, "NOT_FOUND");
  }
  if (loaded.error === "forbidden") {
    return apiError(
      "다른 협회의 배정은 수정할 수 없습니다.",
      403,
      "FORBIDDEN"
    );
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
  const data = parsed.data;

  // 아무 필드도 없으면 변경 없음
  if (
    data.role === undefined &&
    data.status === undefined &&
    data.memo === undefined &&
    data.pool_id === undefined &&
    data.fee === undefined
  ) {
    return apiError("변경할 내용이 없습니다.", 400, "NO_CHANGES");
  }

  // 배정워크플로우 3차 — pool_id가 명시적으로 주어지면 재배정 검증.
  //   null이면 풀 연결 해제(허용). BigInt면 POST와 동일한 4중 검증.
  if (data.pool_id !== undefined && data.pool_id !== null) {
    const assignmentRef = loaded.ok ? loaded.assignment : null;
    if (!assignmentRef) {
      // 타입 가드 — 이미 위에서 404/403 처리되지만 안전하게
      return apiError("배정을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    const pool = await prisma.dailyAssignmentPool.findUnique({
      where: { id: data.pool_id },
      select: {
        id: true,
        referee_id: true,
        association_id: true,
        tournament_id: true,
        date: true,
      },
    });
    if (!pool) {
      return apiError("선정 풀을 찾을 수 없습니다.", 404, "POOL_NOT_FOUND");
    }
    // pool.referee_id === 배정의 referee_id
    if (pool.referee_id !== assignmentRef.referee_id) {
      return apiError(
        "선정 풀과 배정 심판이 일치하지 않습니다.",
        400,
        "POOL_REFEREE_MISMATCH"
      );
    }
    // 우리 협회 풀
    if (pool.association_id !== admin.associationId) {
      return apiError(
        "다른 협회의 선정 풀은 사용할 수 없습니다.",
        403,
        "FORBIDDEN"
      );
    }
    // 배정의 경기 대회·날짜와 일치 확인
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: assignmentRef.tournament_match_id },
      select: { tournamentId: true, scheduledAt: true },
    });
    if (!match) {
      return apiError("경기를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (pool.tournament_id !== match.tournamentId) {
      return apiError(
        "선정 풀의 대회가 경기 대회와 다릅니다.",
        400,
        "POOL_TOURNAMENT_MISMATCH"
      );
    }
    if (!match.scheduledAt) {
      return apiError(
        "경기 일자가 확정되지 않아 풀을 연결할 수 없습니다.",
        400,
        "MATCH_DATE_MISSING"
      );
    }
    const poolYmd = pool.date.toISOString().slice(0, 10);
    const matchYmd = match.scheduledAt.toISOString().slice(0, 10);
    if (poolYmd !== matchYmd) {
      return apiError(
        "선정 풀 날짜와 경기 일자가 다릅니다.",
        400,
        "POOL_DATE_MISMATCH"
      );
    }
  }

  try {
    // 정산 1차: status가 "completed"로 변경되는 경우 자동 정산 생성.
    //   - 배정 업데이트와 정산 생성을 $transaction으로 묶어 일관성 보장
    //   - 이미 정산 있으면 생성 스킵 (assignment_id UNIQUE)
    //   - 금액: data.fee(요청에서 변경) → assignment.fee(기존) → 협회 단가표[role] 순
    const willComplete = data.status === "completed";

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.refereeAssignment.update({
        where: { id: assignmentId },
        data: {
          ...(data.role !== undefined && { role: data.role }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.memo !== undefined && { memo: data.memo }),
          // pool_id: undefined이면 터치 안 함. null이면 해제. BigInt면 연결.
          ...(data.pool_id !== undefined && { pool_id: data.pool_id }),
          // fee: undefined이면 터치 안 함. null이면 제거(단가표 사용). 숫자면 저장.
          ...(data.fee !== undefined && { fee: data.fee }),
        },
        select: {
          id: true,
          referee_id: true,
          tournament_match_id: true,
          role: true,
          status: true,
          memo: true,
          assigned_at: true,
          pool_id: true,
          fee: true,
        },
      });

      let createdSettlement = null as null | {
        id: bigint;
        amount: number;
        status: string;
      };

      if (willComplete) {
        // 중복 방지 — assignment_id UNIQUE. 이미 있으면 스킵.
        const existing = await tx.refereeSettlement.findUnique({
          where: { assignment_id: updated.id },
          select: { id: true },
        });
        if (!existing) {
          // 금액 산정: 1) updated.fee (방금 쓴 값) 2) 협회 단가표[role] 3) 하드코딩 fallback
          let amount = updated.fee ?? null;
          if (amount === null) {
            const feeSetting = await tx.associationFeeSetting.findUnique({
              where: { association_id: admin.associationId },
              select: {
                fee_main: true,
                fee_sub: true,
                fee_recorder: true,
                fee_timer: true,
              },
            });
            // role → 단가표 필드 매핑
            const roleToFee: Record<string, number> = {
              main: feeSetting?.fee_main ?? 80000,
              sub: feeSetting?.fee_sub ?? 60000,
              recorder: feeSetting?.fee_recorder ?? 40000,
              timer: feeSetting?.fee_timer ?? 40000,
            };
            amount = roleToFee[updated.role] ?? 0;
          }

          const s = await tx.refereeSettlement.create({
            data: {
              referee_id: updated.referee_id,
              assignment_id: updated.id,
              amount,
              status: "pending",
            },
            select: { id: true, amount: true, status: true },
          });
          createdSettlement = s;
        }
      }

      return { updated, createdSettlement };
    });

    return apiSuccess({
      assignment: result.updated,
      // 자동 생성된 정산이 있으면 함께 반환 (UI에서 토스트 표시용)
      auto_settlement: result.createdSettlement,
    });
  } catch (error) {
    console.error("[referee-admin/assignments/[id]] PATCH 실패:", error);
    return apiError("배정 수정에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}

// ── DELETE ──
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  const { id } = await params;
  const assignmentId = parseIdParam(id);
  if (assignmentId === null) {
    return apiError("유효하지 않은 ID입니다.", 400, "BAD_REQUEST");
  }

  const loaded = await loadOwnedAssignment(assignmentId, admin.associationId);
  if (loaded.error === "not_found") {
    return apiError("배정을 찾을 수 없습니다.", 404, "NOT_FOUND");
  }
  if (loaded.error === "forbidden") {
    return apiError(
      "다른 협회의 배정은 삭제할 수 없습니다.",
      403,
      "FORBIDDEN"
    );
  }

  // 정산 가드 — 이유: 스키마의 onDelete: Cascade 때문에 배정을 지우면
  //   연결된 정산도 조용히 함께 사라진다. paid/pending/scheduled/refunded 상태는
  //   지급 이력이므로 소실되면 안 된다. cancelled 상태만 cascade 삭제 허용.
  const settlement = await prisma.refereeSettlement.findUnique({
    where: { assignment_id: assignmentId },
    select: { id: true, status: true },
  });

  if (settlement && settlement.status !== "cancelled") {
    return apiError(
      "이 배정에 연결된 정산이 존재합니다. 정산을 먼저 취소하거나 삭제해주세요.",
      409,
      "SETTLEMENT_EXISTS"
    );
  }

  try {
    // cancelled 상태 정산이거나 정산이 없는 경우만 여기 도달 → cascade로 함께 삭제됨
    await prisma.refereeAssignment.delete({ where: { id: assignmentId } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("[referee-admin/assignments/[id]] DELETE 실패:", error);
    return apiError("배정 삭제에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
