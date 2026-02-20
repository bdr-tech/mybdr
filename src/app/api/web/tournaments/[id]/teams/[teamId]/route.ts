import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";

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
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const tt = await prisma.tournamentTeam.findFirst({
    where: { id: BigInt(teamId), tournamentId: id },
  });
  if (!tt)
    return NextResponse.json({ error: "팀을 찾을 수 없습니다." }, { status: 404 });

  const { status, seedNumber, groupName, division } = body as Record<string, string | number | null | undefined>;

  const wasApproved = tt.status === "approved";
  const nowApproved = status === "approved";
  const nowRejected = status === "rejected";

  const updated = await prisma.tournamentTeam.update({
    where: { id: BigInt(teamId) },
    data: {
      ...(status !== undefined && { status: String(status) }),
      ...(seedNumber !== undefined && { seedNumber: seedNumber ? Number(seedNumber) : null }),
      ...(groupName !== undefined && { groupName: groupName ? String(groupName) : null }),
      ...(division !== undefined && { division: division ? String(division) : null }),
      ...(!wasApproved && nowApproved && { approved_at: new Date() }),
    },
  });

  // teams_count 동기화
  if (!wasApproved && nowApproved) {
    await prisma.tournament.update({ where: { id }, data: { teams_count: { increment: 1 } } });
  } else if (wasApproved && (nowRejected || status === "withdrawn")) {
    await prisma.tournament.update({ where: { id }, data: { teams_count: { decrement: 1 } } });
  }

  return toJSON(updated);
}

// DELETE /api/web/tournaments/[id]/teams/[teamId]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, teamId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const tt = await prisma.tournamentTeam.findFirst({
    where: { id: BigInt(teamId), tournamentId: id },
  });
  if (!tt)
    return NextResponse.json({ error: "팀을 찾을 수 없습니다." }, { status: 404 });

  await prisma.tournamentTeam.delete({ where: { id: BigInt(teamId) } });

  if (tt.status === "approved") {
    await prisma.tournament.update({ where: { id }, data: { teams_count: { decrement: 1 } } });
  }

  return NextResponse.json({ deleted: true });
}
