import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";

type Ctx = { params: Promise<{ id: string; matchId: string }> };

// PATCH /api/web/tournaments/[id]/matches/[matchId]
// 점수 입력, 상태 변경, 승자 설정
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, matchId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const match = await prisma.tournamentMatch.findFirst({
    where: { id: BigInt(matchId), tournamentId: id },
  });
  if (!match) return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const {
    homeScore, awayScore, status, winner_team_id,
    scheduledAt, venue_name, roundName, notes,
    homeTeamId, awayTeamId,
  } = body as Record<string, string | number | null | undefined>;

  const updated = await prisma.tournamentMatch.update({
    where: { id: BigInt(matchId) },
    data: {
      ...(homeScore !== undefined && { homeScore: Number(homeScore) }),
      ...(awayScore !== undefined && { awayScore: Number(awayScore) }),
      ...(status !== undefined && { status: String(status) }),
      ...(winner_team_id !== undefined && {
        winner_team_id: winner_team_id ? BigInt(String(winner_team_id)) : null,
      }),
      ...(scheduledAt !== undefined && {
        scheduledAt: scheduledAt ? new Date(String(scheduledAt)) : null,
      }),
      ...(venue_name !== undefined && { venue_name: venue_name ? String(venue_name) : null }),
      ...(roundName !== undefined && { roundName: roundName ? String(roundName) : null }),
      ...(notes !== undefined && { notes: notes ? String(notes) : null }),
      ...(homeTeamId !== undefined && {
        homeTeamId: homeTeamId ? BigInt(String(homeTeamId)) : null,
      }),
      ...(awayTeamId !== undefined && {
        awayTeamId: awayTeamId ? BigInt(String(awayTeamId)) : null,
      }),
      ...(status === "completed" && { ended_at: new Date() }),
      ...(status === "in_progress" && { started_at: new Date() }),
    },
  });

  // 승자가 확정되고 next_match_id가 있으면 → 다음 경기에 팀 배치
  if (winner_team_id && updated.next_match_id) {
    const slot = updated.next_match_slot; // "home" | "away"
    await prisma.tournamentMatch.update({
      where: { id: updated.next_match_id },
      data: {
        ...(slot === "home" && { homeTeamId: BigInt(String(winner_team_id)) }),
        ...(slot === "away" && { awayTeamId: BigInt(String(winner_team_id)) }),
        status: "scheduled",
      },
    });
  }

  return toJSON(updated);
}

// DELETE /api/web/tournaments/[id]/matches/[matchId]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, matchId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const match = await prisma.tournamentMatch.findFirst({
    where: { id: BigInt(matchId), tournamentId: id },
  });
  if (!match) return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });

  await prisma.tournamentMatch.delete({ where: { id: BigInt(matchId) } });
  await prisma.tournament.update({ where: { id }, data: { matches_count: { decrement: 1 } } });

  return NextResponse.json({ deleted: true });
}
