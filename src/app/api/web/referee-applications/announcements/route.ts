import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/web/referee-applications/announcements
 *
 * 본인에게 열려있는 배정 공고 목록.
 *
 * 이유: 심판이 로그인 후 "내가 신청할 수 있는 공고"만 보이도록 필터링되어야 한다.
 *      - 본인 소속 협회의 open 공고만
 *      - 본인 역할 유형(referee/game_official)과 일치하는 것만
 *      - 이미 신청했는지 플래그 포함
 *
 * 응답 형태:
 *   items: [{ id, tournament_name, title, dates, required_count, deadline, already_applied }]
 */

export const dynamic = "force-dynamic";

export const GET = withWebAuth(async (_req: Request, ctx: WebAuthContext) => {
  try {
    // 1) 본인 Referee 조회 — user_id는 unique이므로 findUnique
    //    association_id/role_type 두 개가 목록 필터의 핵심 키
    const referee = await prisma.referee.findUnique({
      where: { user_id: ctx.userId },
      select: {
        id: true,
        association_id: true,
        role_type: true,
      },
    });
    if (!referee) {
      return apiError("먼저 심판 프로필을 등록하세요.", 404, "NO_REFEREE_PROFILE");
    }
    if (!referee.association_id) {
      // 협회 미소속 — 공고 대상 아님
      return apiSuccess({ items: [] });
    }

    // 2) role_type 매핑: Referee.role_type은 "referee/scorer/timer" 등인데
    //    공고의 role_type은 "referee" | "game_official" 이분법.
    //    referee → referee, 그 외(scorer/timer 등) → game_official 로 판단
    const myRoleBucket: "referee" | "game_official" =
      referee.role_type === "referee" ? "referee" : "game_official";

    // 3) 본인 협회의 open 공고 + 역할 매칭만 조회
    const announcements = await prisma.assignmentAnnouncement.findMany({
      where: {
        association_id: referee.association_id,
        status: "open",
        role_type: myRoleBucket,
      },
      orderBy: [{ created_at: "desc" }],
      select: {
        id: true,
        tournament_id: true,
        title: true,
        description: true,
        role_type: true,
        dates: true,
        required_count: true,
        deadline: true,
        status: true,
        created_at: true,
        // 본인 신청 여부 판단용 — referee_id로 필터
        applications: {
          where: { referee_id: referee.id },
          select: { id: true, status: true },
        },
      },
    });

    // 4) 대회 이름 일괄 조회
    const tIds = [...new Set(announcements.map((a) => a.tournament_id))];
    const tournaments = tIds.length
      ? await prisma.tournament.findMany({
          where: { id: { in: tIds } },
          select: { id: true, name: true },
        })
      : [];
    const tMap = new Map(tournaments.map((t) => [t.id, t.name]));

    // 5) 응답 매핑
    const items = announcements.map((a) => ({
      id: a.id,
      tournament_id: a.tournament_id,
      tournament_name: tMap.get(a.tournament_id) ?? null,
      title: a.title,
      description: a.description,
      role_type: a.role_type,
      dates: a.dates,
      required_count: a.required_count,
      deadline: a.deadline,
      status: a.status,
      created_at: a.created_at,
      // 이미 신청한 공고는 UI에서 "신청 완료" 표시
      already_applied: a.applications.length > 0,
      my_application_id: a.applications[0]?.id ?? null,
    }));

    return apiSuccess({ items });
  } catch (error) {
    console.error("[referee-applications/announcements] GET 실패:", error);
    return apiError("공고 목록을 불러오지 못했습니다.", 500, "INTERNAL_ERROR");
  }
});
