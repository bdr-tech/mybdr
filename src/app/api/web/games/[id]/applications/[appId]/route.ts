import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string; appId: string }> };

// PATCH /api/web/games/[id]/applications/[appId]
// 호스트: 신청 승인(approve) 또는 거절(reject)
export const PATCH = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id, appId } = await routeCtx.params;

  const body = await req.json() as { action: "approve" | "reject" };
  if (body.action !== "approve" && body.action !== "reject") {
    return apiError("action은 approve 또는 reject여야 합니다.", 400);
  }

  try {
    // TC-NEW-002: short UUID hex 검증 (LIKE 와일드카드 인젝션 방지)
    let game = null;
    if (id.length === 8) {
      if (!/^[a-f0-9]{8}$/.test(id)) {
        return apiError("경기를 찾을 수 없습니다.", 404);
      }
      const rows = await prisma.$queryRaw<{ uuid: string }[]>`
        SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${id + "%"} LIMIT 1
      `;
      const fullUuid = rows[0]?.uuid;
      if (fullUuid) game = await prisma.games.findUnique({ where: { uuid: fullUuid } });
    } else {
      game = await prisma.games.findUnique({ where: { uuid: id } });
    }
    if (!game) return apiError("경기를 찾을 수 없습니다.", 404);

    // 호스트 권한 확인
    if (game.organizer_id !== ctx.userId) {
      return apiError("권한이 없습니다.", 403);
    }

    // TC-NEW-003: BigInt 변환 실패 방지
    const appBigInt = parseBigIntParam(appId);
    if (appBigInt === null) {
      return apiError("신청 내역을 찾을 수 없습니다.", 404);
    }

    // 신청 조회
    const application = await prisma.game_applications.findUnique({
      where: { id: appBigInt },
    });
    if (!application || application.game_id !== game.id) {
      return apiError("신청 내역을 찾을 수 없습니다.", 404);
    }
    if (application.status !== 0) {
      return apiError("이미 처리된 신청입니다.", 409);
    }

    const now = new Date();
    const newStatus = body.action === "approve" ? 1 : 2;

    // TC-NEW-024: 거절 시 current_participants 감소 (트랜잭션)
    await prisma.$transaction(async (tx) => {
      await tx.game_applications.update({
        where: { id: application.id },
        data: {
          status: newStatus,
          approved_at: body.action === "approve" ? now : null,
          rejected_at: body.action === "reject" ? now : null,
          updated_at: now,
        },
      });

      if (body.action === "reject") {
        await tx.games.update({
          where: { id: game!.id },
          data: { current_participants: { decrement: 1 } },
        });
      }
    });

    // 신청자에게 결과 알림
    createNotification({
      userId: application.user_id,
      notificationType:
        body.action === "approve"
          ? NOTIFICATION_TYPES.GAME_APPLICATION_APPROVED
          : NOTIFICATION_TYPES.GAME_APPLICATION_REJECTED,
      title: body.action === "approve" ? "참가 신청 승인" : "참가 신청 거절",
      content:
        body.action === "approve"
          ? `"${game.title}" 경기 참가 신청이 승인되었습니다.`
          : `"${game.title}" 경기 참가 신청이 거절되었습니다.`,
      actionUrl: `/games/${game.uuid?.slice(0, 8) ?? game.id}`,
      notifiableType: "game",
      notifiableId: game.id,
    }).catch(() => {});

    return apiSuccess({
      success: true,
      message: body.action === "approve" ? "승인되었습니다." : "거절되었습니다.",
    });
  } catch {
    return apiError("처리 중 오류가 발생했습니다.", 500);
  }
});
