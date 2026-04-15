import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

/**
 * /api/web/referee-settlements
 *
 * 본인 정산(RefereeSettlement) 목록 + 합계 조회.
 * - referee_id는 세션 기반 (IDOR 방지)
 * - 합계 3종: 전체 총액, 지급완료(paid) 총액, 미지급(pending) 총액
 *
 * 쿼리 파라미터:
 *   status — 필터 (pending/paid/cancelled), 미지정 시 전체
 *   page   — 페이지 번호 (기본 1)
 *   limit  — 페이지당 건수 (기본 20)
 */

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// GET — 본인 정산 목록 + 합계
// ─────────────────────────────────────────────────────────────
export const GET = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    // 본인 Referee 조회
    const referee = await prisma.referee.findUnique({
      where: { user_id: ctx.userId },
      select: { id: true },
    });
    if (!referee) {
      return apiError("먼저 심판 프로필을 등록하세요.", 404, "NO_REFEREE_PROFILE");
    }

    // 쿼리 파라미터 파싱
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // where 조건: 본인 referee_id + 선택적 status 필터
    const where = {
      referee_id: referee.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    // 정산 목록 + 총 건수 + 합계 3종 병렬 조회
    const [items, total, sumAll, sumPaid, sumPending] = await Promise.all([
      // 목록 (배정 정보 포함)
      prisma.refereeSettlement.findMany({
        where,
        include: {
          assignment: true, // 배정 정보 (role, tournament_match_id 등)
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      // 총 건수 (현재 필터 기준)
      prisma.refereeSettlement.count({ where }),
      // 합계: 전체 총액 (필터 무관, 본인 전체)
      prisma.refereeSettlement.aggregate({
        where: { referee_id: referee.id },
        _sum: { amount: true },
      }),
      // 합계: 지급완료 총액
      prisma.refereeSettlement.aggregate({
        where: { referee_id: referee.id, status: "paid" },
        _sum: { amount: true },
      }),
      // 합계: 미지급 총액
      prisma.refereeSettlement.aggregate({
        where: { referee_id: referee.id, status: "pending" },
        _sum: { amount: true },
      }),
    ]);

    // 배정에 연결된 경기정보를 별도 조회 (match 테이블과 관계 없으므로)
    const matchIds = [
      ...new Set(items.map((s) => s.assignment.tournament_match_id)),
    ];
    const matches = matchIds.length > 0
      ? await prisma.tournamentMatch.findMany({
          where: { id: { in: matchIds } },
          // include로 관계 데이터 가져오기 (TournamentTeam에 name 없으므로 team.name 접근)
          include: {
            tournament: { select: { name: true } },
            homeTeam: { include: { team: { select: { name: true } } } },
            awayTeam: { include: { team: { select: { name: true } } } },
          },
        })
      : [];

    type MatchWithRelations = (typeof matches)[number];
    const matchMap = new Map<string, MatchWithRelations>(
      matches.map((m) => [m.id.toString(), m])
    );

    // 응답 데이터 구성
    const enrichedItems = items.map((s) => {
      const match = matchMap.get(s.assignment.tournament_match_id.toString());
      return {
        id: s.id,
        amount: s.amount,
        status: s.status,
        paid_at: s.paid_at,
        memo: s.memo,
        created_at: s.created_at,
        // 배정 정보
        assignment: {
          id: s.assignment.id,
          role: s.assignment.role,
          status: s.assignment.status,
        },
        // 경기 정보
        match: match
          ? {
              tournament_name: match.tournament?.name ?? null,
              scheduled_at: match.scheduledAt,
              venue_name: match.venue_name,
              round_name: match.roundName,
              // TournamentTeam → Team.name 으로 팀명 접근
              home_team: match.homeTeam?.team?.name ?? null,
              away_team: match.awayTeam?.team?.name ?? null,
            }
          : null,
      };
    });

    return apiSuccess({
      items: enrichedItems,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      // 합계 3종 (null이면 0으로 대체)
      summary: {
        total_amount: sumAll._sum.amount ?? 0,
        paid_amount: sumPaid._sum.amount ?? 0,
        pending_amount: sumPending._sum.amount ?? 0,
      },
    });
  } catch {
    return apiError("정산 목록을 불러올 수 없습니다.", 500);
  }
});
