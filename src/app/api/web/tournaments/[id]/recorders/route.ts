import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/web/tournaments/:id/recorders
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const recorders = await prisma.tournament_recorders.findMany({
    where: { tournamentId: id },
    include: {
      recorder: { select: { id: true, email: true, nickname: true, profile_image_url: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(recorders);
}

// POST /api/web/tournaments/:id/recorders
// body: { email?: string; userId?: string }
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const { email, userId: userIdStr } = body as { email?: string; userId?: string };

  let targetUser: { id: bigint; email: string; nickname: string | null } | null = null;

  if (userIdStr) {
    const uid = parseBigIntParam(userIdStr);
    if (uid === null) {
      return apiError("유효하지 않은 사용자 ID입니다.", 400);
    }
    targetUser = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, email: true, nickname: true },
    });
  } else if (email) {
    targetUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, nickname: true },
    });
  } else {
    return apiError("이메일 또는 사용자 ID가 필요합니다.", 400);
  }

  if (!targetUser) {
    return apiError("사용자를 찾을 수 없습니다.", 404);
  }

  // 이미 등록된 기록원인지 확인
  const existing = await prisma.tournament_recorders.findFirst({
    where: { tournamentId: id, recorderId: targetUser.id },
  });

  if (existing) {
    // 비활성화된 기록원이면 재활성화
    if (!existing.isActive) {
      const updated = await prisma.tournament_recorders.update({
        where: { id: existing.id },
        data: { isActive: true, assignedBy: auth.userId },
      });
      return apiSuccess(updated);
    }
    return apiError("이미 기록원으로 등록된 사용자입니다.", 409);
  }

  const recorder = await prisma.tournament_recorders.create({
    data: {
      tournamentId: id,
      recorderId:   targetUser.id,
      assignedBy:   auth.userId,
      isActive:     true,
    },
    include: {
      recorder: { select: { id: true, email: true, nickname: true, profile_image_url: true } },
    },
  });

  return apiSuccess(recorder);
}

// DELETE /api/web/tournaments/:id/recorders
// body: { recorderId: string }
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const { recorderId } = body as { recorderId?: string };
  if (!recorderId) {
    return apiError("recorderId가 필요합니다.", 400);
  }

  const recorderBigInt = parseBigIntParam(recorderId);
  if (recorderBigInt === null) {
    return apiError("유효하지 않은 기록원 ID입니다.", 400);
  }

  const row = await prisma.tournament_recorders.findFirst({
    where: { tournamentId: id, recorderId: recorderBigInt },
  });
  if (!row) {
    return apiError("기록원을 찾을 수 없습니다.", 404);
  }

  // 소프트 삭제 (isActive = false)
  await prisma.tournament_recorders.update({
    where: { id: row.id },
    data: { isActive: false },
  });

  return apiSuccess({ deleted: true });
}
