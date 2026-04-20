import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * GET /api/web/teams/[id]/my-application
 *
 * 이유: M7 팀 가입 신청자 측 UI에서 본인 신청 상태를 판단해
 *      대기/승인/거부 분기 렌더링하기 위해 필요.
 *      기존 POST /join 만으로는 신청 직후 상태 외에는 알 수 없고,
 *      페이지 재진입/새로고침 시 상태 복원이 불가능했음.
 *
 * 응답 (apiSuccess → snake_case 자동 변환):
 *   - is_member: 이미 팀 멤버인지 (teamMember 테이블)
 *   - application: 최신 1건의 신청 레코드. 없으면 null
 *     - status: "pending" | "approved" | "rejected" | 기타(팀 측에서 쓰는 값)
 *     - rejection_reason: 거부 사유 (있을 때만 노출. (a) 정책)
 *
 * IDOR: userId = session 본인 고정. 다른 사용자 신청 조회 불가.
 */
export const GET = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    const teamId = BigInt(id);

    // 팀 존재 확인 (404 처리) — 없는 팀 id로 조회 시 noise 줄임
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true },
    });
    if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

    // 멤버 여부 + 최신 신청 병렬 조회
    // 인덱스 활용: teamMember (teamId+userId), team_join_requests (team_id+user_id+status)
    const [member, application] = await Promise.all([
      prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: ctx.userId } },
        select: { userId: true },
      }),
      prisma.team_join_requests.findFirst({
        where: { team_id: teamId, user_id: ctx.userId },
        orderBy: { created_at: "desc" }, // 최신 1건 (거부 후 재신청 시 최신 pending 우선)
        select: {
          id: true,
          status: true,
          message: true,
          rejection_reason: true,
          preferred_position: true,
          preferred_jersey_number: true,
          created_at: true,
          processed_at: true,
        },
      }),
    ]);

    return apiSuccess({
      isMember: !!member,
      application: application
        ? {
            // BigInt → string (JSON 직렬화 + 클라 fetch id 파라미터 호환)
            id: application.id.toString(),
            status: application.status,
            message: application.message,
            rejectionReason: application.rejection_reason,
            preferredPosition: application.preferred_position,
            preferredJerseyNumber: application.preferred_jersey_number,
            createdAt: application.created_at,
            processedAt: application.processed_at,
          }
        : null,
    });
  } catch {
    return apiError("신청 상태를 불러오지 못했습니다.", 500);
  }
});

/**
 * DELETE /api/web/teams/[id]/my-application
 *
 * 이유: pending 상태에서 사용자가 직접 신청을 취소할 수 있어야 함.
 *      기획서(Day 18 M7) 요구사항 3번.
 *
 * 정책:
 *   - pending 건만 삭제 가능. 이미 승인/거부된 건은 409 (기록 보존)
 *   - 물리 삭제(row 제거). 기록 남길 이유 약함 — 팀장이 "누가 취소했나"를
 *     알 필요는 사실상 없고, 무제한 재신청 정책과 자연스럽게 맞음.
 *   - 본인 것만 (IDOR 자동 차단).
 */
export const DELETE = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    const teamId = BigInt(id);

    // pending 신청만 찾아 삭제. approved/rejected는 이미 처리되어 취소 불가.
    const pending = await prisma.team_join_requests.findFirst({
      where: { team_id: teamId, user_id: ctx.userId, status: "pending" },
      select: { id: true },
    });

    if (!pending) {
      return apiError("취소할 수 있는 대기 중 신청이 없습니다.", 409);
    }

    await prisma.team_join_requests.delete({
      where: { id: pending.id },
    });

    return apiSuccess({ success: true, message: "신청이 취소되었습니다." });
  } catch {
    return apiError("신청 취소 중 오류가 발생했습니다.", 500);
  }
});
