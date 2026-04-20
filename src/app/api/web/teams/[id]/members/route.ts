import { prisma } from "@/lib/db/prisma";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { mergeTempMember } from "@/lib/teams/merge-temp-member";

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

  // 활성 멤버 목록
  const members = await prisma.teamMember.findMany({
    where: { teamId, status: "active" },
    include: { user: { select: { id: true, nickname: true, name: true, position: true, profile_image: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  // 가입 신청 목록
  const requests = await prisma.team_join_requests.findMany({
    where: { team_id: teamId, status: "pending" },
    include: {
      users_team_join_requests_user_idTousers: {
        select: { id: true, nickname: true, name: true, position: true, city: true, district: true, profile_image: true },
      },
    },
    orderBy: { created_at: "asc" },
  });

  return apiSuccess({
    members: members.map((m) => ({
      id: m.id.toString(),
      user_id: m.userId.toString(),
      nickname: m.user?.nickname ?? m.user?.name ?? "-",
      position: m.user?.position ?? null,
      profile_image: m.user?.profile_image ?? null,
      role: m.role ?? "member",
    })),
    requests: requests.map((r) => ({
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
  });
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

  let body: {
    requestId?: string;
    action?: string;
    memberId?: string;
    role?: string;
    // 거부 사유 (optional) — M7 UX에서 신청자에게 노출
    rejection_reason?: string;
  };
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", 400);
  }

  // ─── 역할 변경: { memberId, role } ───
  const VALID_ROLES = ["director", "coach", "captain", "manager", "treasurer", "member"];
  if (body.memberId && body.role) {
    if (!VALID_ROLES.includes(body.role)) {
      return apiError("INVALID_ROLE", 400, `유효한 역할: ${VALID_ROLES.join(", ")}`);
    }
    // 코치는 2명까지
    if (body.role === "coach") {
      const coachCount = await prisma.teamMember.count({
        where: { teamId, role: "coach", status: "active", id: { not: BigInt(body.memberId) } },
      });
      if (coachCount >= 2) {
        return apiError("COACH_LIMIT", 400, "코치는 최대 2명까지 가능합니다.");
      }
    }
    await prisma.teamMember.update({
      where: { id: BigInt(body.memberId) },
      data: { role: body.role },
    });
    return apiSuccess({ memberId: body.memberId, role: body.role });
  }

  // ─── 가입 승인/거부: { requestId, action } ───
  const { requestId, action } = body;
  if (!requestId || !action || !["approve", "reject"].includes(action)) {
    return apiError("INVALID_PARAMS", 400, "requestId+action 또는 memberId+role이 필요합니다.");
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
    // 사전 등록 계정 병합: 같은 닉네임 + 미로그인 멤버가 있으면 등번호/포지션/역할 이관
    const merged = await mergeTempMember(teamId, applicantId);

    await prisma.$transaction([
      prisma.team_join_requests.update({
        where: { id: BigInt(requestId) },
        data: { status: "approved", processed_by_id: ctx.userId, processed_at: new Date() },
      }),
      prisma.teamMember.create({
        data: {
          teamId,
          userId: applicantId,
          role: merged?.role ?? "member",
          status: "active",
          joined_at: new Date(),
          ...(merged && { jerseyNumber: merged.jerseyNumber, position: merged.position }),
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
    // 거부 사유 trim + 500자 상한 (DB는 text지만 알림/UI 가독성 위해 제한)
    const rejectionReason =
      typeof body.rejection_reason === "string" && body.rejection_reason.trim()
        ? body.rejection_reason.trim().slice(0, 500)
        : null;

    await prisma.team_join_requests.update({
      where: { id: BigInt(requestId) },
      data: {
        status: "rejected",
        processed_by_id: ctx.userId,
        processed_at: new Date(),
        // null이면 DB에 기존 값 유지되지 않고 null로 세팅 (재거부 시 덮어쓰기)
        rejection_reason: rejectionReason,
      },
    });

    // 알림 content: 사유가 있으면 함께 전달 — 신청자가 앱 알림만 봐도 맥락 이해 가능
    const content = rejectionReason
      ? `"${team?.name}" 팀 가입 신청이 거부되었습니다. 사유: ${rejectionReason}`
      : `"${team?.name}" 팀 가입 신청이 거부되었습니다.`;

    createNotification({
      userId: applicantId,
      notificationType: NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_REJECTED,
      title: "팀 가입 거부",
      content,
      actionUrl: `/teams/${teamId}`,
    }).catch(() => {});
  }

  return apiSuccess({ action, request_id: requestId });
});
