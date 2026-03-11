import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string; teamId: string }> };

// PATCH /api/web/tournaments/[id]/teams/[teamId]
// 팀 상태 변경: pending → approved / rejected, 시드 배정
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, teamId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  // TC-NEW-005: BigInt 변환 실패 방지
  const teamBigInt = parseBigIntParam(teamId);
  if (teamBigInt === null) {
    return apiError("팀을 찾을 수 없습니다.", 404);
  }

  const tt = await prisma.tournamentTeam.findFirst({
    where: { id: teamBigInt, tournamentId: id },
  });
  if (!tt)
    return apiError("팀을 찾을 수 없습니다.", 404);

  const { status, seedNumber, groupName, division } = body as Record<string, string | number | null | undefined>;

  // TC-NEW-006: 시드 번호 범위 검증
  if (seedNumber !== undefined && seedNumber !== null) {
    const n = Number(seedNumber);
    if (!Number.isInteger(n) || n < 1) {
      return apiError("시드 번호는 1 이상의 정수여야 합니다.", 400);
    }
  }

  const wasApproved = tt.status === "approved";
  const nowApproved = status === "approved";
  const nowRejected = status === "rejected";

  // TC-NEW-007: 팀 업데이트 + teams_count 동기화를 원자적 트랜잭션으로 처리
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.tournamentTeam.update({
      where: { id: teamBigInt },
      data: {
        ...(status !== undefined && { status: String(status) }),
        ...(seedNumber !== undefined && { seedNumber: seedNumber ? Number(seedNumber) : null }),
        ...(groupName !== undefined && { groupName: groupName ? String(groupName) : null }),
        ...(division !== undefined && { division: division ? String(division) : null }),
        ...(!wasApproved && nowApproved && { approved_at: new Date() }),
      },
    });

    if (!wasApproved && nowApproved) {
      await tx.tournament.update({ where: { id }, data: { teams_count: { increment: 1 } } });
    } else if (wasApproved && (nowRejected || status === "withdrawn")) {
      await tx.tournament.update({ where: { id }, data: { teams_count: { decrement: 1 } } });
    }

    return u;
  });

  return apiSuccess(updated);
}

// DELETE /api/web/tournaments/[id]/teams/[teamId]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, teamId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  // TC-NEW-005: BigInt 변환 실패 방지
  const teamBigInt = parseBigIntParam(teamId);
  if (teamBigInt === null) {
    return apiError("팀을 찾을 수 없습니다.", 404);
  }

  const tt = await prisma.tournamentTeam.findFirst({
    where: { id: teamBigInt, tournamentId: id },
  });
  if (!tt)
    return apiError("팀을 찾을 수 없습니다.", 404);

  // TC-NEW-009: 삭제 + teams_count decrement 원자적 트랜잭션
  await prisma.$transaction(async (tx) => {
    await tx.tournamentTeam.delete({ where: { id: teamBigInt } });
    if (tt.status === "approved") {
      await tx.tournament.update({ where: { id }, data: { teams_count: { decrement: 1 } } });
    }
  });

  return apiSuccess({ deleted: true });
}
