import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

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
    const gameId = BigInt(id);
    const userId = BigInt(session.sub);

    const game = await prisma.games.findUnique({ where: { id: gameId } });
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
      where: { game_id_user_id: { game_id: gameId, user_id: userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 참가 신청한 경기입니다." }, { status: 409 });
    }

    await prisma.game_applications.create({
      data: {
        game_id: gameId,
        user_id: userId,
        status: 0, // pending
        payment_required: (game.fee_per_person ?? 0) > 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "참가 신청이 완료되었습니다." });
  } catch {
    return NextResponse.json({ error: "참가 신청 중 오류가 발생했습니다." }, { status: 500 });
  }
}
