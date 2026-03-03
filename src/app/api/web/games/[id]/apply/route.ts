import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. 로그인 확인
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "세션이 만료되었습니다." }, { status: 401 });

  try {
    const userId = BigInt(session.sub);

    // 8자리 short ID → full UUID 변환 (상세페이지와 동일한 처리)
    let game = null;
    if (id.length === 8) {
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
    if (!game) return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });

    // 2. 주최자 본인 신청 불가
    if (game.organizer_id === userId) {
      return NextResponse.json({ error: "내가 주최한 경기에는 신청할 수 없습니다." }, { status: 403 });
    }

    // 3. 모집중 상태(1)만 신청 가능
    if (game.status !== 1) {
      return NextResponse.json({ error: "현재 신청을 받지 않는 경기입니다." }, { status: 400 });
    }

    // 4. 이미 시작된 경기 신청 불가
    if (game.scheduled_at < new Date()) {
      return NextResponse.json({ error: "이미 시작된 경기에는 신청할 수 없습니다." }, { status: 400 });
    }

    // 5. 정원 초과 확인
    if (
      game.max_participants !== null &&
      (game.current_participants ?? 0) >= game.max_participants
    ) {
      return NextResponse.json({ error: "정원이 마감된 경기입니다." }, { status: 400 });
    }

    // 6. 중복 신청 확인
    const existing = await prisma.game_applications.findUnique({
      where: { game_id_user_id: { game_id: game.id, user_id: userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 참가 신청한 경기입니다." }, { status: 409 });
    }

    // 7. 신청자 프로필 조회 (호스트에게 전달할 정보)
    const applicant = await prisma.user.findUnique({
      where: { id: userId },
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

    await prisma.game_applications.create({
      data: {
        game_id: game.id,
        user_id: userId,
        status: 0, // pending
        payment_required: (game.fee_per_person ?? 0) > 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // current_participants 카운트 갱신 (pending 포함)
    const participantCount = await prisma.game_applications.count({
      where: { game_id: game.id },
    });
    await prisma.games.update({
      where: { id: game.id },
      data: { current_participants: participantCount },
    });

    // 8. 주최자에게 신청 알림 발송 (fire-and-forget)
    createNotification({
      userId: game.organizer_id,
      notificationType: NOTIFICATION_TYPES.GAME_APPLICATION_RECEIVED,
      title: "새 참가 신청",
      content: `${applicant?.nickname ?? "참가자"}님이 "${game.title}"에 참가 신청했습니다.`,
      actionUrl: `/games/${game.uuid}`,
      notifiableType: "game",
      notifiableId: game.id,
      metadata: {
        applicant: {
          id: userId.toString(),
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
      userId,
      notificationType: NOTIFICATION_TYPES.GAME_APPLICATION_SUBMITTED,
      title: "참가 신청 완료",
      content: `"${game.title}" 경기에 참가 신청이 완료되었습니다. 호스트 승인 후 확정됩니다.`,
      actionUrl: `/games/${game.uuid}`,
      notifiableType: "game",
      notifiableId: game.id,
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "참가 신청이 완료되었습니다." });
  } catch {
    return NextResponse.json({ error: "참가 신청 중 오류가 발생했습니다." }, { status: 500 });
  }
}
