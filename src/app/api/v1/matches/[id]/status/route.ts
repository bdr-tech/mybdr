import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { apiSuccess, apiError } from "@/lib/api/response";
import { RECORDER_TRANSITIONS } from "@/lib/tournaments/match-transitions";
import { getMatchScore, updateMatchStatus } from "@/lib/services/match";
import { prisma } from "@/lib/db/prisma";
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

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

    // 경기 취소 시 참가자(양 팀 선수)에게 알림 발송 (fire-and-forget)
    if (status === "cancelled") {
      const teamIds = [match.homeTeamId, match.awayTeamId].filter(
        (tid): tid is bigint => tid !== null && tid !== undefined
      );

      if (teamIds.length > 0) {
        // 양 팀의 모든 선수(userId) 조회
        prisma.tournamentTeamPlayer
          .findMany({
            where: { tournamentTeamId: { in: teamIds }, is_active: true },
            select: { userId: true },
          })
          .then((players) => {
            // 중복 제거 (한 명이 양쪽 팀에 속할 수 없지만 안전하게)
            const uniqueUserIds = [...new Set(players.map((p) => p.userId))];
            if (uniqueUserIds.length === 0) return;

            return createNotificationBulk(
              uniqueUserIds.map((uid) => ({
                userId: uid,
                notificationType: NOTIFICATION_TYPES.GAME_CANCELLED,
                title: "경기가 취소되었습니다",
                content: `배정된 경기가 취소되었습니다. 자세한 내용은 대회 페이지를 확인해주세요.`,
                notifiableType: "TournamentMatch",
                notifiableId: matchId,
              }))
            );
          })
          .catch(() => {}); // 알림 실패가 취소 처리를 실패시키면 안 됨
      }
    }

    return apiSuccess(updated);
  } catch (err) {
    console.error("[PATCH /api/v1/matches/[id]/status]", err);
    return apiError("Internal server error", 500);
  }
}
