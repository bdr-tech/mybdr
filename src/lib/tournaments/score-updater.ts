import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * 득점 이벤트 타입 목록.
 * 이 배열에 포함된 event_type만 점수 갱신 대상.
 */
export const SCORING_EVENT_TYPES = ["2pt", "3pt", "1pt", "score"] as const;

/**
 * 해당 이벤트 타입이 득점 이벤트인지 판별
 */
export function isScoringEvent(eventType: string): boolean {
  return (SCORING_EVENT_TYPES as readonly string[]).includes(eventType);
}

type TeamSide = "home" | "away";

interface ScoreUpdateParams {
  matchId: bigint;
  teamSide: TeamSide;
  points: number;
  operation: "increment" | "decrement";
}

/**
 * 매치 점수를 atomic하게 업데이트한다.
 * Race condition 방지를 위해 Prisma increment/decrement 사용.
 *
 * @param params.matchId - 매치 ID
 * @param params.teamSide - "home" | "away"
 * @param params.points - 점수 (양수)
 * @param params.operation - "increment" (득점) | "decrement" (undo)
 * @param tx - Prisma 트랜잭션 클라이언트 (선택). 없으면 기본 prisma 사용.
 */
export async function updateMatchScore(
  params: ScoreUpdateParams,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  const { matchId, teamSide, points, operation } = params;

  const field = teamSide === "home" ? "homeScore" : "awayScore";

  if (operation === "increment") {
    await client.tournamentMatch.update({
      where: { id: matchId },
      data: { [field]: { increment: points } },
    });
  } else {
    // decrement: 음수 방지를 위해 현재 값 확인 후 max(0, current - points) 적용
    const current = await client.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { homeScore: true, awayScore: true },
    });
    const currentScore = (teamSide === "home" ? current?.homeScore : current?.awayScore) ?? 0;
    const newScore = Math.max(0, currentScore - points);

    await client.tournamentMatch.update({
      where: { id: matchId },
      data: { [field]: newScore },
    });
  }
}

/**
 * 득점 이벤트에 대해 매치 점수를 갱신한다.
 * eventType이 득점 이벤트가 아니거나, value/teamId가 없으면 무시.
 *
 * @param matchId - 매치 ID
 * @param eventType - 이벤트 타입 (예: "2pt", "3pt", "1pt", "score")
 * @param teamId - 득점한 팀 ID
 * @param value - 득점 값
 * @param homeTeamId - 홈팀 ID
 * @param awayTeamId - 어웨이팀 ID
 * @param operation - "increment" | "decrement"
 * @param tx - Prisma 트랜잭션 클라이언트 (선택)
 * @returns 업데이트 수행 여부
 */
export async function updateScoreForEvent(
  matchId: bigint,
  eventType: string,
  teamId: bigint | null | undefined,
  value: number | null | undefined,
  homeTeamId: bigint | null,
  awayTeamId: bigint | null,
  operation: "increment" | "decrement",
  tx?: Prisma.TransactionClient,
): Promise<boolean> {
  if (!isScoringEvent(eventType) || !value || !teamId) return false;

  const isHome = homeTeamId === teamId;
  const isAway = awayTeamId === teamId;
  if (!isHome && !isAway) return false;

  await updateMatchScore(
    {
      matchId,
      teamSide: isHome ? "home" : "away",
      points: value,
      operation,
    },
    tx,
  );

  return true;
}

/**
 * 배치 이벤트의 점수를 한번에 갱신한다.
 * 홈/어웨이 각각의 총 득점을 합산하여 한번의 increment로 처리.
 *
 * @param matchId - 매치 ID
 * @param events - 이벤트 배열 (event_type, team_id, value 필드 필요)
 * @param homeTeamId - 홈팀 ID
 * @param awayTeamId - 어웨이팀 ID
 * @param tx - Prisma 트랜잭션 클라이언트 (선택)
 */
export async function updateScoreForBatchEvents(
  matchId: bigint,
  events: Array<{ event_type: string; team_id?: bigint; value?: number }>,
  homeTeamId: bigint | null,
  awayTeamId: bigint | null,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;

  let homeIncrement = 0;
  let awayIncrement = 0;

  for (const e of events) {
    if (!isScoringEvent(e.event_type) || !e.value || !e.team_id) continue;
    if (homeTeamId === e.team_id) homeIncrement += e.value;
    else if (awayTeamId === e.team_id) awayIncrement += e.value;
  }

  if (homeIncrement === 0 && awayIncrement === 0) return;

  await client.tournamentMatch.update({
    where: { id: matchId },
    data: {
      ...(homeIncrement > 0 && { homeScore: { increment: homeIncrement } }),
      ...(awayIncrement > 0 && { awayScore: { increment: awayIncrement } }),
    },
  });
}
