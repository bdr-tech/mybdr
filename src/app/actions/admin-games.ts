"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { adminLog } from "@/lib/admin/log";

// 슈퍼관리자 권한 확인 (기존 admin action 패턴 동일)
async function requireSuperAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") throw new Error("권한이 없습니다.");
  return session;
}

// 유효한 경기 상태값: 1=모집중, 2=확정, 3=완료, 4=취소
const VALID_STATUSES = [1, 2, 3, 4];

/**
 * 경기 상태 변경 — admin 전용
 * formData: game_id (BigInt), status (number)
 */
export async function updateGameStatusAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const gameId = formData.get("game_id") as string;
  const statusStr = formData.get("status") as string;
  const newStatus = Number(statusStr);

  // 유효성 검사
  if (!gameId || !VALID_STATUSES.includes(newStatus)) return;

  // 기존 상태 조회 (로그용)
  const prev = await prisma.games.findUnique({
    where: { id: BigInt(gameId) },
    select: { status: true, title: true },
  });

  // 상태 업데이트
  await prisma.games.update({
    where: { id: BigInt(gameId) },
    data: { status: newStatus },
  });

  // 관리자 활동 로그 기록
  await adminLog("game.status_change", "Game", {
    resourceId: gameId,
    description: `경기 상태 변경: ${prev?.title}`,
    previousValues: { status: prev?.status },
    changesMade: { status: newStatus },
    severity: newStatus === 4 ? "warning" : "info",
  });

  revalidatePath("/admin/games");
}
