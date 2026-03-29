/**
 * GET /api/web/pickups/[id] — 픽업게임 상세 조회 (공개)
 * PATCH /api/web/pickups/[id] — 픽업게임 수정 (방장만)
 * DELETE /api/web/pickups/[id] — 픽업게임 취소 (방장만)
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────
// GET: 픽업게임 상세 조회
// ─────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: RouteCtx
) {
  const { id } = await params;
  const pickupId = BigInt(id);

  const pickup = await prisma.pickup_games.findUnique({
    where: { id: pickupId },
    include: {
      host: { select: { nickname: true, profile_image_url: true } },
      court_infos: { select: { id: true, name: true, address: true } },
      participants: {
        include: {
          user: { select: { id: true, nickname: true, profile_image_url: true } },
        },
        orderBy: { joined_at: "asc" },
      },
    },
  });

  if (!pickup) {
    return apiError("존재하지 않는 픽업게임입니다", 404, "NOT_FOUND");
  }

  return apiSuccess({
    id: pickup.id.toString(),
    courtInfoId: pickup.court_info_id.toString(),
    courtName: pickup.court_infos.name,
    courtAddress: pickup.court_infos.address,
    hostId: pickup.host_id.toString(),
    hostNickname: pickup.host?.nickname ?? "사용자",
    hostImage: pickup.host?.profile_image_url ?? null,
    title: pickup.title,
    description: pickup.description,
    scheduledDate: pickup.scheduled_date.toISOString().split("T")[0],
    startTime: pickup.start_time,
    endTime: pickup.end_time,
    maxPlayers: pickup.max_players,
    currentPlayers: pickup.participants.length,
    skillLevel: pickup.skill_level,
    status: pickup.status,
    participants: pickup.participants.map((pt) => ({
      id: pt.id.toString(),
      userId: pt.user_id.toString(),
      nickname: pt.user?.nickname ?? "사용자",
      profileImage: pt.user?.profile_image_url ?? null,
      joinedAt: pt.joined_at.toISOString(),
    })),
    createdAt: pickup.created_at.toISOString(),
  });
}

// ─────────────────────────────────────────────────
// PATCH: 픽업게임 수정 (방장만)
// ─────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: RouteCtx
) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  const pickupId = BigInt(id);
  const userId = BigInt(session.sub);

  // 픽업게임 존재 + 방장 확인
  const pickup = await prisma.pickup_games.findUnique({
    where: { id: pickupId },
    select: { id: true, host_id: true, status: true },
  });
  if (!pickup) {
    return apiError("존재하지 않는 픽업게임입니다", 404, "NOT_FOUND");
  }
  if (pickup.host_id !== userId) {
    return apiError("방장만 수정할 수 있습니다", 403, "FORBIDDEN");
  }
  // 이미 완료/취소된 게임은 수정 불가
  if (pickup.status === "completed" || pickup.status === "cancelled") {
    return apiError("이미 종료된 게임은 수정할 수 없습니다", 400, "GAME_ENDED");
  }

  let body: {
    title?: string;
    description?: string;
    scheduled_date?: string;
    start_time?: string;
    end_time?: string;
    max_players?: number;
    skill_level?: string;
  };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }

  // 수정 가능한 필드만 추출
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {};

  if (body.title !== undefined) {
    if (body.title.trim().length < 2 || body.title.trim().length > 100) {
      return apiError("제목은 2~100자로 입력해주세요", 400, "INVALID_TITLE");
    }
    updateData.title = body.title.trim();
  }
  if (body.description !== undefined) {
    updateData.description = body.description?.trim() || null;
  }
  if (body.scheduled_date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.scheduled_date)) {
      return apiError("날짜를 YYYY-MM-DD 형식으로 입력해주세요", 400, "INVALID_DATE");
    }
    updateData.scheduled_date = new Date(body.scheduled_date + "T00:00:00.000Z");
  }
  if (body.start_time !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(body.start_time)) {
      return apiError("시작 시간을 HH:mm 형식으로 입력해주세요", 400, "INVALID_TIME");
    }
    updateData.start_time = body.start_time;
  }
  if (body.end_time !== undefined) {
    updateData.end_time = body.end_time || null;
  }
  if (body.max_players !== undefined) {
    if (body.max_players < 2 || body.max_players > 30) {
      return apiError("최대 인원은 2~30명 사이로 입력해주세요", 400, "INVALID_MAX_PLAYERS");
    }
    updateData.max_players = body.max_players;
  }
  if (body.skill_level !== undefined) {
    const validSkillLevels = ["beginner", "intermediate", "advanced", "any"];
    if (!validSkillLevels.includes(body.skill_level)) {
      return apiError("유효하지 않은 실력 수준입니다", 400, "INVALID_SKILL_LEVEL");
    }
    updateData.skill_level = body.skill_level;
  }

  if (Object.keys(updateData).length === 0) {
    return apiError("수정할 항목이 없습니다", 400, "NO_CHANGES");
  }

  const updated = await prisma.pickup_games.update({
    where: { id: pickupId },
    data: updateData,
  });

  return apiSuccess({
    id: updated.id.toString(),
    title: updated.title,
    status: updated.status,
  });
}

// ─────────────────────────────────────────────────
// DELETE: 픽업게임 취소 (방장만)
// - 실제 삭제가 아닌 상태를 cancelled로 변경
// ─────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: RouteCtx
) {
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  const pickupId = BigInt(id);
  const userId = BigInt(session.sub);

  const pickup = await prisma.pickup_games.findUnique({
    where: { id: pickupId },
    select: { id: true, host_id: true, status: true },
  });
  if (!pickup) {
    return apiError("존재하지 않는 픽업게임입니다", 404, "NOT_FOUND");
  }
  if (pickup.host_id !== userId) {
    return apiError("방장만 취소할 수 있습니다", 403, "FORBIDDEN");
  }
  if (pickup.status === "completed" || pickup.status === "cancelled") {
    return apiError("이미 종료된 게임입니다", 400, "GAME_ENDED");
  }

  await prisma.pickup_games.update({
    where: { id: pickupId },
    data: { status: "cancelled" },
  });

  return apiSuccess({ message: "픽업게임이 취소되었습니다" });
}
