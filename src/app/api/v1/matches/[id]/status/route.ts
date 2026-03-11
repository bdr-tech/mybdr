import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { apiSuccess, apiError } from "@/lib/api/response";
import { RECORDER_TRANSITIONS } from "@/lib/tournaments/match-transitions";
import { getMatchScore, updateMatchStatus } from "@/lib/services/match";

const statusSchema = z.object({
  status: z.enum(["in_progress", "completed", "cancelled"]),
});

// PATCH /api/v1/matches/:id/status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireRecorder(req, id);
    if (auth instanceof NextResponse) return auth;
    const { matchId } = auth as { matchId: bigint; userId: bigint; tournamentId: string };

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("잘못된 요청입니다.", 400);
    }

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) return apiError("유효하지 않은 상태값입니다.", 400);

    const { status } = parsed.data;

    const match = await getMatchScore(matchId);
    if (!match) return apiError("경기를 찾을 수 없습니다.", 404);

    const current = match.status ?? "scheduled";
    const allowed = RECORDER_TRANSITIONS[current] ?? [];
    if (!allowed.includes(status)) {
      return apiError(`'${current}' 상태에서 '${status}'로 변경할 수 없습니다.`, 400);
    }

    const updated = await updateMatchStatus(matchId, status);

    return apiSuccess(updated);
  } catch (err) {
    console.error("[PATCH /api/v1/matches/[id]/status]", err);
    return apiError("Internal server error", 500);
  }
}
