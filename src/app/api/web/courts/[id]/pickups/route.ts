/**
 * GET /api/web/courts/[id]/pickups — 코트별 픽업게임 목록 (공개)
 * POST /api/web/courts/[id]/pickups — 픽업게임 생성 (인증 필수)
 *
 * 기획설계 요약:
 *   - 생성 시 방장(host)이 자동으로 첫 번째 참가자로 등록
 *   - 조회 시 지난 경기는 자동으로 completed 상태 전환 (cron 없이)
 *   - 참가자 수가 max_players 이상이면 full 상태
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────
// GET: 코트의 픽업게임 목록 (공개 API)
// - recruiting/full 상태만 표시 (completed/cancelled 제외)
// - 오늘 이후 날짜만 (과거 자동 완료)
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

  // 오늘 날짜 (KST 기준 — UTC+9) → 자정 시점을 UTC로 변환
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayStr = kstDate.toISOString().split("T")[0]; // YYYY-MM-DD
  const todayDate = new Date(todayStr + "T00:00:00.000Z");

  // 지난 경기 자동 완료 처리 (recruiting/full → completed)
  await prisma.pickup_games.updateMany({
    where: {
      court_info_id: courtId,
      scheduled_date: { lt: todayDate },
      status: { in: ["recruiting", "full"] },
    },
    data: { status: "completed" },
  }).catch(() => {/* 실패해도 조회에 영향 없음 */});

  // 쿼리 파라미터
  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("take") ?? 20), 50);
  const skip = Number(url.searchParams.get("skip") ?? 0);

  // 오늘 이후 + recruiting/full 상태만 조회
  const pickups = await prisma.pickup_games.findMany({
    where: {
      court_info_id: courtId,
      scheduled_date: { gte: todayDate },
      status: { in: ["recruiting", "full"] },
    },
    orderBy: [{ scheduled_date: "asc" }, { start_time: "asc" }],
    take,
    skip,
    include: {
      host: { select: { nickname: true, profile_image_url: true } },
      participants: {
        include: {
          user: { select: { id: true, nickname: true, profile_image_url: true } },
        },
      },
    },
  });

  // BigInt → string 직렬화
  const serialized = pickups.map((p) => ({
    id: p.id.toString(),
    courtInfoId: p.court_info_id.toString(),
    hostId: p.host_id.toString(),
    hostNickname: p.host?.nickname ?? "사용자",
    hostImage: p.host?.profile_image_url ?? null,
    title: p.title,
    description: p.description,
    scheduledDate: p.scheduled_date.toISOString().split("T")[0],
    startTime: p.start_time,
    endTime: p.end_time,
    maxPlayers: p.max_players,
    currentPlayers: p.participants.length,
    skillLevel: p.skill_level,
    status: p.status,
    participants: p.participants.map((pt) => ({
      id: pt.id.toString(),
      userId: pt.user_id.toString(),
      nickname: pt.user?.nickname ?? "사용자",
      profileImage: pt.user?.profile_image_url ?? null,
      joinedAt: pt.joined_at.toISOString(),
    })),
    createdAt: p.created_at.toISOString(),
  }));

  return apiSuccess({ pickups: serialized, total: serialized.length });
}

// ─────────────────────────────────────────────────
// POST: 픽업게임 생성 (인증 필수)
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
    scheduled_date?: string;  // YYYY-MM-DD
    start_time?: string;      // HH:mm
    end_time?: string;        // HH:mm
    max_players?: number;
    skill_level?: string;
  };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  // 필수값 검증
  if (!body.title || body.title.trim().length < 2 || body.title.trim().length > 100) {
    return apiError("제목은 2~100자로 입력해주세요", 400, "INVALID_TITLE");
  }
  if (!body.scheduled_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.scheduled_date)) {
    return apiError("날짜를 YYYY-MM-DD 형식으로 입력해주세요", 400, "INVALID_DATE");
  }
  if (!body.start_time || !/^\d{2}:\d{2}$/.test(body.start_time)) {
    return apiError("시작 시간을 HH:mm 형식으로 입력해주세요", 400, "INVALID_TIME");
  }
  if (body.end_time && !/^\d{2}:\d{2}$/.test(body.end_time)) {
    return apiError("종료 시간을 HH:mm 형식으로 입력해주세요", 400, "INVALID_TIME");
  }
  if (!body.max_players || body.max_players < 2 || body.max_players > 30) {
    return apiError("최대 인원은 2~30명 사이로 입력해주세요", 400, "INVALID_MAX_PLAYERS");
  }

  // 날짜 검증: 과거 불가
  const scheduledDate = new Date(body.scheduled_date + "T00:00:00.000Z");
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstToday = new Date(now.getTime() + kstOffset);
  const todayStr = kstToday.toISOString().split("T")[0];
  const todayDate = new Date(todayStr + "T00:00:00.000Z");

  if (scheduledDate < todayDate) {
    return apiError("과거 날짜에는 생성할 수 없습니다", 400, "PAST_DATE");
  }

  // 실력 수준 검증
  const validSkillLevels = ["beginner", "intermediate", "advanced", "any"];
  if (body.skill_level && !validSkillLevels.includes(body.skill_level)) {
    return apiError(
      `유효하지 않은 실력 수준입니다. 가능한 값: ${validSkillLevels.join(", ")}`,
      400,
      "INVALID_SKILL_LEVEL"
    );
  }

  // 트랜잭션: 픽업게임 생성 + 방장을 첫 참가자로 등록
  const pickup = await prisma.$transaction(async (tx) => {
    // 픽업게임 생성
    const game = await tx.pickup_games.create({
      data: {
        court_info_id: courtId,
        host_id: userId,
        title: body.title!.trim(),
        description: body.description?.trim() || null,
        scheduled_date: scheduledDate,
        start_time: body.start_time!,
        end_time: body.end_time || null,
        max_players: body.max_players!,
        skill_level: body.skill_level || "any",
      },
    });

    // 방장 자동 참가
    await tx.pickup_participants.create({
      data: {
        pickup_game_id: game.id,
        user_id: userId,
      },
    });

    return game;
  });

  return apiSuccess(
    {
      id: pickup.id.toString(),
      title: pickup.title,
      scheduledDate: pickup.scheduled_date.toISOString().split("T")[0],
      startTime: pickup.start_time,
      status: pickup.status,
    },
    201
  );
}
