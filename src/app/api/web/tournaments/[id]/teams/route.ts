import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/web/tournaments/[id]/teams
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id },
    include: {
      team: { select: { id: true, name: true, logoUrl: true, primaryColor: true } },
      players: { select: { id: true, userId: true, role: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  return toJSON(teams);
}

// POST /api/web/tournaments/[id]/teams — 팀 직접 등록 (어드민용)
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: { teamId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!body.teamId)
    return NextResponse.json({ error: "teamId가 필요합니다." }, { status: 400 });

  // TC-NEW-004: BigInt 변환 실패 방지
  let teamId: bigint;
  try {
    teamId = BigInt(body.teamId);
  } catch {
    return NextResponse.json({ error: "유효하지 않은 팀 ID입니다." }, { status: 400 });
  }

  const existing = await prisma.tournamentTeam.findUnique({
    where: { tournamentId_teamId: { tournamentId: id, teamId } },
  });
  if (existing)
    return NextResponse.json({ error: "이미 등록된 팀입니다." }, { status: 409 });

  // TC-NEW-008: create + teams_count increment 원자적 처리
  const tt = await prisma.$transaction(async (tx) => {
    const created = await tx.tournamentTeam.create({
      data: {
        tournamentId: id,
        teamId,
        status: "approved",
        registered_by_id: auth.userId,
        approved_at: new Date(),
      },
    });
    await tx.tournament.update({
      where: { id },
      data: { teams_count: { increment: 1 } },
    });
    return created;
  });

  return toJSON(tt);
}
