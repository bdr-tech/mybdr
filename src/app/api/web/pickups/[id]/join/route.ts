/**
 * POST /api/web/pickups/[id]/join — 픽업게임 참가 (즉시 확정)
 * DELETE /api/web/pickups/[id]/join — 픽업게임 탈퇴
 *
 * 기존 games의 "신청→승인" 워크플로와 달리 즉시 확정 방식.
 * 참가 시 max_players 도달하면 자동으로 full 상태 전환.
 * 탈퇴 시 full → recruiting 상태 복원.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────
// POST: 픽업게임 참가 (즉시 확정)
// ─────────────────────────────────────────────────
export async function POST(
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

  // 픽업게임 존재 + 상태 확인
  const pickup = await prisma.pickup_games.findUnique({
    where: { id: pickupId },
    include: { _count: { select: { participants: true } } },
  });

  if (!pickup) {
    return apiError("존재하지 않는 픽업게임입니다", 404, "NOT_FOUND");
  }
  if (pickup.status !== "recruiting") {
    return apiError("현재 참가할 수 없는 상태입니다", 400, "NOT_RECRUITING");
  }

  // 이미 참가 중인지 확인
  const existing = await prisma.pickup_participants.findUnique({
    where: {
      pickup_game_id_user_id: {
        pickup_game_id: pickupId,
        user_id: userId,
      },
    },
  });
  if (existing) {
    return apiError("이미 참가 중입니다", 409, "ALREADY_JOINED");
  }

  // 인원 초과 확인
  if (pickup._count.participants >= pickup.max_players) {
    // recruiting 상태인데 인원 도달 → full로 전환
    await prisma.pickup_games.update({
      where: { id: pickupId },
      data: { status: "full" },
    });
    return apiError("정원이 가득 찼습니다", 400, "GAME_FULL");
  }

  // 트랜잭션: 참가 등록 + 정원 확인 후 상태 전환
  await prisma.$transaction(async (tx) => {
    await tx.pickup_participants.create({
      data: {
        pickup_game_id: pickupId,
        user_id: userId,
      },
    });

    // 참가 후 인원 재확인 → max_players 도달 시 full 전환
    const newCount = await tx.pickup_participants.count({
      where: { pickup_game_id: pickupId },
    });
    if (newCount >= pickup.max_players) {
      await tx.pickup_games.update({
        where: { id: pickupId },
        data: { status: "full" },
      });
    }
  });

  return apiSuccess({ message: "참가 완료!" }, 201);
}

// ─────────────────────────────────────────────────
// DELETE: 픽업게임 탈퇴
// - 방장은 탈퇴 불가 (게임 취소는 DELETE /api/web/pickups/[id])
// - 탈퇴 후 full → recruiting 상태 복원
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

  // 픽업게임 확인
  const pickup = await prisma.pickup_games.findUnique({
    where: { id: pickupId },
    select: { id: true, host_id: true, status: true, max_players: true },
  });
  if (!pickup) {
    return apiError("존재하지 않는 픽업게임입니다", 404, "NOT_FOUND");
  }

  // 방장은 탈퇴 불가 — 게임 취소를 사용해야 함
  if (pickup.host_id === userId) {
    return apiError("방장은 탈퇴할 수 없습니다. 게임 취소를 이용해주세요.", 400, "HOST_CANNOT_LEAVE");
  }

  // 이미 종료된 게임은 탈퇴 불가
  if (pickup.status === "completed" || pickup.status === "cancelled") {
    return apiError("이미 종료된 게임입니다", 400, "GAME_ENDED");
  }

  // 참가 기록 확인
  const participation = await prisma.pickup_participants.findUnique({
    where: {
      pickup_game_id_user_id: {
        pickup_game_id: pickupId,
        user_id: userId,
      },
    },
  });
  if (!participation) {
    return apiError("참가 중이 아닙니다", 404, "NOT_PARTICIPANT");
  }

  // 트랜잭션: 탈퇴 + full → recruiting 복원
  await prisma.$transaction(async (tx) => {
    await tx.pickup_participants.delete({
      where: { id: participation.id },
    });

    // full 상태에서 탈퇴하면 recruiting으로 복원
    if (pickup.status === "full") {
      await tx.pickup_games.update({
        where: { id: pickupId },
        data: { status: "recruiting" },
      });
    }
  });

  return apiSuccess({ message: "탈퇴 완료" });
}
