import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { apiSuccess, apiError } from "@/lib/api/response";
import { updateScoreForBatchEvents } from "@/lib/tournaments/score-updater";

// Flutter 클라이언트는 snake_case로 전송
const singleEventSchema = z.object({
  event_type:      z.string().min(1).max(50),
  team_id:         z.coerce.bigint().optional(),
  player_id:       z.coerce.bigint().optional(),
  value:           z.number().int().optional(),
  quarter:         z.number().int().min(1).max(6).optional(),
  game_time:       z.string().max(10).optional(),
  client_event_id: z.string().uuid(), // batch requires clientEventId
});

const batchSchema = z.object({
  events: z.array(singleEventSchema).min(1).max(100),
});

// POST /api/v1/matches/:id/events/batch
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireRecorder(req, id);
    if (auth instanceof NextResponse) return auth;
    const { matchId, userId } = auth as { matchId: bigint; userId: bigint; tournamentId: string };

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("잘못된 요청입니다.", 400);
    }

    const parsed = batchSchema.safeParse(body);
    if (!parsed.success) return apiError("유효하지 않은 이벤트 데이터입니다.", 400);

    const { events } = parsed.data;

    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { tournamentId: true, homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
    });
    if (!match) return apiError("경기를 찾을 수 없습니다.", 404);

    // 중복 방지: 이미 존재하는 client_event_id 조회
    const existingClientIds = await prisma.match_events.findMany({
      where: {
        matchId,
        clientEventId: { in: events.map((e) => e.client_event_id) },
      },
      select: { clientEventId: true },
    });
    const existingSet = new Set(existingClientIds.map((e) => e.clientEventId));

    const toInsert = events.filter((e) => !existingSet.has(e.client_event_id));

    if (toInsert.length > 0) {
      await prisma.match_events.createMany({
        data: toInsert.map((e) => ({
          matchId,
          tournamentId:  match.tournamentId,
          eventType:     e.event_type,
          teamId:        e.team_id ?? null,
          playerId:      e.player_id ?? null,
          value:         e.value ?? null,
          quarter:       e.quarter ?? null,
          gameTime:      e.game_time ?? null,
          clientEventId: e.client_event_id,
          recordedBy:    userId,
        })),
      });

      // 득점 이벤트 일괄 점수 업데이트 (atomic increment로 race condition 방지)
      await updateScoreForBatchEvents(
        matchId, toInsert, match.homeTeamId, match.awayTeamId,
      );
    }

    return apiSuccess({
      inserted: toInsert.length,
      skipped:  events.length - toInsert.length,
    });
  } catch (err) {
    console.error("[POST /api/v1/matches/[id]/events/batch]", err);
    return apiError("Internal server error", 500);
  }
}
