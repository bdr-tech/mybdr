/**
 * Match Service — 경기(TournamentMatch) 관련 비즈니스 로직 중앙화
 *
 * Service 함수는 순수 데이터만 반환한다 (NextResponse 사용 금지).
 */
import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Select / Include 상수
// ---------------------------------------------------------------------------

export const MATCH_LIST_INCLUDE = {
  homeTeam: {
    include: {
      team: {
        select: { name: true, primaryColor: true, logoUrl: true },
      },
    },
  },
  awayTeam: {
    include: {
      team: {
        select: { name: true, primaryColor: true, logoUrl: true },
      },
    },
  },
  tournament_teams_tournament_matches_winner_team_idTotournament_teams: {
    select: { id: true },
  },
} as const;

// ---------------------------------------------------------------------------
// 타입
// ---------------------------------------------------------------------------

export interface CreateMatchInput {
  tournamentId: string;
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
  roundName?: string | null;
  roundNumber?: number | null;
  scheduledAt?: Date | null;
  venueName?: string | null;
}

export interface UpdateMatchInput {
  homeScore?: number;
  awayScore?: number;
  status?: string;
  winnerTeamId?: bigint | null;
  scheduledAt?: Date | null;
  venueName?: string | null;
  roundName?: string | null;
  notes?: string | null;
  homeTeamId?: bigint | null;
  awayTeamId?: bigint | null;
}

// ---------------------------------------------------------------------------
// Service 함수
// ---------------------------------------------------------------------------

/**
 * 대회 경기 목록 조회
 */
export async function listMatches(tournamentId: string) {
  return prisma.tournamentMatch.findMany({
    where: { tournamentId },
    include: MATCH_LIST_INCLUDE,
    orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }],
  });
}

/**
 * 경기 단건 조회 (tournamentId 범위 검증 포함)
 */
export async function getMatch(matchId: bigint, tournamentId: string) {
  return prisma.tournamentMatch.findFirst({
    where: { id: matchId, tournamentId },
  });
}

/**
 * 경기 생성 + matches_count 원자적 증가
 */
export async function createMatch(input: CreateMatchInput) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.tournamentMatch.create({
      data: {
        tournamentId: input.tournamentId,
        homeTeamId: input.homeTeamId,
        awayTeamId: input.awayTeamId,
        roundName: input.roundName ?? null,
        round_number: input.roundNumber ?? null,
        scheduledAt: input.scheduledAt ?? null,
        venue_name: input.venueName ?? null,
        status: "scheduled",
      },
    });
    await tx.tournament.update({
      where: { id: input.tournamentId },
      data: { matches_count: { increment: 1 } },
    });
    return match;
  });
}

/**
 * 경기 수정 (점수, 상태, 승자 등) + 승자 확정 시 다음 경기 팀 배치
 *
 * 반환값에 alreadyCompleted 플래그를 포함하여
 * 라우트에서 전적 갱신 여부를 결정할 수 있게 한다.
 */
export async function updateMatch(
  matchId: bigint,
  current: { status: string | null },
  input: UpdateMatchInput
) {
  const alreadyCompleted = current.status === "completed";

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.tournamentMatch.update({
      where: { id: matchId },
      data: {
        ...(input.homeScore !== undefined && { homeScore: input.homeScore }),
        ...(input.awayScore !== undefined && { awayScore: input.awayScore }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.winnerTeamId !== undefined && {
          winner_team_id: input.winnerTeamId,
        }),
        ...(input.scheduledAt !== undefined && {
          scheduledAt: input.scheduledAt,
        }),
        ...(input.venueName !== undefined && { venue_name: input.venueName }),
        ...(input.roundName !== undefined && { roundName: input.roundName }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.homeTeamId !== undefined && { homeTeamId: input.homeTeamId }),
        ...(input.awayTeamId !== undefined && { awayTeamId: input.awayTeamId }),
        ...(input.status === "completed" && { ended_at: new Date() }),
        ...(input.status === "in_progress" && { started_at: new Date() }),
      },
    });

    // 승자가 확정되고 next_match_id가 있으면 다음 경기에 팀 배치
    if (input.winnerTeamId && u.next_match_id) {
      const slot = u.next_match_slot; // "home" | "away"
      await tx.tournamentMatch.update({
        where: { id: u.next_match_id },
        data: {
          ...(slot === "home" && { homeTeamId: input.winnerTeamId }),
          ...(slot === "away" && { awayTeamId: input.winnerTeamId }),
          status: "scheduled",
        },
      });
    }

    return u;
  });

  return { updated, alreadyCompleted };
}

/**
 * 경기 삭제 + matches_count 원자적 감소
 * 완료된 경기는 삭제할 수 없다 (전적 롤백 불가).
 * @throws Error 완료된 경기 삭제 시도 시
 */
export async function deleteMatch(matchId: bigint, tournamentId: string) {
  const match = await prisma.tournamentMatch.findFirst({
    where: { id: matchId, tournamentId },
  });

  if (!match) return null;

  if (match.status === "completed") {
    throw new Error("COMPLETED_MATCH_DELETE");
  }

  await prisma.$transaction(async (tx) => {
    await tx.tournamentMatch.delete({ where: { id: matchId } });
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { matches_count: { decrement: 1 } },
    });
  });

  return { deleted: true };
}

/**
 * 기록원 경기 상태 변경 (v1 API)
 */
export async function updateMatchStatus(
  matchId: bigint,
  status: string
) {
  return prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      status,
      ...(status === "in_progress" && { started_at: new Date() }),
      ...(status === "completed" && { ended_at: new Date() }),
    },
    select: { id: true, status: true, started_at: true, ended_at: true },
  });
}

/**
 * 경기 이벤트 목록 조회 (undone 제외)
 */
export async function listMatchEvents(matchId: bigint) {
  return prisma.match_events.findMany({
    where: { matchId, undone: false },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * 경기 이벤트 생성 (idempotency 검사 포함)
 * @returns { event, isDuplicate } — 중복이면 isDuplicate=true
 */
export async function createMatchEvent(
  matchId: bigint,
  tournamentId: string,
  recordedBy: bigint,
  data: {
    eventType: string;
    teamId?: bigint | null;
    playerId?: bigint | null;
    value?: number | null;
    quarter?: number | null;
    gameTime?: string | null;
    clientEventId?: string | null;
  }
) {
  // idempotency check
  if (data.clientEventId) {
    const existing = await prisma.match_events.findFirst({
      where: { matchId, clientEventId: data.clientEventId },
    });
    if (existing) {
      return { event: existing, isDuplicate: true };
    }
  }

  const event = await prisma.match_events.create({
    data: {
      matchId,
      tournamentId,
      eventType: data.eventType,
      teamId: data.teamId ?? null,
      playerId: data.playerId ?? null,
      value: data.value ?? null,
      quarter: data.quarter ?? null,
      gameTime: data.gameTime ?? null,
      clientEventId: data.clientEventId ?? null,
      recordedBy,
    },
  });

  return { event, isDuplicate: false };
}

/**
 * 경기 현재 점수 조회
 */
export async function getMatchScore(matchId: bigint) {
  return prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      homeScore: true,
      awayScore: true,
      status: true,
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });
}
