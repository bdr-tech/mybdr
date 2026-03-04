import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/web/tournaments/[id]/matches
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id },
    include: {
      homeTeam: { include: { team: { select: { name: true, primaryColor: true, logoUrl: true } } } },
      awayTeam: { include: { team: { select: { name: true, primaryColor: true, logoUrl: true } } } },
      tournament_teams_tournament_matches_winner_team_idTotournament_teams: {
        select: { id: true },
      },
    },
    orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }],
  });

  return toJSON(matches);
}

// POST /api/web/tournaments/[id]/matches — 경기 수동 생성
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { homeTeamId, awayTeamId, roundName, round_number, scheduledAt, venue_name } =
    body as Record<string, string | null | undefined>;

  // TC-NEW-010: BigInt 변환 실패 방지
  let homeBigInt: bigint | null = null;
  let awayBigInt: bigint | null = null;
  try {
    if (homeTeamId) homeBigInt = BigInt(homeTeamId);
    if (awayTeamId) awayBigInt = BigInt(awayTeamId);
  } catch {
    return NextResponse.json({ error: "유효하지 않은 팀 ID입니다." }, { status: 400 });
  }

  // TC-NEW-010: create + matches_count increment 원자적 처리
  const match = await prisma.$transaction(async (tx) => {
    const m = await tx.tournamentMatch.create({
      data: {
        tournamentId: id,
        homeTeamId: homeBigInt,
        awayTeamId: awayBigInt,
        roundName: roundName ?? null,
        round_number: round_number ? Number(round_number) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        venue_name: venue_name ?? null,
        status: "scheduled",
      },
    });
    await tx.tournament.update({
      where: { id },
      data: { matches_count: { increment: 1 } },
    });
    return m;
  });

  return toJSON(match);
}
