import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";
// 책임심판 지정 시 해당 심판에게 알림 발송
import { notifyChiefAssigned } from "@/lib/notifications/referee-events";

/**
 * /api/web/referee-admin/pools/[id]
 *
 * DELETE — 선정 취소 (경기 배정이 이미 연결되어 있으면 거부)
 * PATCH  — 책임자(is_chief) 토글 + 메모 수정
 *
 * 이유: 선정은 일자별 풀의 핵심이지만, 경기가 이미 배정(RefereeAssignment.pool_id)된
 *       상태에서는 무결성을 위해 선정 취소를 막아야 한다.
 *       책임자는 하루·역할 단위로 1명만 허용하므로 $transaction으로 교체한다.
 *
 * 보안:
 *   - requirePermission("assignment_manage")
 *   - association_id 일치 검증 (IDOR 방지)
 */

export const dynamic = "force-dynamic";

// ── id 파서 ──
function parseId(raw: string): bigint | null {
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

// ── Zod: PATCH ──
// is_chief / memo 둘 다 optional. 하나 이상은 있어야 의미가 있지만 스키마로 강제하진 않음.
const patchSchema = z.object({
  is_chief: z.boolean().optional(),
  memo: z.string().max(1000).nullable().optional(),
});

// ── DELETE: 선정 취소 ──
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) return apiError("유효하지 않은 id입니다.", 400, "BAD_REQUEST");

  try {
    // 1) 소유 협회 검증 + 연결된 경기 배정 수 조회
    //    _count.assignments > 0 이면 삭제 거부 (참조 무결성 + UX 안내)
    const existing = await prisma.dailyAssignmentPool.findUnique({
      where: { id },
      select: {
        association_id: true,
        _count: { select: { assignments: true } },
      },
    });
    if (!existing) return apiError("선정을 찾을 수 없습니다.", 404, "NOT_FOUND");
    if (existing.association_id !== admin.associationId) {
      return apiError(
        "다른 협회의 선정은 취소할 수 없습니다.",
        403,
        "FORBIDDEN"
      );
    }
    if (existing._count.assignments > 0) {
      return apiError(
        "이미 경기에 배정된 심판입니다. 먼저 경기 배정을 해제해 주세요.",
        409,
        "ASSIGNMENT_EXISTS"
      );
    }

    // 2) 삭제
    await prisma.dailyAssignmentPool.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("[referee-admin/pools/:id] DELETE 실패:", error);
    return apiError("선정을 취소하지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}

// ── PATCH: 책임자 토글 / 메모 수정 ──
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAssociationAdmin();
  if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) return apiError("유효하지 않은 id입니다.", 400, "BAD_REQUEST");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);
  const { is_chief, memo } = parsed.data;

  try {
    // 1) 대상 pool 조회 + 소유 협회 검증
    const existing = await prisma.dailyAssignmentPool.findUnique({
      where: { id },
      select: {
        association_id: true,
        tournament_id: true,
        date: true,
        role_type: true,
      },
    });
    if (!existing) return apiError("선정을 찾을 수 없습니다.", 404, "NOT_FOUND");
    if (existing.association_id !== admin.associationId) {
      return apiError("다른 협회의 선정은 수정할 수 없습니다.", 403, "FORBIDDEN");
    }

    // 2) is_chief === true 로 설정 시, 같은 tournament+date+role_type의 기존 chief를 false로 교체
    //    $transaction으로 원자성 보장 (두 UPDATE가 같은 테이블이라 잠금 리스크 있지만,
    //    풀 규모상 문제 없음)
    if (is_chief === true) {
      await prisma.$transaction([
        // 같은 일자·역할에서 기존 chief 해제 (본인 제외)
        prisma.dailyAssignmentPool.updateMany({
          where: {
            tournament_id: existing.tournament_id,
            date: existing.date,
            role_type: existing.role_type,
            association_id: admin.associationId,
            is_chief: true,
            NOT: { id },
          },
          data: { is_chief: false },
        }),
        // 본인에게 chief 지정
        prisma.dailyAssignmentPool.update({
          where: { id },
          data: {
            is_chief: true,
            // memo도 같이 들어왔다면 함께 업데이트 (undefined면 미변경)
            ...(memo !== undefined ? { memo } : {}),
          },
        }),
      ]);
    } else {
      // is_chief === false 이거나 undefined인 경우 — 단순 업데이트
      const data: Record<string, unknown> = {};
      if (is_chief === false) data.is_chief = false;
      if (memo !== undefined) data.memo = memo;
      if (Object.keys(data).length === 0) {
        return apiError("변경할 내용이 없습니다.", 400, "NO_CHANGES");
      }
      await prisma.dailyAssignmentPool.update({
        where: { id },
        data,
      });
    }

    // 3) 갱신 결과 반환
    const updated = await prisma.dailyAssignmentPool.findUnique({
      where: { id },
      select: {
        id: true,
        referee_id: true,
        is_chief: true,
        memo: true,
        updated_at: true,
      },
    });

    // 4) 알림: is_chief = true로 전환된 경우에만 "책임심판 지정" 알림 발송
    //    이유: false 해제나 memo만 수정된 경우까지 알림 보내면 시끄러움.
    //    tournament 이름 조회 필요 — 위 $transaction 블록에서 이미 existing.tournament_id 확보됨.
    if (is_chief === true && updated) {
      const tournamentInfo = await prisma.tournament.findUnique({
        where: { id: existing.tournament_id },
        select: { name: true },
      });
      await notifyChiefAssigned(updated.referee_id, {
        tournament_name: tournamentInfo?.name ?? "대회",
        date: existing.date,
      });
    }

    return apiSuccess({ pool: updated });
  } catch (error) {
    console.error("[referee-admin/pools/:id] PATCH 실패:", error);
    return apiError("선정을 수정하지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}
