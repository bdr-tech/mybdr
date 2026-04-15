import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

/**
 * /api/web/referee-assignments
 *
 * 본인 배정(RefereeAssignment) 목록 조회.
 * - referee_id는 세션 기반 (IDOR 방지)
 * - TournamentMatch와 역관계가 없으므로, 배정 목록 조회 후 match_id들로 별도 쿼리하여 매핑
 *
 * 쿼리 파라미터:
 *   status — 필터 (assigned/confirmed/declined/cancelled/completed), 미지정 시 전체
 *   page   — 페이지 번호 (기본 1)
 *   limit  — 페이지당 건수 (기본 20)
 */

export const dynamic = "force-dynamic";

// 역할 한글 매핑 (클라이언트에서 쓸 수 있도록 API에서 제공)
const ROLE_LABEL: Record<string, string> = {
  main: "주심",
  sub: "부심",
  recorder: "기록원",
  timer: "타이머",
};

// ─────────────────────────────────────────────────────────────
// GET — 본인 배정 목록 (req, ctx 패턴: URL 쿼리 파라미터 사용)
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

    // 배정 목록 + 총 건수 병렬 조회
    const [items, total] = await Promise.all([
      prisma.refereeAssignment.findMany({
        where,
        orderBy: { assigned_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.refereeAssignment.count({ where }),
    ]);

    // 경기 정보 별도 조회 (tournament_match_id 목록으로)
    // RefereeAssignment → TournamentMatch 간 Prisma 관계가 없으므로 수동 조인
    const matchIds = [...new Set(items.map((a) => a.tournament_match_id))];
    const matches = matchIds.length > 0
      ? await prisma.tournamentMatch.findMany({
          where: { id: { in: matchIds } },
          // include로 관계 데이터 가져오기 (TournamentTeam에는 name 없으므로 team 관계 추가)
          include: {
            tournament: { select: { name: true } },
            homeTeam: { include: { team: { select: { name: true } } } },
            awayTeam: { include: { team: { select: { name: true } } } },
          },
        })
      : [];

    // match 정보를 id 기준 Map으로 변환
    type MatchWithRelations = (typeof matches)[number];
    const matchMap = new Map<string, MatchWithRelations>(
      matches.map((m) => [m.id.toString(), m])
    );

    // 배정 + 경기정보 매핑하여 응답 구성
    const enrichedItems = items.map((a) => {
      const match = matchMap.get(a.tournament_match_id.toString());
      return {
        id: a.id,
        role: a.role,
        role_label: ROLE_LABEL[a.role] ?? a.role,
        status: a.status,
        assigned_at: a.assigned_at,
        memo: a.memo,
        // 경기 정보 (없으면 null)
        match: match
          ? {
              id: match.id,
              tournament_name: match.tournament?.name ?? null,
              scheduled_at: match.scheduledAt,
              venue_name: match.venue_name,
              round_name: match.roundName,
              match_status: match.status,
              // TournamentTeam → Team.name 으로 팀명 접근
              home_team: match.homeTeam?.team?.name ?? null,
              away_team: match.awayTeam?.team?.name ?? null,
              home_score: match.homeScore,
              away_score: match.awayScore,
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
    });
  } catch {
    return apiError("배정 목록을 불러올 수 없습니다.", 500);
  }
});
