import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

/**
 * /api/web/referee-admin/settlements/bulk-create
 *
 * GET  — 지정한 대회에서 "정산 생성 대상"인 배정 미리보기
 *        (status=completed + 아직 Settlement 없음 + 우리 협회 심판)
 *        각 항목에 예상 금액(fee → 단가표[role] → 하드코딩 fallback)까지 계산해서 반환
 *
 * POST — 선택한 배정들에 대해 정산을 $transaction으로 일괄 생성
 *        각 항목 재검증(우리 협회 / completed / 중복 없음) 후 부분 실패 허용
 *        실패는 failed[] 로 묶어 반환 → 프론트가 어떤 게 실패했는지 안내 가능
 *
 * 보안: getAssociationAdmin() + requirePermission("settlement_manage")
 * 이유: 정산 대량 생성은 사무국장 고유 업무 + IDOR 2중 방어.
 */

export const dynamic = "force-dynamic";

// 하드코딩 fallback — 협회 단가표가 없는 경우만 사용
const DEFAULT_FEES: Record<string, number> = {
  main: 80000,
  sub: 60000,
  recorder: 40000,
  timer: 40000,
};

// POST 스키마 — items[] 는 최소 1개, 최대 200개 (한 번에 너무 많으면 트랜잭션 타임아웃 위험)
const postSchema = z.object({
  tournament_id: z.string().min(1), // Tournament.id는 UUID(String)
  items: z
    .array(
      z.object({
        assignment_id: z.union([z.number(), z.string()]).transform((v) => BigInt(v)),
        amount: z.number().int().min(0),
        memo: z.string().max(500).optional().nullable(),
      })
    )
    .min(1)
    .max(200),
});

// 단가표 + role → 금액 계산 유틸
// 이유: GET(예상 금액 미리 계산)과 POST(실제 생성은 클라가 보낸 amount 사용)에서
//      공통적으로 사용. 단가표가 없으면 DEFAULT_FEES fallback.
function resolveAmount(
  fee: number | null,
  role: string,
  fees: {
    fee_main: number;
    fee_sub: number;
    fee_recorder: number;
    fee_timer: number;
  } | null
): number {
  if (fee !== null && fee !== undefined) return fee;
  if (fees) {
    const map: Record<string, number> = {
      main: fees.fee_main,
      sub: fees.fee_sub,
      recorder: fees.fee_recorder,
      timer: fees.fee_timer,
    };
    if (role in map) return map[role];
  }
  return DEFAULT_FEES[role] ?? 0;
}

// ─────────────────────────────────────────────────────────────
// GET — 일괄 생성 대상 미리보기
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  const denied = requirePermission(admin.role, "settlement_manage");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournament_id");
  if (!tournamentId) {
    return apiError("tournament_id가 필요합니다.", 400, "BAD_REQUEST");
  }

  try {
    // 1) 해당 대회의 경기(match) id 집합
    const matches = await prisma.tournamentMatch.findMany({
      where: { tournamentId },
      select: {
        id: true,
        scheduledAt: true,
        venue_name: true,
        roundName: true,
      },
    });
    if (matches.length === 0) {
      return apiSuccess({ items: [], fees: null });
    }
    const matchIds = matches.map((m) => m.id);
    const matchMap = new Map(matches.map((m) => [m.id.toString(), m]));

    // 2) 협회 단가표 조회 (한 번만)
    const feeSetting = await prisma.associationFeeSetting.findUnique({
      where: { association_id: admin.associationId },
      select: {
        fee_main: true,
        fee_sub: true,
        fee_recorder: true,
        fee_timer: true,
      },
    });

    // 3) 해당 matches에서 completed + 우리 협회 심판 + 정산 없는 배정 조회
    //   Prisma 관계 필터: referee.association_id로 IDOR 필터.
    //   settlement: null 로 "Settlement 미존재"만 필터.
    const assignments = await prisma.refereeAssignment.findMany({
      where: {
        tournament_match_id: { in: matchIds },
        status: "completed",
        referee: { association_id: admin.associationId },
        settlement: null, // 1:1 관계. Settlement 없는 배정만.
      },
      select: {
        id: true,
        role: true,
        fee: true,
        tournament_match_id: true,
        referee_id: true,
        referee: {
          select: {
            id: true,
            registered_name: true,
            user: { select: { name: true, nickname: true } },
          },
        },
      },
      orderBy: [{ tournament_match_id: "asc" }, { id: "asc" }],
    });

    // 4) 응답 구성 — 예상 금액 + 심판명 + 경기일 + 장소
    const items = assignments.map((a) => {
      const match = matchMap.get(a.tournament_match_id.toString());
      const expected = resolveAmount(a.fee, a.role, feeSetting);
      return {
        assignment_id: a.id,
        referee_id: a.referee_id,
        referee_name:
          a.referee.user?.name ??
          a.referee.user?.nickname ??
          a.referee.registered_name ??
          `심판 #${a.referee.id.toString()}`,
        role: a.role,
        fee_snapshot: a.fee, // null이면 단가표/fallback 적용됨
        expected_amount: expected,
        match: match
          ? {
              id: match.id,
              scheduled_at: match.scheduledAt,
              venue_name: match.venue_name,
              round_name: match.roundName,
            }
          : null,
      };
    });

    return apiSuccess({
      items,
      fees: feeSetting ?? null, // 프론트 안내용 (단가표 없으면 null → 기본값 안내)
    });
  } catch (error) {
    console.error(
      "[referee-admin/settlements/bulk-create] GET 실패:",
      error
    );
    return apiError(
      "일괄 생성 대상을 불러오지 못했습니다.",
      500,
      "INTERNAL_ERROR"
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST — 일괄 생성 확정
// ─────────────────────────────────────────────────────────────
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
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }
  const { items } = parsed.data;

  // 결과 누적
  const createdIds: bigint[] = [];
  const failed: { assignment_id: string; reason: string }[] = [];

  try {
    // assignment_id 중복 제거 (같은 배정이 2번 들어오면 첫 건만 처리)
    const uniqueMap = new Map<string, { assignment_id: bigint; amount: number; memo?: string | null }>();
    for (const it of items) {
      uniqueMap.set(it.assignment_id.toString(), it);
    }
    const uniqueItems = Array.from(uniqueMap.values());

    // 트랜잭션 내에서 순회 처리 — 각 항목은 독립 검증.
    // 한 건이 실패해도 전체 롤백하지 않도록 try/catch로 감싸고 failed[]에 누적.
    // 이유: 예) 같은 대회에서 80건 중 3건만 실패 시 77건은 정상 생성돼야 실무상 편리.
    await prisma.$transaction(async (tx) => {
      for (const it of uniqueItems) {
        try {
          const assignment = await tx.refereeAssignment.findUnique({
            where: { id: it.assignment_id },
            select: {
              id: true,
              referee_id: true,
              status: true,
              referee: { select: { association_id: true } },
              settlement: { select: { id: true } },
            },
          });
          if (!assignment) {
            failed.push({
              assignment_id: it.assignment_id.toString(),
              reason: "NOT_FOUND",
            });
            continue;
          }
          if (assignment.referee.association_id !== admin.associationId) {
            failed.push({
              assignment_id: it.assignment_id.toString(),
              reason: "FORBIDDEN",
            });
            continue;
          }
          if (assignment.status !== "completed") {
            failed.push({
              assignment_id: it.assignment_id.toString(),
              reason: "NOT_COMPLETED",
            });
            continue;
          }
          if (assignment.settlement) {
            failed.push({
              assignment_id: it.assignment_id.toString(),
              reason: "DUPLICATE",
            });
            continue;
          }

          const created = await tx.refereeSettlement.create({
            data: {
              referee_id: assignment.referee_id,
              assignment_id: assignment.id,
              amount: it.amount,
              status: "pending", // 일괄 생성도 기본 pending
              memo: it.memo ?? null,
            },
            select: { id: true },
          });
          createdIds.push(created.id);
        } catch (err) {
          // P2002(unique) 등 DB 에러 — 메시지만 수집
          const e = err as { code?: string; message?: string };
          failed.push({
            assignment_id: it.assignment_id.toString(),
            reason: e.code === "P2002" ? "DUPLICATE" : "ERROR",
          });
        }
      }
    });

    return apiSuccess({
      created: createdIds.length,
      created_ids: createdIds,
      failed,
    });
  } catch (error) {
    console.error(
      "[referee-admin/settlements/bulk-create] POST 실패:",
      error
    );
    return apiError(
      "일괄 생성에 실패했습니다.",
      500,
      "INTERNAL_ERROR"
    );
  }
}
