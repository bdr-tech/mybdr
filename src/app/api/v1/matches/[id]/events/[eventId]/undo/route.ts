import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { apiSuccess, apiError } from "@/lib/api/response";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { updateScoreForEvent } from "@/lib/tournaments/score-updater";

// PATCH /api/v1/matches/:id/events/:eventId/undo
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { id, eventId } = await params;

    const auth = await requireRecorder(req, id);
    if (auth instanceof NextResponse) return auth;
    const { matchId, userId } = auth as { matchId: bigint; userId: bigint; tournamentId: string };

    const eventBigInt = parseBigIntParam(eventId);
    if (eventBigInt === null) return apiError("이벤트를 찾을 수 없습니다.", 404);

    const event = await prisma.match_events.findFirst({
      where: { id: eventBigInt, matchId, undone: false },
    });
    if (!event) return apiError("이벤트를 찾을 수 없거나 이미 취소되었습니다.", 404);

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.match_events.update({
        where: { id: eventBigInt },
        data: {
          undone:   true,
          undoneAt: new Date(),
          undoneBy: userId,
        },
      });

      // 득점 이벤트 Undo: homeScore / awayScore 차감 (공유 함수 + 트랜잭션)
      const m = await tx.tournamentMatch.findUnique({
        where: { id: matchId },
        select: { homeTeamId: true, awayTeamId: true },
      });
      if (m) {
        await updateScoreForEvent(
          matchId, event.eventType, event.teamId, event.value,
          m.homeTeamId, m.awayTeamId, "decrement", tx,
        );
      }

      return u;
    });

    return apiSuccess(updated);
  } catch (err) {
    console.error("[PATCH /api/v1/matches/[id]/events/[eventId]/undo]", err);
    return apiError("Internal server error", 500);
  }
}
