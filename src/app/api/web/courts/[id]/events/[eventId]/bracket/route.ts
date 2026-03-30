/**
 * GET  /api/web/courts/[id]/events/[eventId]/bracket — 대진표 조회
 * POST /api/web/courts/[id]/events/[eventId]/bracket — 대진표 자동 생성 (주최자만)
 * PATCH /api/web/courts/[id]/events/[eventId]/bracket — 경기 결과 입력 (주최자만)
 *
 * 기획설계 요약:
 *   - 싱글 엘리미네이션: 팀 수에 맞춰 라운드별 매치 자동 생성
 *   - 시드 셔플: 등록 순서 기반 랜덤 시드 배정
 *   - 결과 입력 시 다음 라운드 자동 진출 처리
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string; eventId: string }> };

// ─────────────────────────────────────────────────
// GET: 대진표 조회 (공개)
// ─────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: RouteCtx
) {
  const { eventId } = await params;

  const matches = await prisma.court_event_matches.findMany({
    where: { event_id: BigInt(eventId) },
    orderBy: [{ round: "desc" }, { match_order: "asc" }],
    include: {
      home_team: { select: { id: true, team_name: true, seed: true } },
      away_team: { select: { id: true, team_name: true, seed: true } },
      winner: { select: { id: true, team_name: true } },
    },
  });

  // BigInt → string 직렬화
  const serialized = matches.map((m) => ({
    id: m.id.toString(),
    eventId: m.event_id.toString(),
    round: m.round,
    matchOrder: m.match_order,
    homeTeam: m.home_team
      ? { id: m.home_team.id.toString(), teamName: m.home_team.team_name, seed: m.home_team.seed }
      : null,
    awayTeam: m.away_team
      ? { id: m.away_team.id.toString(), teamName: m.away_team.team_name, seed: m.away_team.seed }
      : null,
    homeScore: m.home_score,
    awayScore: m.away_score,
    winner: m.winner
      ? { id: m.winner.id.toString(), teamName: m.winner.team_name }
      : null,
    status: m.status,
    scheduledTime: m.scheduled_time,
  }));

  return apiSuccess({ matches: serialized });
}

// ─────────────────────────────────────────────────
// POST: 대진표 자동 생성 (주최자만)
// - 싱글 엘리미네이션 기준: 팀을 셔플 → 시드 배정 → 1라운드부터 매치 생성
// ─────────────────────────────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: RouteCtx
) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { eventId } = await params;
  const eId = BigInt(eventId);
  const userId = BigInt(session.sub);

  // 이벤트 조회 + 권한 확인
  const event = await prisma.court_events.findUnique({
    where: { id: eId },
    include: { teams: { orderBy: { created_at: "asc" } } },
  });
  if (!event) {
    return apiError("존재하지 않는 이벤트입니다", 404, "NOT_FOUND");
  }
  if (event.organizer_id !== userId) {
    return apiError("주최자만 대진표를 생성할 수 있습니다", 403, "FORBIDDEN");
  }

  // 이미 대진표가 있는지 확인
  const existingMatches = await prisma.court_event_matches.count({
    where: { event_id: eId },
  });
  if (existingMatches > 0) {
    return apiError("이미 대진표가 생성되어 있습니다", 400, "BRACKET_EXISTS");
  }

  // 최소 2팀 필요
  const teams = event.teams;
  if (teams.length < 2) {
    return apiError("대진표를 만들려면 최소 2팀이 필요합니다", 400, "NOT_ENOUGH_TEAMS");
  }

  // 팀 셔플 (Fisher-Yates 알고리즘) → 시드 배정
  const shuffled = [...teams];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // 시드 번호 업데이트
  await prisma.$transaction(
    shuffled.map((team, idx) =>
      prisma.court_event_teams.update({
        where: { id: team.id },
        data: { seed: idx + 1 },
      })
    )
  );

  // 싱글 엘리미네이션 대진표 생성
  // 라운드 수 계산: 팀 수를 2의 거듭제곱으로 올림
  const teamCount = shuffled.length;
  const totalSlots = nextPowerOf2(teamCount); // 4, 8, 16 등
  const totalRounds = Math.log2(totalSlots);  // 2, 3, 4 등

  // 매치 데이터 생성
  const matchData: {
    event_id: bigint;
    round: number;
    match_order: number;
    home_team_id: bigint | null;
    away_team_id: bigint | null;
    status: string;
  }[] = [];

  // 1라운드(가장 큰 round 숫자) 매치부터 생성
  // round 번호: totalSlots/2 (1라운드), totalSlots/4 (2라운드=4강), ... 1(결승)
  const firstRoundMatchCount = totalSlots / 2;

  for (let i = 0; i < firstRoundMatchCount; i++) {
    // 시드 매칭: 1 vs 마지막, 2 vs 마지막-1, ...
    const homeIdx = i;
    const awayIdx = totalSlots - 1 - i;

    matchData.push({
      event_id: eId,
      round: firstRoundMatchCount,  // 1라운드 = 가장 큰 숫자
      match_order: i + 1,
      home_team_id: homeIdx < teamCount ? shuffled[homeIdx].id : null,
      away_team_id: awayIdx < teamCount ? shuffled[awayIdx].id : null,
      status: "scheduled",
    });
  }

  // 나머지 라운드 (4강, 준결승, 결승...) — 팀 미정(null)으로 생성
  let currentRound = firstRoundMatchCount / 2;
  while (currentRound >= 1) {
    for (let i = 0; i < currentRound; i++) {
      matchData.push({
        event_id: eId,
        round: currentRound,
        match_order: i + 1,
        home_team_id: null,
        away_team_id: null,
        status: "scheduled",
      });
    }
    currentRound = currentRound / 2;
  }

  // 매치 일괄 생성
  await prisma.court_event_matches.createMany({ data: matchData });

  // 부전승 처리: 1라운드에서 상대가 없는 팀은 자동 진출
  const firstRoundMatches = await prisma.court_event_matches.findMany({
    where: { event_id: eId, round: firstRoundMatchCount },
    orderBy: { match_order: "asc" },
  });

  for (const match of firstRoundMatches) {
    // 상대가 없는 경우 = 부전승
    if (match.home_team_id && !match.away_team_id) {
      await handleBye(eId, match, match.home_team_id);
    } else if (!match.home_team_id && match.away_team_id) {
      await handleBye(eId, match, match.away_team_id);
    }
  }

  // 이벤트 상태를 ready로 변경
  await prisma.court_events.update({
    where: { id: eId },
    data: { status: "ready" },
  });

  return apiSuccess({ message: "대진표가 생성되었습니다", matchesCount: matchData.length }, 201);
}

// ─────────────────────────────────────────────────
// PATCH: 경기 결과 입력 (주최자만)
// - 점수 입력 → 승리팀 결정 → 다음 라운드 자동 진출
// ─────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: RouteCtx
) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { eventId } = await params;
  const eId = BigInt(eventId);
  const userId = BigInt(session.sub);

  // 이벤트 조회 + 권한 확인
  const event = await prisma.court_events.findUnique({
    where: { id: eId },
    select: { organizer_id: true },
  });
  if (!event) {
    return apiError("존재하지 않는 이벤트입니다", 404, "NOT_FOUND");
  }
  if (event.organizer_id !== userId) {
    return apiError("주최자만 결과를 입력할 수 있습니다", 403, "FORBIDDEN");
  }

  let body: {
    match_id: string;
    home_score: number;
    away_score: number;
  };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  if (!body.match_id) {
    return apiError("match_id는 필수입니다", 400, "MISSING_MATCH_ID");
  }
  if (body.home_score == null || body.away_score == null) {
    return apiError("양 팀의 점수를 입력해주세요", 400, "MISSING_SCORES");
  }
  if (body.home_score === body.away_score) {
    return apiError("무승부는 불가합니다. 점수를 다르게 입력해주세요", 400, "NO_DRAW");
  }

  const matchId = BigInt(body.match_id);

  // 매치 조회
  const match = await prisma.court_event_matches.findUnique({
    where: { id: matchId },
  });
  if (!match || match.event_id !== eId) {
    return apiError("존재하지 않는 경기입니다", 404, "MATCH_NOT_FOUND");
  }
  if (match.status === "completed") {
    return apiError("이미 결과가 입력된 경기입니다", 400, "ALREADY_COMPLETED");
  }
  if (!match.home_team_id || !match.away_team_id) {
    return apiError("양 팀이 확정되지 않은 경기입니다", 400, "TEAMS_NOT_SET");
  }

  // 승리팀 결정
  const winnerId = body.home_score > body.away_score
    ? match.home_team_id
    : match.away_team_id;
  const loserId = body.home_score > body.away_score
    ? match.away_team_id
    : match.home_team_id;

  // 매치 결과 저장
  await prisma.court_event_matches.update({
    where: { id: matchId },
    data: {
      home_score: body.home_score,
      away_score: body.away_score,
      winner_id: winnerId,
      status: "completed",
    },
  });

  // 패배팀 탈락 처리
  await prisma.court_event_teams.update({
    where: { id: loserId },
    data: { status: "eliminated" },
  });

  // 다음 라운드 진출 처리
  // 현재 라운드가 1(결승)이면 → 우승자 처리
  if (match.round === 1) {
    await prisma.court_event_teams.update({
      where: { id: winnerId },
      data: { status: "winner" },
    });
    // 이벤트 완료 처리
    await prisma.court_events.update({
      where: { id: eId },
      data: { status: "completed" },
    });
  } else {
    // 다음 라운드 매치에 승리팀 배치
    const nextRound = match.round / 2;
    // 현재 match_order로 다음 라운드 위치 계산
    // match_order 1,2 → 다음 라운드 match_order 1의 home/away
    const nextMatchOrder = Math.ceil(match.match_order / 2);
    // 홀수 순서면 home, 짝수면 away
    const isHome = match.match_order % 2 === 1;

    const nextMatch = await prisma.court_event_matches.findFirst({
      where: {
        event_id: eId,
        round: nextRound,
        match_order: nextMatchOrder,
      },
    });

    if (nextMatch) {
      await prisma.court_event_matches.update({
        where: { id: nextMatch.id },
        data: isHome
          ? { home_team_id: winnerId }
          : { away_team_id: winnerId },
      });
    }
  }

  return apiSuccess({
    matchId: matchId.toString(),
    homeScore: body.home_score,
    awayScore: body.away_score,
    winnerId: winnerId.toString(),
  });
}

// ─── 유틸 함수 ───

// 2의 거듭제곱으로 올림 (예: 5→8, 6→8, 3→4)
function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// 부전승 처리: 매치를 완료하고 다음 라운드에 팀 배치
async function handleBye(
  eventId: bigint,
  match: { id: bigint; round: number; match_order: number },
  winnerId: bigint
) {
  // 현재 매치 완료 처리
  await prisma.court_event_matches.update({
    where: { id: match.id },
    data: {
      winner_id: winnerId,
      status: "completed",
    },
  });

  // 결승이 아니면 다음 라운드에 배치
  if (match.round > 1) {
    const nextRound = match.round / 2;
    const nextMatchOrder = Math.ceil(match.match_order / 2);
    const isHome = match.match_order % 2 === 1;

    const nextMatch = await prisma.court_event_matches.findFirst({
      where: {
        event_id: eventId,
        round: nextRound,
        match_order: nextMatchOrder,
      },
    });

    if (nextMatch) {
      await prisma.court_event_matches.update({
        where: { id: nextMatch.id },
        data: isHome
          ? { home_team_id: winnerId }
          : { away_team_id: winnerId },
      });
    }
  }
}
