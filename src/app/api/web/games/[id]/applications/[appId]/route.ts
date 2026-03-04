import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

// PATCH /api/web/games/[id]/applications/[appId]
// 호스트: 신청 승인(approve) 또는 거절(reject)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id, appId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "세션이 만료되었습니다." }, { status: 401 });

  const body = await req.json() as { action: "approve" | "reject" };
  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "action은 approve 또는 reject여야 합니다." }, { status: 400 });
  }

  try {
    const hostId = BigInt(session.sub);

    // TC-NEW-002: short UUID hex 검증 (LIKE 와일드카드 인젝션 방지)
    let game = null;
    if (id.length === 8) {
      if (!/^[a-f0-9]{8}$/.test(id)) {
        return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });
      }
      const rows = await prisma.$queryRaw<{ uuid: string }[]>`
        SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${id + "%"} LIMIT 1
      `;
      const fullUuid = rows[0]?.uuid;
      if (fullUuid) game = await prisma.games.findUnique({ where: { uuid: fullUuid } });
    } else {
      game = await prisma.games.findUnique({ where: { uuid: id } });
    }
    if (!game) return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });

    // 호스트 권한 확인
    if (game.organizer_id !== hostId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // TC-NEW-003: BigInt 변환 실패 방지
    let appBigInt: bigint;
    try {
      appBigInt = BigInt(appId);
    } catch {
      return NextResponse.json({ error: "신청 내역을 찾을 수 없습니다." }, { status: 404 });
    }

    // 신청 조회
    const application = await prisma.game_applications.findUnique({
      where: { id: appBigInt },
    });
    if (!application || application.game_id !== game.id) {
      return NextResponse.json({ error: "신청 내역을 찾을 수 없습니다." }, { status: 404 });
    }
    if (application.status !== 0) {
      return NextResponse.json({ error: "이미 처리된 신청입니다." }, { status: 409 });
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

    return NextResponse.json({
      success: true,
      message: body.action === "approve" ? "승인되었습니다." : "거절되었습니다.",
    });
  } catch {
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
