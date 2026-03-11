import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

// DELETE /api/web/games/[id]/apply/cancel
// 신청자: 본인 신청 취소
export const DELETE = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    // TC-NEW-001: short UUID hex 검증 (LIKE 와일드카드 인젝션 방지)
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

    // 경기 시작 전에만 취소 가능
    if (game.scheduled_at < new Date()) {
      return apiError("이미 시작된 경기는 취소할 수 없습니다.", 400);
    }

    const application = await prisma.game_applications.findUnique({
      where: { game_id_user_id: { game_id: game.id, user_id: ctx.userId } },
    });
    if (!application) {
      return apiError("신청 내역이 없습니다.", 404);
    }

    // TC-NEW-023: 삭제 + current_participants 감소를 원자적 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      await tx.game_applications.delete({ where: { id: application.id } });
      await tx.games.update({
        where: { id: game!.id },
        data: { current_participants: { decrement: 1 } },
      });
    });

    return apiSuccess({ success: true, message: "신청이 취소되었습니다." });
  } catch {
    return apiError("취소 중 오류가 발생했습니다.", 500);
  }
});
