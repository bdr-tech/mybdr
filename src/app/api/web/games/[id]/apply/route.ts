import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

export const POST = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    // 8자리 short ID → full UUID 변환 (상세페이지와 동일한 처리)
    // TC-042: short UUID는 hex 8자리만 허용 (% 와일드카드 인젝션 방지)
    let game = null;
    if (id.length === 8) {
      if (!/^[a-f0-9]{8}$/.test(id)) {
        return apiError("경기를 찾을 수 없습니다.", 404);
      }
      const rows = await prisma.$queryRaw<{ uuid: string }[]>`
        SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${id + "%"} LIMIT 1
      `;
      const fullUuid = rows[0]?.uuid;
      if (fullUuid) {
        game = await prisma.games.findUnique({ where: { uuid: fullUuid } });
      }
    } else {
      game = await prisma.games.findUnique({ where: { uuid: id } });
    }
    if (!game) return apiError("경기를 찾을 수 없습니다.", 404);

    // 2. 주최자 본인 신청 불가
    if (game.organizer_id === ctx.userId) {
      return apiError("내가 주최한 경기에는 신청할 수 없습니다.", 403);
    }

    // 3. 모집중 상태(1)만 신청 가능
    if (game.status !== 1) {
      return apiError("현재 신청을 받지 않는 경기입니다.", 400);
    }

    // 4. 이미 시작된 경기 신청 불가
    if (game.scheduled_at < new Date()) {
      return apiError("이미 시작된 경기에는 신청할 수 없습니다.", 400);
    }

    // 5. 중복 신청 사전 확인 (트랜잭션 진입 전 빠른 검사)
    const existing = await prisma.game_applications.findUnique({
      where: { game_id_user_id: { game_id: game.id, user_id: ctx.userId } },
    });
    if (existing) {
      return apiError("이미 참가 신청한 경기입니다.", 409);
    }

    // 6. 신청자 프로필 조회 (호스트에게 전달할 정보)
    const applicant = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        name: true,
        nickname: true,
        phone: true,
        position: true,
        city: true,
        district: true,
        profile_image: true,
      },
    });

    // TC-001: 정원 확인 + 신청 생성 + 카운트 갱신을 원자적 트랜잭션으로 처리
    // current_participants를 조건부 UPDATE로 race condition 방지
    try {
      await prisma.$transaction(async (tx) => {
        // 정원이 있을 때만 원자적 증가 (max_participants 초과 시 0 rows 반환)
        if (game!.max_participants !== null) {
          const reserved = await tx.$executeRaw`
            UPDATE games
            SET current_participants = current_participants + 1, updated_at = NOW()
            WHERE id = ${game!.id}
              AND current_participants < max_participants
          `;
          if (reserved === 0) throw Object.assign(new Error("FULL"), { code: "FULL" });
        } else {
          // 정원 제한 없는 경우 단순 증가
          await tx.games.update({
            where: { id: game!.id },
            data: { current_participants: { increment: 1 } },
          });
        }

        await tx.game_applications.create({
          data: {
            game_id: game!.id,
            user_id: ctx.userId,
            status: 0, // pending
            payment_required: (game!.fee_per_person ?? 0) > 0,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err.code === "FULL" || err.message === "FULL") {
        return apiError("정원이 마감된 경기입니다.", 400);
      }
      // P2002: unique constraint violation (동시 중복 신청)
      if ((err as { code?: string }).code === "P2002") {
        return apiError("이미 참가 신청한 경기입니다.", 409);
      }
      throw e;
    }

    // 8. 주최자에게 신청 알림 발송 (fire-and-forget)
    createNotification({
      userId: game.organizer_id,
      notificationType: NOTIFICATION_TYPES.GAME_APPLICATION_RECEIVED,
      title: "새 참가 신청",
      content: `${applicant?.nickname ?? "참가자"}님이 "${game.title}"에 참가 신청했습니다.`,
      actionUrl: `/games/${game.uuid?.slice(0, 8) ?? game.id}`,
      notifiableType: "game",
      notifiableId: game.id,
      metadata: {
        applicant: {
          id: ctx.userId.toString(),
          name: applicant?.name ?? null,
          nickname: applicant?.nickname ?? null,
          phone: applicant?.phone ?? null,
          position: applicant?.position ?? null,
          city: applicant?.city ?? null,
          district: applicant?.district ?? null,
          profile_image: applicant?.profile_image ?? null,
        },
      },
    }).catch(() => {});

    // 9. 신청자에게 신청 완료 알림 발송 (fire-and-forget)
    createNotification({
      userId: ctx.userId,
      notificationType: NOTIFICATION_TYPES.GAME_APPLICATION_SUBMITTED,
      title: "참가 신청 완료",
      content: `"${game.title}" 경기에 참가 신청이 완료되었습니다. 호스트 승인 후 확정됩니다.`,
      actionUrl: `/games/${game.uuid?.slice(0, 8) ?? game.id}`,
      notifiableType: "game",
      notifiableId: game.id,
    }).catch(() => {});

    return apiSuccess({ success: true, message: "참가 신청이 완료되었습니다." });
  } catch {
    return apiError("참가 신청 중 오류가 발생했습니다.", 500);
  }
});
