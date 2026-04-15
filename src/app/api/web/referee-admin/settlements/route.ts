import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";
// 헬스체크 봇의 쓰기 작업 차단 가드
import { requireNotBot } from "@/lib/healthcheck/is-bot";

/**
 * GET /api/web/referee-admin/settlements
 *   정산 목록. 우리 협회 소속 심판만.
 *   필터: tournament_id, referee_id, status, from(YYYY-MM-DD), to
 *   페이지: page(기본1), limit(기본20, 최대100)
 *   응답: items[] + pagination + summary(상태별 건수/합계)
 *   각 item은 서류 3종 완비 여부(documents_complete)를 포함.
 *
 * POST /api/web/referee-admin/settlements
 *   수동 정산 생성. 사무국장만(settlement_manage).
 *   body: { assignment_id, amount, memo? }
 *   검증: (1) 배정 존재 + 우리 협회 소속 (2) 배정 status==="completed" (3) 중복 없음
 *
 * 이유: 배정 completed 시 자동 생성되지만, 누락/오류 복구용 수동 생성 경로 필요.
 *
 * 보안: getAssociationAdmin() + IDOR(referee.association_id), 상태 화이트리스트.
 */

export const dynamic = "force-dynamic";

// 요청에서 받는 상태 enum — 5종 (pending/scheduled/paid/cancelled/refunded)
const STATUS_ENUM = [
  "pending",
  "scheduled",
  "paid",
  "cancelled",
  "refunded",
] as const;

// POST 스키마 — 수동 정산 생성
const createSchema = z.object({
  assignment_id: z
    .union([z.number(), z.string()])
    .transform((v) => BigInt(v)),
  amount: z.number().int().min(0), // 원 단위, 음수 금지
  memo: z.string().max(500).optional().nullable(),
});

// ── GET: 정산 목록 + 요약 ──
export async function GET(req: NextRequest) {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }

  const { searchParams } = new URL(req.url);

  // 쿼리 파싱
  const tournamentIdRaw = searchParams.get("tournament_id");
  const refereeIdRaw = searchParams.get("referee_id");
  const statusRaw = searchParams.get("status");
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const pageRaw = searchParams.get("page");
  const limitRaw = searchParams.get("limit");

  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(limitRaw ?? "20", 10) || 20)
  );

  // where 조립 — 우리 협회 심판으로 필터 (IDOR)
  // referee.association_id 중첩 필터는 Prisma 관계 필터.
  const where: Record<string, unknown> = {
    referee: { association_id: admin.associationId },
  };

  // 상태 필터 — 화이트리스트에 있는 값만 통과
  if (statusRaw && (STATUS_ENUM as readonly string[]).includes(statusRaw)) {
    where.status = statusRaw;
  }

  if (refereeIdRaw) {
    try {
      where.referee_id = BigInt(refereeIdRaw);
    } catch {
      return apiError("referee_id가 유효하지 않습니다.", 400);
    }
  }

  // 대회 필터는 assignment → tournament_match → tournamentId(String UUID)로 접근하지만,
  // RefereeSettlement → RefereeAssignment → tournament_match_id는 관계 정의가
  // schema에 없어(FK만 있음) 다단계 중첩 필터 사용 불가.
  // → 대회 필터는 matchIds를 먼저 조회 후 assignment_id 필터로 변환한다.
  // tournamentId는 Tournament.id가 String(UUID)이므로 BigInt 변환 금지.
  const tournamentId: string | null = tournamentIdRaw;

  // 기간 필터 — paid_at 기준으로 하면 pending은 빠져 부적절.
  // created_at(정산 생성 시각) 기준으로 필터.
  if (fromRaw || toRaw) {
    const createdFilter: Record<string, Date> = {};
    if (fromRaw) {
      const d = new Date(`${fromRaw}T00:00:00.000Z`);
      if (!isNaN(d.getTime())) createdFilter.gte = d;
    }
    if (toRaw) {
      // "to"는 해당 날짜 포함 → 23:59:59로 확장
      const d = new Date(`${toRaw}T23:59:59.999Z`);
      if (!isNaN(d.getTime())) createdFilter.lte = d;
    }
    if (Object.keys(createdFilter).length > 0) {
      where.created_at = createdFilter;
    }
  }

  try {
    // 대회 필터가 있으면 우선 해당 대회의 match id 집합 조회 후
    // 그 match id를 가진 assignment들의 id를 구해 where에 추가.
    if (tournamentId !== null) {
      const matches = await prisma.tournamentMatch.findMany({
        where: { tournamentId },
        select: { id: true },
      });
      const matchIds = matches.map((m) => m.id);
      if (matchIds.length === 0) {
        // 대회에 경기가 하나도 없으면 빈 결과
        return apiSuccess({
          items: [],
          total: 0,
          page,
          limit,
          total_pages: 0,
          summary: emptySummary(),
        });
      }
      const assignments = await prisma.refereeAssignment.findMany({
        where: { tournament_match_id: { in: matchIds } },
        select: { id: true },
      });
      const assignmentIds = assignments.map((a) => a.id);
      if (assignmentIds.length === 0) {
        return apiSuccess({
          items: [],
          total: 0,
          page,
          limit,
          total_pages: 0,
          summary: emptySummary(),
        });
      }
      where.assignment_id = { in: assignmentIds };
    }

    // 요약은 전체 기간(페이지 무관)으로 status별 count + sum
    // Prisma groupBy로 한 번에 처리
    const summaryRows = await prisma.refereeSettlement.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
      _sum: { amount: true },
    });

    const summary = emptySummary();
    let totalCount = 0;
    let totalAmount = 0;
    for (const row of summaryRows) {
      const s = row.status as (typeof STATUS_ENUM)[number];
      const cnt = row._count._all;
      const amt = row._sum.amount ?? 0;
      totalCount += cnt;
      totalAmount += amt;
      if ((STATUS_ENUM as readonly string[]).includes(s)) {
        summary[s].count = cnt;
        summary[s].amount = amt;
      }
    }
    summary.total.count = totalCount;
    summary.total.amount = totalAmount;

    // 실제 목록 페이지 조회
    const [total, items] = await Promise.all([
      prisma.refereeSettlement.count({ where }),
      prisma.refereeSettlement.findMany({
        where,
        orderBy: [{ created_at: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          referee_id: true,
          assignment_id: true,
          amount: true,
          status: true,
          scheduled_at: true,
          paid_at: true,
          memo: true,
          created_at: true,
          updated_at: true,
          referee: {
            select: {
              id: true,
              registered_name: true,
              user: { select: { name: true, nickname: true } },
            },
          },
          assignment: {
            select: {
              id: true,
              role: true,
              status: true,
              tournament_match_id: true,
              fee: true,
            },
          },
        },
      }),
    ]);

    // 배치: 경기(tournament_match) 정보를 한 번에 조회 (N+1 방지)
    const matchIdSet = new Set<bigint>();
    for (const it of items) {
      if (it.assignment?.tournament_match_id) {
        matchIdSet.add(it.assignment.tournament_match_id);
      }
    }
    // TournamentMatch 필드 맵핑: tournamentId(String UUID), scheduledAt, roundName, venue_name(snake).
    // 팀 이름은 TournamentTeam에 name 컬럼이 없고 별도 Team 모델을 거쳐야 하므로
    // 1차에서는 표시 생략 (round_name + venue로 식별 충분). 추후 필요 시 team join 추가.
    const matches = matchIdSet.size
      ? await prisma.tournamentMatch.findMany({
          where: { id: { in: Array.from(matchIdSet) } },
          select: {
            id: true,
            tournamentId: true,
            scheduledAt: true,
            venue_name: true,
            roundName: true,
          },
        })
      : [];
    const matchMap = new Map(matches.map((m) => [m.id.toString(), m]));

    // 대회 이름도 묶어 조회 — Tournament.id는 String(UUID)
    const tournamentIdSet = new Set<string>();
    for (const m of matches) {
      if (m.tournamentId) tournamentIdSet.add(m.tournamentId);
    }
    const tournaments = tournamentIdSet.size
      ? await prisma.tournament.findMany({
          where: { id: { in: Array.from(tournamentIdSet) } },
          select: { id: true, name: true },
        })
      : [];
    const tournamentMap = new Map(tournaments.map((t) => [t.id, t.name]));

    // 각 심판의 서류 3종(certificate/id_card/bankbook) 완비 여부 조회.
    //   referee_id 목록 수집 → RefereeDocument 일괄 조회 → docType 집합으로 판정.
    const refereeIdSet = new Set<bigint>();
    for (const it of items) refereeIdSet.add(it.referee_id);
    const docs = refereeIdSet.size
      ? await prisma.refereeDocument.findMany({
          where: {
            referee_id: { in: Array.from(refereeIdSet) },
            doc_type: { in: ["certificate", "id_card", "bankbook"] },
          },
          select: { referee_id: true, doc_type: true },
        })
      : [];
    // referee_id별 보유 doc_type set
    const docsByReferee = new Map<string, Set<string>>();
    for (const d of docs) {
      const key = d.referee_id.toString();
      if (!docsByReferee.has(key)) docsByReferee.set(key, new Set());
      docsByReferee.get(key)!.add(d.doc_type);
    }

    const REQUIRED_DOCS = ["certificate", "id_card", "bankbook"] as const;

    const mapped = items.map((s) => {
      const mk = s.assignment?.tournament_match_id?.toString();
      const match = mk ? matchMap.get(mk) : null;
      const tournamentName = match?.tournamentId
        ? tournamentMap.get(match.tournamentId) ?? null
        : null;
      const refereeDocs =
        docsByReferee.get(s.referee_id.toString()) ?? new Set<string>();
      // 부족한 서류 목록 계산 (UI 툴팁용)
      const missingDocs = REQUIRED_DOCS.filter((d) => !refereeDocs.has(d));

      return {
        id: s.id,
        referee_id: s.referee_id,
        referee_name:
          s.referee.user?.name ??
          s.referee.user?.nickname ??
          s.referee.registered_name ??
          `심판 #${s.referee.id.toString()}`,
        assignment_id: s.assignment_id,
        role: s.assignment?.role ?? null,
        assignment_status: s.assignment?.status ?? null,
        fee_snapshot: s.assignment?.fee ?? null,
        amount: s.amount,
        status: s.status,
        scheduled_at: s.scheduled_at,
        paid_at: s.paid_at,
        memo: s.memo,
        created_at: s.created_at,
        updated_at: s.updated_at,
        match: match
          ? {
              id: match.id,
              tournament_id: match.tournamentId,
              tournament_name: tournamentName,
              scheduled_at: match.scheduledAt,
              venue_name: match.venue_name,
              round_name: match.roundName,
            }
          : null,
        documents_complete: missingDocs.length === 0,
        missing_documents: missingDocs, // 툴팁 표시용
      };
    });

    return apiSuccess({
      items: mapped,
      total,
      page,
      limit,
      total_pages: Math.max(1, Math.ceil(total / limit)),
      summary,
    });
  } catch (error) {
    console.error("[referee-admin/settlements] GET 실패:", error);
    return apiError("정산 목록을 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}

// 초기 요약 객체 (status별 count/amount 0으로 채움 + total)
function emptySummary() {
  return {
    total: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
    scheduled: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 },
    refunded: { count: 0, amount: 0 },
  };
}

// ── POST: 수동 정산 생성 ──
export async function POST(req: NextRequest) {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  const denied = requirePermission(admin.role, "settlement_manage");
  if (denied) return denied;

  // 봇 방어 — 헬스체크 봇 계정은 쓰기 차단
  const botCheck = await requireNotBot(admin.userId);
  if (botCheck) return botCheck.error;

  // body 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }
  const { assignment_id, amount, memo } = parsed.data;

  try {
    // 1) 배정 조회 + 소속 협회 확인
    const assignment = await prisma.refereeAssignment.findUnique({
      where: { id: assignment_id },
      select: {
        id: true,
        referee_id: true,
        status: true,
        referee: { select: { association_id: true } },
      },
    });
    if (!assignment) {
      return apiError("배정을 찾을 수 없습니다.", 404, "NOT_FOUND");
    }
    if (assignment.referee.association_id !== admin.associationId) {
      return apiError(
        "다른 협회의 배정에 정산을 생성할 수 없습니다.",
        403,
        "FORBIDDEN"
      );
    }

    // 2) completed 배정만 정산 가능
    if (assignment.status !== "completed") {
      return apiError(
        "완료(completed) 상태의 배정만 정산을 생성할 수 있습니다.",
        400,
        "ASSIGNMENT_NOT_COMPLETED"
      );
    }

    // 3) 이미 정산 있는지 확인 (unique 제약)
    const existing = await prisma.refereeSettlement.findUnique({
      where: { assignment_id },
      select: { id: true },
    });
    if (existing) {
      return apiError(
        "이미 해당 배정에 대한 정산이 존재합니다.",
        409,
        "DUPLICATE_SETTLEMENT"
      );
    }

    // 4) 정산 생성
    const created = await prisma.refereeSettlement.create({
      data: {
        referee_id: assignment.referee_id,
        assignment_id,
        amount,
        status: "pending", // 수동 생성도 기본은 pending
        memo: memo ?? null,
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
        created_at: true,
      },
    });

    return apiSuccess({ settlement: created }, 201);
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === "P2002") {
      return apiError(
        "이미 해당 배정에 대한 정산이 존재합니다.",
        409,
        "DUPLICATE_SETTLEMENT"
      );
    }
    console.error("[referee-admin/settlements] POST 실패:", error);
    return apiError("정산 생성에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
