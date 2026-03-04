import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

// DELETE /api/web/games/[id]/apply/cancel
// 신청자: 본인 신청 취소
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: "세션이 만료되었습니다." }, { status: 401 });

  try {
    const userId = BigInt(session.sub);

    // TC-NEW-001: short UUID hex 검증 (LIKE 와일드카드 인젝션 방지)
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

    // 경기 시작 전에만 취소 가능
    if (game.scheduled_at < new Date()) {
      return NextResponse.json({ error: "이미 시작된 경기는 취소할 수 없습니다." }, { status: 400 });
    }

    const application = await prisma.game_applications.findUnique({
      where: { game_id_user_id: { game_id: game.id, user_id: userId } },
    });
    if (!application) {
      return NextResponse.json({ error: "신청 내역이 없습니다." }, { status: 404 });
    }

    // TC-NEW-023: 삭제 + current_participants 감소를 원자적 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      await tx.game_applications.delete({ where: { id: application.id } });
      await tx.games.update({
        where: { id: game!.id },
        data: { current_participants: { decrement: 1 } },
      });
    });

    return NextResponse.json({ success: true, message: "신청이 취소되었습니다." });
  } catch {
    return NextResponse.json({ error: "취소 중 오류가 발생했습니다." }, { status: 500 });
  }
}
