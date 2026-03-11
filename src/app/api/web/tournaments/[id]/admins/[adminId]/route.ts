import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string; adminId: string }> };

// PATCH /api/web/tournaments/[id]/admins/[adminId] — 역할 변경
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, adminId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: { role?: string };
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const member = await prisma.tournamentAdminMember.findFirst({
    where: { id: BigInt(adminId), tournamentId: id },
  });
  if (!member) return apiError("관리자를 찾을 수 없습니다.", 404);

  const updated = await prisma.tournamentAdminMember.update({
    where: { id: BigInt(adminId) },
    data: { ...(body.role && { role: body.role }) },
  });

  return apiSuccess(updated);
}

// DELETE /api/web/tournaments/[id]/admins/[adminId]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, adminId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const member = await prisma.tournamentAdminMember.findFirst({
    where: { id: BigInt(adminId), tournamentId: id },
  });
  if (!member) return apiError("관리자를 찾을 수 없습니다.", 404);

  // 소프트 삭제
  await prisma.tournamentAdminMember.update({
    where: { id: BigInt(adminId) },
    data: { isActive: false },
  });

  return apiSuccess({ deleted: true });
}
