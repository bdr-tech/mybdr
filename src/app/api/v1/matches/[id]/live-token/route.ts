import { NextRequest, NextResponse } from "next/server";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/v1/matches/:id/live-token
 *
 * duo_sessions에서 match_id로 활성 세션을 조회하여
 * 실시간 스코어보드 접속에 필요한 channelName을 반환한다.
 *
 * 인증: 대회 관리자 또는 기록원만 접근 가능
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireRecorder(req, id);
    if (auth instanceof NextResponse) return auth;
    const { matchId } = auth as { matchId: bigint };

    // 활성(waiting 또는 active) 상태의 duo_session 조회
    const session = await prisma.duoSession.findFirst({
      where: {
        matchId,
        status: { in: ["waiting", "active"] },
      },
      select: {
        channelName: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      return apiError("활성 2인 모드 세션이 없습니다.", 404);
    }

    return apiSuccess({
      channelName: session.channelName,
      status: session.status,
      scoreboardUrl: `/scoreboard/${id}?channel=${session.channelName}`,
    });
  } catch (err) {
    console.error("[GET /api/v1/matches/[id]/live-token]", err);
    return apiError("Internal server error", 500);
  }
}
