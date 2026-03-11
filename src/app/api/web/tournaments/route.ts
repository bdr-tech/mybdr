import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createTournament, hasCreatePermission } from "@/lib/services/tournament";

const FORMAT_MAP: Record<string, string> = {
  "싱글 엘리미네이션": "single_elimination",
  "라운드 로빈": "round_robin",
  "그룹 스테이지": "group_stage",
  "더블 엘리미네이션": "double_elimination",
  "스위스": "swiss",
};

export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const body = await req.json();
    const { name, format, startDate, endDate, subdomain, primaryColor, secondaryColor } = body;

    if (!name?.trim()) {
      return apiError("대회 이름은 필수입니다.", 400);
    }

    // 슈퍼관리자는 구독 체크 우회
    if (ctx.session.role !== "super_admin") {
      const canCreate = await hasCreatePermission(ctx.userId);
      if (!canCreate) {
        return apiError("UPGRADE_REQUIRED", 402);
      }
    }
    const normalizedFormat = FORMAT_MAP[format] ?? format ?? "single_elimination";

    // TC-NEW-022: 날짜 유효성 검사 (Invalid Date 방지)
    const parsedStart = startDate ? new Date(startDate) : null;
    const parsedEnd = endDate ? new Date(endDate) : null;
    if (parsedStart && isNaN(parsedStart.getTime())) {
      return apiError("유효하지 않은 시작일입니다.", 400);
    }
    if (parsedEnd && isNaN(parsedEnd.getTime())) {
      return apiError("유효하지 않은 종료일입니다.", 400);
    }
    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
      return apiError("시작일이 종료일보다 늦을 수 없습니다.", 400);
    }

    const tournament = await createTournament({
      name: name.trim(),
      organizerId: ctx.userId,
      format: normalizedFormat,
      startDate: parsedStart,
      endDate: parsedEnd,
      primaryColor,
      secondaryColor,
      subdomain: subdomain?.trim()?.toLowerCase(),
    });

    return apiSuccess({
      success: true,
      tournamentId: tournament.id,
      redirectUrl: `/tournament-admin/tournaments/${tournament.id}`,
    });
  } catch {
    return apiError("대회 생성 중 오류가 발생했습니다.", 500);
  }
});
