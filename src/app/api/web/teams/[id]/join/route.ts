import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

export const POST = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    const teamId = BigInt(id);

    // 이미 가입 요청했는지 확인
    const existingRequest = await prisma.team_join_requests.findFirst({
      where: { team_id: teamId, user_id: ctx.userId, status: "pending" },
    });
    if (existingRequest) {
      return apiError("이미 가입 신청한 팀입니다.", 409);
    }

    // 이미 멤버인지 확인
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: ctx.userId } },
    });
    if (existingMember) {
      return apiError("이미 팀 멤버입니다.", 409);
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

    if (team.auto_accept_members) {
      // 자동 수락
      await prisma.teamMember.create({
        data: {
          teamId,
          userId: ctx.userId,
          role: "member",
          status: "active",
          joined_at: new Date(),
        },
      });
      await prisma.team.update({
        where: { id: teamId },
        data: { members_count: { increment: 1 } },
      });
      return apiSuccess({ success: true, message: "팀에 가입되었습니다." });
    }

    // 가입 신청
    await prisma.team_join_requests.create({
      data: {
        team_id: teamId,
        user_id: ctx.userId,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 팀장(captain)에게 가입 신청 알림 발송 (fire-and-forget)
    const captain = await prisma.teamMember.findFirst({
      where: { teamId, role: "captain" },
    });
    if (captain) {
      // 신청자 닉네임 조회
      const applicant = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { nickname: true },
      });

      createNotification({
        userId: captain.userId,
        notificationType: NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_RECEIVED,
        title: "새 팀 가입 신청",
        content: `${applicant?.nickname ?? "사용자"}님이 "${team.name}" 팀에 가입 신청했습니다.`,
        actionUrl: `/teams/${team.id}`,
        metadata: {
          team: {
            id: team.id.toString(),
            name: team.name,
          },
          applicant: {
            id: ctx.userId.toString(),
            nickname: applicant?.nickname ?? null,
          },
        },
      }).catch(() => {});
    }

    return apiSuccess({ success: true, message: "가입 신청이 완료되었습니다. 승인을 기다려 주세요." });
  } catch {
    return apiError("가입 신청 중 오류가 발생했습니다.", 500);
  }
});
