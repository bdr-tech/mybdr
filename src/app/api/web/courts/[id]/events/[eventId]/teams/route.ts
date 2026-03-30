/**
 * POST /api/web/courts/[id]/events/[eventId]/teams — 팀 등록 (인증 필수)
 *
 * 기획설계 요약:
 *   - 로그인 유저가 팀명 + 선수 목록(user_id 배열)으로 팀 등록
 *   - 등록자가 자동으로 주장(is_captain)이 됨
 *   - 모집중(recruiting) 상태에서만 등록 가능
 *   - 최대 팀 수 초과 시 거부
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string; eventId: string }> };

export async function POST(
  req: NextRequest,
  { params }: RouteCtx
) {
  // 인증 확인
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { eventId } = await params;
  const userId = BigInt(session.sub);

  // 이벤트 조회
  const event = await prisma.court_events.findUnique({
    where: { id: BigInt(eventId) },
    include: { _count: { select: { teams: true } } },
  });
  if (!event) {
    return apiError("존재하지 않는 이벤트입니다", 404, "NOT_FOUND");
  }
  // 모집중 상태에서만 팀 등록 가능
  if (event.status !== "recruiting") {
    return apiError("모집중인 이벤트에서만 팀을 등록할 수 있습니다", 400, "NOT_RECRUITING");
  }
  // 최대 팀 수 확인
  if (event._count.teams >= event.max_teams) {
    return apiError(`최대 팀 수(${event.max_teams}팀)에 도달했습니다`, 400, "MAX_TEAMS_REACHED");
  }

  // 요청 본문 파싱
  let body: {
    team_name?: string;
    player_ids?: string[];     // 선수 user_id 배열 (등록자 포함 가능)
    jersey_numbers?: Record<string, number>; // user_id → 등번호 매핑 (선택)
  };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  // 팀명 검증
  if (!body.team_name || body.team_name.trim().length < 1 || body.team_name.trim().length > 100) {
    return apiError("팀명은 1~100자로 입력해주세요", 400, "INVALID_TEAM_NAME");
  }

  // 선수 목록 구성 — 등록자(주장)를 반드시 포함
  const playerIds = new Set<string>();
  playerIds.add(userId.toString()); // 등록자는 항상 포함
  if (body.player_ids) {
    for (const pid of body.player_ids) {
      playerIds.add(pid);
    }
  }

  // 팀 사이즈 검증 (이벤트 설정에 맞는지)
  if (playerIds.size > event.team_size) {
    return apiError(
      `팀 인원은 최대 ${event.team_size}명입니다 (현재 ${playerIds.size}명)`,
      400,
      "TOO_MANY_PLAYERS"
    );
  }

  // 트랜잭션: 팀 생성 + 선수 등록
  const team = await prisma.$transaction(async (tx) => {
    // 팀 생성
    const newTeam = await tx.court_event_teams.create({
      data: {
        event_id: BigInt(eventId),
        team_name: body.team_name!.trim(),
      },
    });

    // 선수 등록 — 등록자는 주장
    const playerData = Array.from(playerIds).map((pid) => ({
      team_id: newTeam.id,
      user_id: BigInt(pid),
      is_captain: pid === userId.toString(),
      jersey_number: body.jersey_numbers?.[pid] ?? null,
    }));

    await tx.court_event_players.createMany({ data: playerData });

    return newTeam;
  });

  return apiSuccess(
    {
      id: team.id.toString(),
      teamName: team.team_name,
      playersCount: playerIds.size,
    },
    201
  );
}
