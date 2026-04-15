import { apiSuccess, apiError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import type { NextRequest } from "next/server";

/**
 * GET /api/web/referee-admin/settlements/summary
 *
 * 정산 대시보드 통계.
 *
 * 권한: settlement_view (팀장급/사무국장/임원까지 열람)
 *
 * 쿼리: ?year=2026&month=4 — 선택적. 미지정 시 "이번 달" 사용.
 *   (기준 시각: created_at — 정산 생성 시점. paid_at 기준은 by_status의 paid 집계에만 쓰이는 게 자연스럽지만
 *    대시보드 의미상 "이번 달에 생긴 정산"이 기본 관점으로 제일 이해하기 쉬움)
 *
 * 응답:
 *   total:                     { count, amount } — 이번 달 전체
 *   by_status:                 { pending: {count, amount}, scheduled: {...}, paid: {...}, cancelled: {...}, refunded: {...} }
 *   by_month:                  [{ month: "2026-01", paid_amount, paid_count, pending_count }, ...]  // 최근 6개월
 *   top_referees:              [{ referee_id, name, total_paid, count }]                            // 지급액 상위 5명
 *   by_tournament:             [{ tournament_id, name, total_amount, count }]                       // 대회별 상위 5개
 *   documents_incomplete_count: N                                                                    // 서류 미완비 심판의 "pending/scheduled" 정산 건수
 *
 * 이유: 사무국장이 월말 정산 전체 상황을 한 화면에서 파악할 수 있도록.
 */

export const dynamic = "force-dynamic";

const STATUS_ENUM = [
  "pending",
  "scheduled",
  "paid",
  "cancelled",
  "refunded",
] as const;

const REQUIRED_DOCS = ["certificate", "id_card", "bankbook"] as const;

function emptyStatusBuckets() {
  return {
    pending: { count: 0, amount: 0 },
    scheduled: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 },
    refunded: { count: 0, amount: 0 },
  };
}

// YYYY-MM 문자열 생성
function ymKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  // 통계 열람은 settlement_view (사무국장 + 팀장 + 임원)
  const denied = requirePermission(admin.role, "settlement_view");
  if (denied) return denied;

  // ── 기간 파라미터 ──
  const { searchParams } = new URL(req.url);
  const yearRaw = searchParams.get("year");
  const monthRaw = searchParams.get("month");
  const now = new Date();
  const year =
    yearRaw && /^\d{4}$/.test(yearRaw) ? parseInt(yearRaw, 10) : now.getUTCFullYear();
  const month =
    monthRaw && /^\d{1,2}$/.test(monthRaw)
      ? Math.min(12, Math.max(1, parseInt(monthRaw, 10)))
      : now.getUTCMonth() + 1;

  // 월 시작/끝 (UTC 기준)
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)); // 다음 달 1일

  // 최근 6개월 시작 (선택월 포함 6개월: 선택월 - 5개월 ~ 선택월)
  // 이유: 사용자가 2026-04를 선택하면 [2025-11 ~ 2026-04]가 나와야 대시보드 하이라이트(isCurrent)가 동작.
  const sixMonthStart = new Date(Date.UTC(year, month - 5, 1, 0, 0, 0, 0));

  try {
    // 협회 소속 심판 id 집합 (통계 where에 사용)
    // 이유: Prisma groupBy에 중첩 관계 필터는 지원되지만 복잡해지므로, 미리 id 목록으로 변환해 단순화.
    const referees = await prisma.referee.findMany({
      where: { association_id: admin.associationId },
      select: { id: true },
    });
    const refereeIds = referees.map((r) => r.id);
    if (refereeIds.length === 0) {
      // 협회에 심판이 없으면 빈 결과
      return apiSuccess({
        year,
        month,
        total: { count: 0, amount: 0 },
        by_status: emptyStatusBuckets(),
        by_month: [],
        top_referees: [],
        by_tournament: [],
        documents_incomplete_count: 0,
      });
    }

    // 1) by_status (이번 달) — groupBy로 한 방
    const monthWhere = {
      referee_id: { in: refereeIds },
      created_at: { gte: monthStart, lt: monthEnd },
    };

    const statusRows = await prisma.refereeSettlement.groupBy({
      by: ["status"],
      where: monthWhere,
      _count: { _all: true },
      _sum: { amount: true },
    });

    const by_status = emptyStatusBuckets();
    let totalCount = 0;
    let totalAmount = 0;
    for (const row of statusRows) {
      const s = row.status as (typeof STATUS_ENUM)[number];
      const cnt = row._count._all;
      const amt = row._sum.amount ?? 0;
      totalCount += cnt;
      totalAmount += amt;
      if ((STATUS_ENUM as readonly string[]).includes(s)) {
        by_status[s].count = cnt;
        by_status[s].amount = amt;
      }
    }

    // 2) by_month — 최근 6개월 월별 paid/pending 추이
    //    groupBy에 date_trunc 같은 DB 함수는 Prisma 표준으로 어려워,
    //    "정산 생성일 + 상태" 조합으로 6개월치 raw 조회 후 JS에서 월별 집계.
    //    대안: $queryRaw로 SQL 집계도 가능하지만 Prisma + 타입 일관성 유지 위해 JS 집계 선택.
    const recent = await prisma.refereeSettlement.findMany({
      where: {
        referee_id: { in: refereeIds },
        created_at: { gte: sixMonthStart, lt: monthEnd },
      },
      select: { amount: true, status: true, created_at: true, paid_at: true },
    });

    // 월별 버킷 초기화 (6개) — 선택월 포함 최근 6개월
    // i=0 → 5개월 전, i=5 → 선택월 (가장 오래된 월부터 선택월까지 오름차순)
    const monthKeys: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(Date.UTC(year, month - 1 - (5 - i), 1));
      monthKeys.push(ymKey(d));
    }
    const monthBuckets = new Map<
      string,
      { paid_amount: number; paid_count: number; pending_count: number }
    >();
    for (const k of monthKeys) {
      monthBuckets.set(k, { paid_amount: 0, paid_count: 0, pending_count: 0 });
    }
    for (const r of recent) {
      const key = ymKey(r.created_at);
      const bucket = monthBuckets.get(key);
      if (!bucket) continue;
      if (r.status === "paid") {
        bucket.paid_amount += r.amount;
        bucket.paid_count += 1;
      } else if (r.status === "pending" || r.status === "scheduled") {
        bucket.pending_count += 1;
      }
    }
    const by_month = monthKeys.map((k) => ({
      month: k,
      ...(monthBuckets.get(k) ?? {
        paid_amount: 0,
        paid_count: 0,
        pending_count: 0,
      }),
    }));

    // 3) top_referees — 이번 달 paid 금액 상위 5명 (groupBy)
    const topRows = await prisma.refereeSettlement.groupBy({
      by: ["referee_id"],
      where: {
        referee_id: { in: refereeIds },
        status: "paid",
        created_at: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    });
    // 심판 이름 가져오기 (한 번의 쿼리로)
    const topRefereeIds = topRows.map((r) => r.referee_id);
    const topRefereeDetail = topRefereeIds.length
      ? await prisma.referee.findMany({
          where: { id: { in: topRefereeIds } },
          select: {
            id: true,
            registered_name: true,
            user: { select: { name: true, nickname: true } },
          },
        })
      : [];
    const topMap = new Map(topRefereeDetail.map((r) => [r.id.toString(), r]));
    const top_referees = topRows.map((r) => {
      const detail = topMap.get(r.referee_id.toString());
      const name =
        detail?.user?.name ??
        detail?.user?.nickname ??
        detail?.registered_name ??
        `심판 #${r.referee_id.toString()}`;
      return {
        referee_id: r.referee_id,
        name,
        total_paid: r._sum.amount ?? 0,
        count: r._count._all,
      };
    });

    // 4) by_tournament — 이번 달 대회별 정산 총액 상위 5개
    //    RefereeSettlement → assignment.tournament_match_id → TournamentMatch.tournamentId 흐름.
    //    Prisma groupBy는 관계 필드 직접 group 불가 → raw 집계 후 JS로 대회명 합치기.
    const monthSettlements = await prisma.refereeSettlement.findMany({
      where: monthWhere,
      select: {
        amount: true,
        assignment: { select: { tournament_match_id: true } },
      },
    });
    const matchIds = Array.from(
      new Set(monthSettlements.map((s) => s.assignment.tournament_match_id))
    );
    const matches = matchIds.length
      ? await prisma.tournamentMatch.findMany({
          where: { id: { in: matchIds } },
          select: { id: true, tournamentId: true },
        })
      : [];
    const matchToTournament = new Map(
      matches.map((m) => [m.id.toString(), m.tournamentId])
    );
    const tournamentBuckets = new Map<
      string,
      { total_amount: number; count: number }
    >();
    for (const s of monthSettlements) {
      const tid = matchToTournament.get(
        s.assignment.tournament_match_id.toString()
      );
      if (!tid) continue;
      const cur = tournamentBuckets.get(tid) ?? { total_amount: 0, count: 0 };
      cur.total_amount += s.amount;
      cur.count += 1;
      tournamentBuckets.set(tid, cur);
    }
    // 상위 5개 대회 추출
    const topTournamentPairs = Array.from(tournamentBuckets.entries())
      .sort((a, b) => b[1].total_amount - a[1].total_amount)
      .slice(0, 5);
    const topTournamentIds = topTournamentPairs.map(([id]) => id);
    const tournamentDetails = topTournamentIds.length
      ? await prisma.tournament.findMany({
          where: { id: { in: topTournamentIds } },
          select: { id: true, name: true },
        })
      : [];
    const tournamentNameMap = new Map(
      tournamentDetails.map((t) => [t.id, t.name])
    );
    const by_tournament = topTournamentPairs.map(([id, v]) => ({
      tournament_id: id,
      name: tournamentNameMap.get(id) ?? "(이름 없음)",
      total_amount: v.total_amount,
      count: v.count,
    }));

    // 5) documents_incomplete_count — 서류 미완비 심판의 "pending/scheduled" 정산 건수
    //    이유: paid 전환 시 막히는 정산 개수를 사전 경고. 관리자가 서류 수집을 독촉하도록.
    const activeDocs = await prisma.refereeDocument.findMany({
      where: {
        referee_id: { in: refereeIds },
        doc_type: { in: [...REQUIRED_DOCS] },
      },
      select: { referee_id: true, doc_type: true },
    });
    const docsByReferee = new Map<string, Set<string>>();
    for (const d of activeDocs) {
      const key = d.referee_id.toString();
      if (!docsByReferee.has(key)) docsByReferee.set(key, new Set());
      docsByReferee.get(key)!.add(d.doc_type);
    }
    const incompleteRefereeIds = refereeIds.filter((rid) => {
      const owned = docsByReferee.get(rid.toString()) ?? new Set();
      return REQUIRED_DOCS.some((d) => !owned.has(d));
    });
    const documents_incomplete_count =
      incompleteRefereeIds.length > 0
        ? await prisma.refereeSettlement.count({
            where: {
              referee_id: { in: incompleteRefereeIds },
              status: { in: ["pending", "scheduled"] },
            },
          })
        : 0;

    return apiSuccess({
      year,
      month,
      total: { count: totalCount, amount: totalAmount },
      by_status,
      by_month,
      top_referees,
      by_tournament,
      documents_incomplete_count,
    });
  } catch (error) {
    console.error("[referee-admin/settlements/summary] GET 실패:", error);
    return apiError("통계를 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
}
