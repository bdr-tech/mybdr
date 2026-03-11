import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/web/teams/[id]/members -- 팀장: 가입신청 목록 조회
export const GET = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;
  const teamId = BigInt(id);

  // IDOR: 요청자가 해당 팀의 captain인지 확인
  const isCaptain = await prisma.teamMember.findFirst({
    where: { teamId, userId: ctx.userId, role: "captain", status: "active" },
  });
  if (!isCaptain && ctx.session.role !== "super_admin") {
    return apiError("FORBIDDEN", 403);
  }

  const requests = await prisma.team_join_requests.findMany({
    where: { team_id: teamId, status: "pending" },
    include: {
      users_team_join_requests_user_idTousers: {
        select: { id: true, nickname: true, name: true, position: true, city: true, district: true, profile_image: true },
      },
    },
    orderBy: { created_at: "asc" },
  });

  return apiSuccess(
    requests.map((r) => ({
      id: r.id.toString(),
      user_id: r.user_id.toString(),
      user: r.users_team_join_requests_user_idTousers
        ? {
            id: r.users_team_join_requests_user_idTousers.id.toString(),
            nickname: r.users_team_join_requests_user_idTousers.nickname,
            name: r.users_team_join_requests_user_idTousers.name,
            position: r.users_team_join_requests_user_idTousers.position,
            city: r.users_team_join_requests_user_idTousers.city,
            district: r.users_team_join_requests_user_idTousers.district,
            profile_image: r.users_team_join_requests_user_idTousers.profile_image,
          }
        : null,
      message: r.message,
      preferred_position: r.preferred_position,
      created_at: r.created_at.toISOString(),
    })),
  );
});

// PATCH /api/web/teams/[id]/members -- 팀장: 가입신청 승인/거부
export const PATCH = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;
  const teamId = BigInt(id);

  // IDOR: 요청자가 해당 팀의 captain인지 확인
  const isCaptain = await prisma.teamMember.findFirst({
    where: { teamId, userId: ctx.userId, role: "captain", status: "active" },
  });
  if (!isCaptain && ctx.session.role !== "super_admin") {
    return apiError("FORBIDDEN", 403);
  }

  let body: { requestId: string; action: string };
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", 400);
  }

  const { requestId, action } = body;
  if (!requestId || !["approve", "reject"].includes(action)) {
    return apiError("INVALID_PARAMS", 400, "requestId와 action(approve|reject)이 필요합니다.");
  }

  const joinRequest = await prisma.team_join_requests.findUnique({
    where: { id: BigInt(requestId) },
  });
  if (!joinRequest || joinRequest.team_id !== teamId) {
    return apiError("NOT_FOUND", 404);
  }
  if (joinRequest.status !== "pending") {
    return apiError("ALREADY_PROCESSED", 409, "이미 처리된 신청입니다.");
  }

  const applicantId = joinRequest.user_id;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });

  if (action === "approve") {
    await prisma.$transaction([
      prisma.team_join_requests.update({
        where: { id: BigInt(requestId) },
        data: { status: "approved", processed_by_id: ctx.userId, processed_at: new Date() },
      }),
      prisma.teamMember.create({
        data: {
          teamId,
          userId: applicantId,
          role: "member",
          status: "active",
          joined_at: new Date(),
        },
      }),
      prisma.team.update({
        where: { id: teamId },
        data: { members_count: { increment: 1 } },
      }),
    ]);

    createNotification({
      userId: applicantId,
      notificationType: NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_APPROVED,
      title: "팀 가입 승인",
      content: `"${team?.name}" 팀 가입이 승인되었습니다.`,
      actionUrl: `/teams/${teamId}`,
    }).catch(() => {});
  } else {
    await prisma.team_join_requests.update({
      where: { id: BigInt(requestId) },
      data: { status: "rejected", processed_by_id: ctx.userId, processed_at: new Date() },
    });

    createNotification({
      userId: applicantId,
      notificationType: NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_REJECTED,
      title: "팀 가입 거부",
      content: `"${team?.name}" 팀 가입 신청이 거부되었습니다.`,
      actionUrl: `/teams/${teamId}`,
    }).catch(() => {});
  }

  return apiSuccess({ action, request_id: requestId });
});
