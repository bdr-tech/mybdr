import { type NextRequest } from "next/server";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { updateTeamStandings } from "@/lib/tournaments/update-standings";
import { VALID_TRANSITIONS } from "@/lib/tournaments/match-transitions";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getMatch, updateMatch, deleteMatch } from "@/lib/services/match";
import { prisma } from "@/lib/db/prisma";
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

type Ctx = { params: Promise<{ id: string; matchId: string }> };

// PATCH /api/web/tournaments/[id]/matches/[matchId]
// 점수 입력, 상태 변경, 승자 설정
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, matchId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  // TC-026: BigInt 변환 실패 방지
  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  const match = await getMatch(matchBigInt, id);
  if (!match) return apiError("경기를 찾을 수 없습니다.", 404);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const {
    homeScore, awayScore, status, winner_team_id,
    scheduledAt, venue_name, roundName, notes,
    homeTeamId, awayTeamId,
  } = body as Record<string, string | number | null | undefined>;

  // TC-NEW-012: 상태 전환 유효성 검증
  if (status !== undefined && status !== match.status) {
    const currentStatus = match.status ?? "pending";
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(String(status))) {
      return apiError(`'${currentStatus}' 상태에서 '${status}'로 변경할 수 없습니다.`, 400);
    }
  }

  // TC-031: 완료 처리 시 승자 팀 필수
  if (status === "completed" && !winner_team_id) {
    return apiError("완료 처리 시 승자 팀을 지정해야 합니다.", 400);
  }

  // TC-NEW-011: 점수 음수 방지
  if (homeScore !== undefined && homeScore !== null) {
    const n = Number(homeScore);
    if (n < 0 || !Number.isFinite(n)) {
      return apiError("점수는 0 이상이어야 합니다.", 400);
    }
  }
  if (awayScore !== undefined && awayScore !== null) {
    const n = Number(awayScore);
    if (n < 0 || !Number.isFinite(n)) {
      return apiError("점수는 0 이상이어야 합니다.", 400);
    }
  }

  // TC-NEW-013: winner_team_id는 해당 매치에 속한 팀이어야 함 (IDOR 방지)
  if (winner_team_id) {
    const wid = parseBigIntParam(String(winner_team_id));
    if (wid === null) {
      return apiError("유효하지 않은 승자 팀 ID입니다.", 400);
    }
    if (wid !== match.homeTeamId && wid !== match.awayTeamId) {
      return apiError("승자는 경기에 참여한 팀이어야 합니다.", 400);
    }
  }

  // Service 호출: 매치 업데이트 + 다음 경기 팀 배치 (트랜잭션)
  const { updated, alreadyCompleted } = await updateMatch(
    matchBigInt,
    { status: match.status },
    {
      ...(homeScore !== undefined && { homeScore: Number(homeScore) }),
      ...(awayScore !== undefined && { awayScore: Number(awayScore) }),
      ...(status !== undefined && { status: String(status) }),
      ...(winner_team_id !== undefined && {
        winnerTeamId: winner_team_id ? BigInt(String(winner_team_id)) : null,
      }),
      ...(scheduledAt !== undefined && {
        scheduledAt: scheduledAt ? new Date(String(scheduledAt)) : null,
      }),
      ...(venue_name !== undefined && { venueName: venue_name ? String(venue_name) : null }),
      ...(roundName !== undefined && { roundName: roundName ? String(roundName) : null }),
      ...(notes !== undefined && { notes: notes ? String(notes) : null }),
      ...(homeTeamId !== undefined && {
        homeTeamId: homeTeamId ? BigInt(String(homeTeamId)) : null,
      }),
      ...(awayTeamId !== undefined && {
        awayTeamId: awayTeamId ? BigInt(String(awayTeamId)) : null,
      }),
    }
  );

  // 경기 취소 시 참가자(양 팀 선수)에게 알림 발송 (fire-and-forget)
  if (status === "cancelled") {
    const teamIds = [match.homeTeamId, match.awayTeamId].filter(
      (tid): tid is bigint => tid !== null && tid !== undefined
    );

    if (teamIds.length > 0) {
      // 양 팀의 모든 활성 선수(userId) 조회 후 알림 일괄 발송
      prisma.tournamentTeamPlayer
        .findMany({
          where: { tournamentTeamId: { in: teamIds }, is_active: true },
          select: { userId: true },
        })
        .then((players) => {
          // null userId 필터링 (BigInt?로 변경되어 null 가능)
          const uniqueUserIds = [...new Set(players.map((p) => p.userId).filter((id): id is bigint => id !== null))];
          if (uniqueUserIds.length === 0) return;

          return createNotificationBulk(
            uniqueUserIds.map((uid) => ({
              userId: uid,
              notificationType: NOTIFICATION_TYPES.GAME_CANCELLED,
              title: "경기가 취소되었습니다",
              content: `배정된 경기가 취소되었습니다. 자세한 내용은 대회 페이지를 확인해주세요.`,
              actionUrl: `/tournaments/${id}`,
              notifiableType: "TournamentMatch",
              notifiableId: matchBigInt,
            }))
          );
        })
        .catch(() => {}); // 알림 실패가 취소 처리를 실패시키면 안 됨
    }
  }

  // TC-006: 이미 completed였던 매치는 전적 재갱신 금지 (중복 increment 방지)
  // M-04: fire-and-forget 제거 -> await + 실패 시 warning 응답
  let standingsWarning: string | undefined;
  if (status === "completed" && !alreadyCompleted) {
    try {
      await updateTeamStandings(matchBigInt);
    } catch (err) {
      console.error(`[updateTeamStandings] matchId=${matchBigInt} 전적 갱신 실패:`, err);
      standingsWarning = "경기 상태는 변경되었으나 팀 전적 갱신에 실패했습니다. 관리자에게 문의하세요.";
    }
  }

  if (standingsWarning) {
    return apiSuccess({ ...JSON.parse(JSON.stringify(updated, (_k, v) => typeof v === "bigint" ? v.toString() : v)), warning: standingsWarning });
  }
  return apiSuccess(updated);
}

// DELETE /api/web/tournaments/[id]/matches/[matchId]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, matchId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const deleteBigInt = parseBigIntParam(matchId);
  if (deleteBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  try {
    const result = await deleteMatch(deleteBigInt, id);
    if (!result) return apiError("경기를 찾을 수 없습니다.", 404);
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof Error && err.message === "COMPLETED_MATCH_DELETE") {
      return apiError("완료된 경기는 삭제할 수 없습니다.", 400);
    }
    throw err;
  }
}
