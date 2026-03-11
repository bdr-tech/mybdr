import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { apiSuccess, apiError } from "@/lib/api/response";
import { updateScoreForEvent } from "@/lib/tournaments/score-updater";
import { listMatchEvents, createMatchEvent, getMatchScore } from "@/lib/services/match";

// Flutter 클라이언트는 snake_case로 전송
const eventSchema = z.object({
  event_type:      z.string().min(1).max(50),
  team_id:         z.coerce.bigint().optional(),
  player_id:       z.coerce.bigint().optional(),
  value:           z.number().int().optional(),
  quarter:         z.number().int().min(1).max(6).optional(),
  game_time:       z.string().max(10).optional(),
  client_event_id: z.string().uuid().optional(),
});

// GET /api/v1/matches/:id/events
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireRecorder(req, id);
    if (auth instanceof NextResponse) return auth;
    const { matchId } = auth as { matchId: bigint; userId: bigint; tournamentId: string };

    const events = await listMatchEvents(matchId);

    return apiSuccess({ events });
  } catch (err) {
    console.error("[GET /api/v1/matches/[id]/events]", err);
    return apiError("Internal server error", 500);
  }
}

// POST /api/v1/matches/:id/events
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

    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) return apiError("유효하지 않은 이벤트 데이터입니다.", 400);

    const data = parsed.data;

    const match = await getMatchScore(matchId);
    if (!match) return apiError("경기를 찾을 수 없습니다.", 404);
    if (match.status !== "in_progress") {
      return apiError("진행 중인 경기에만 이벤트를 기록할 수 있습니다.", 400);
    }

    // Service: idempotency check + 이벤트 생성
    const { event, isDuplicate } = await createMatchEvent(
      matchId,
      match.tournamentId,
      userId,
      {
        eventType: data.event_type,
        teamId: data.team_id ?? null,
        playerId: data.player_id ?? null,
        value: data.value ?? null,
        quarter: data.quarter ?? null,
        gameTime: data.game_time ?? null,
        clientEventId: data.client_event_id ?? null,
      }
    );

    if (isDuplicate) {
      return apiSuccess({
        ...event,
        home_score: match.homeScore ?? 0,
        away_score: match.awayScore ?? 0,
      }, 200);
    }

    // 득점 이벤트면 homeScore / awayScore atomic increment (C-04: race condition 방지)
    await updateScoreForEvent(
      matchId, data.event_type, data.team_id ?? null, data.value ?? null,
      match.homeTeamId, match.awayTeamId, "increment",
    );

    // 갱신된 점수 조회
    const updatedMatch = await getMatchScore(matchId);

    return apiSuccess({
      ...event,
      home_score: updatedMatch?.homeScore ?? 0,
      away_score: updatedMatch?.awayScore ?? 0,
    }, 201);
  } catch (err) {
    console.error("[POST /api/v1/matches/[id]/events]", err);
    return apiError("Internal server error", 500);
  }
}
