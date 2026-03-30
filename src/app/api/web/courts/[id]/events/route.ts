/**
 * GET  /api/web/courts/[id]/events — 코트별 3x3 이벤트 목록 (공개)
 * POST /api/web/courts/[id]/events — 이벤트 생성 (인증 필수)
 *
 * 기획설계 요약:
 *   - 코트에서 열리는 3x3 대회/이벤트를 생성·조회
 *   - 모집중/진행중 이벤트 우선 표시, 지난 이벤트는 자동 완료 처리
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────
// GET: 코트의 이벤트 목록 (공개 API)
// ─────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: RouteCtx
) {
  const { id } = await params;
  // ID가 숫자인지 검증 — 문자열이 들어오면 BigInt 변환 시 500 에러 방지
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtId = BigInt(id);

  // KST 기준 오늘 날짜 계산 (픽업게임 패턴 재사용)
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayStr = kstDate.toISOString().split("T")[0];
  const todayDate = new Date(todayStr + "T00:00:00.000Z");

  // 지난 이벤트 자동 완료 처리 (recruiting/ready/in_progress → completed)
  await prisma.court_events.updateMany({
    where: {
      court_info_id: courtId,
      event_date: { lt: todayDate },
      status: { in: ["recruiting", "ready", "in_progress"] },
    },
    data: { status: "completed" },
  }).catch(() => {/* 실패해도 조회에 영향 없음 */});

  // 쿼리 파라미터
  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("take") ?? 20), 50);
  const skip = Number(url.searchParams.get("skip") ?? 0);
  // include_past=true면 완료/취소도 포함
  const includePast = url.searchParams.get("include_past") === "true";

  // 이벤트 목록 조회
  const events = await prisma.court_events.findMany({
    where: {
      court_info_id: courtId,
      ...(!includePast && {
        status: { in: ["recruiting", "ready", "in_progress"] },
      }),
    },
    orderBy: [{ event_date: "asc" }, { start_time: "asc" }],
    take,
    skip,
    include: {
      organizer: { select: { id: true, nickname: true, profile_image_url: true } },
      teams: {
        include: {
          players: {
            include: {
              user: { select: { id: true, nickname: true, profile_image_url: true } },
            },
          },
        },
      },
      _count: { select: { teams: true, matches: true } },
    },
  });

  // BigInt → string 직렬화
  const serialized = events.map((e) => ({
    id: e.id.toString(),
    courtInfoId: e.court_info_id.toString(),
    organizerId: e.organizer_id.toString(),
    organizerNickname: e.organizer?.nickname ?? "사용자",
    organizerImage: e.organizer?.profile_image_url ?? null,
    title: e.title,
    description: e.description,
    eventDate: e.event_date.toISOString().split("T")[0],
    startTime: e.start_time,
    endTime: e.end_time,
    maxTeams: e.max_teams,
    teamSize: e.team_size,
    format: e.format,
    status: e.status,
    rules: e.rules,
    prize: e.prize,
    teamsCount: e._count.teams,
    matchesCount: e._count.matches,
    // 팀 상세 (선수 포함)
    teams: e.teams.map((t) => ({
      id: t.id.toString(),
      teamName: t.team_name,
      seed: t.seed,
      status: t.status,
      players: t.players.map((p) => ({
        id: p.id.toString(),
        userId: p.user_id.toString(),
        nickname: p.user?.nickname ?? "사용자",
        profileImage: p.user?.profile_image_url ?? null,
        jerseyNumber: p.jersey_number,
        isCaptain: p.is_captain,
      })),
    })),
    createdAt: e.created_at.toISOString(),
  }));

  return apiSuccess({ events: serialized, total: serialized.length });
}

// ─────────────────────────────────────────────────
// POST: 3x3 이벤트 생성 (인증 필수)
// ─────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: RouteCtx
) {
  // 인증 확인
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  // ID가 숫자인지 검증
  if (!/^\d+$/.test(id)) {
    return apiError("유효하지 않은 코트 ID입니다", 400);
  }
  const courtId = BigInt(id);
  const userId = BigInt(session.sub);

  // 코트 존재 확인
  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
    select: { id: true },
  });
  if (!court) {
    return apiError("존재하지 않는 코트입니다", 404, "NOT_FOUND");
  }

  // 요청 본문 파싱
  let body: {
    title?: string;
    description?: string;
    event_date?: string;    // YYYY-MM-DD
    start_time?: string;    // HH:mm
    end_time?: string;      // HH:mm
    max_teams?: number;
    team_size?: number;
    format?: string;
    rules?: string;
    prize?: string;
  };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  // 필수값 검증
  if (!body.title || body.title.trim().length < 2 || body.title.trim().length > 200) {
    return apiError("제목은 2~200자로 입력해주세요", 400, "INVALID_TITLE");
  }
  if (!body.event_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.event_date)) {
    return apiError("날짜를 YYYY-MM-DD 형식으로 입력해주세요", 400, "INVALID_DATE");
  }
  if (body.start_time && !/^\d{2}:\d{2}$/.test(body.start_time)) {
    return apiError("시작 시간을 HH:mm 형식으로 입력해주세요", 400, "INVALID_TIME");
  }
  if (body.end_time && !/^\d{2}:\d{2}$/.test(body.end_time)) {
    return apiError("종료 시간을 HH:mm 형식으로 입력해주세요", 400, "INVALID_TIME");
  }

  // 최대 팀 수 검증 (4/8/16만 허용)
  const validMaxTeams = [4, 8, 16];
  const maxTeams = body.max_teams ?? 8;
  if (!validMaxTeams.includes(maxTeams)) {
    return apiError("최대 팀 수는 4, 8, 16 중에서 선택해주세요", 400, "INVALID_MAX_TEAMS");
  }

  // 팀 사이즈 검증 (2~5명)
  const teamSize = body.team_size ?? 3;
  if (teamSize < 2 || teamSize > 5) {
    return apiError("팀 인원은 2~5명 사이로 입력해주세요", 400, "INVALID_TEAM_SIZE");
  }

  // 대회 형식 검증
  const validFormats = ["single_elimination", "round_robin"];
  const format = body.format ?? "single_elimination";
  if (!validFormats.includes(format)) {
    return apiError("대회 형식은 single_elimination 또는 round_robin만 가능합니다", 400, "INVALID_FORMAT");
  }

  // 날짜 검증: 과거 불가
  const eventDate = new Date(body.event_date + "T00:00:00.000Z");
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstToday = new Date(now.getTime() + kstOffset);
  const todayStr = kstToday.toISOString().split("T")[0];
  const todayDate = new Date(todayStr + "T00:00:00.000Z");

  if (eventDate < todayDate) {
    return apiError("과거 날짜에는 생성할 수 없습니다", 400, "PAST_DATE");
  }

  // 이벤트 생성
  const event = await prisma.court_events.create({
    data: {
      court_info_id: courtId,
      organizer_id: userId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      event_date: eventDate,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      max_teams: maxTeams,
      team_size: teamSize,
      format,
      rules: body.rules?.trim() || null,
      prize: body.prize?.trim() || null,
    },
  });

  return apiSuccess(
    {
      id: event.id.toString(),
      title: event.title,
      eventDate: event.event_date.toISOString().split("T")[0],
      status: event.status,
    },
    201
  );
}
