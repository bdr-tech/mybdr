import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";
import { updateTeamStandings } from "@/lib/tournaments/update-standings";

type Ctx = { params: Promise<{ id: string; matchId: string }> };

// 허용된 매치 상태 전환 테이블 (TC-NEW-012)
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:     ["scheduled", "cancelled"],
  scheduled:   ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  bye:         [],
  completed:   [],
  cancelled:   ["scheduled"],
};

// PATCH /api/web/tournaments/[id]/matches/[matchId]
// 점수 입력, 상태 변경, 승자 설정
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, matchId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  // TC-026: BigInt 변환 실패 방지
  let matchBigInt: bigint;
  try {
    matchBigInt = BigInt(matchId);
  } catch {
    return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });
  }

  const match = await prisma.tournamentMatch.findFirst({
    where: { id: matchBigInt, tournamentId: id },
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

  // TC-NEW-012: 상태 전환 유효성 검증
  if (status !== undefined && status !== match.status) {
    const currentStatus = match.status ?? "pending";
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(String(status))) {
      return NextResponse.json(
        { error: `'${currentStatus}' 상태에서 '${status}'로 변경할 수 없습니다.` },
        { status: 400 }
      );
    }
  }

  // TC-031: 완료 처리 시 승자 팀 필수
  if (status === "completed" && !winner_team_id) {
    return NextResponse.json({ error: "완료 처리 시 승자 팀을 지정해야 합니다." }, { status: 400 });
  }

  // TC-NEW-011: 점수 음수 방지
  if (homeScore !== undefined && homeScore !== null) {
    const n = Number(homeScore);
    if (n < 0 || !Number.isFinite(n)) {
      return NextResponse.json({ error: "점수는 0 이상이어야 합니다." }, { status: 400 });
    }
  }
  if (awayScore !== undefined && awayScore !== null) {
    const n = Number(awayScore);
    if (n < 0 || !Number.isFinite(n)) {
      return NextResponse.json({ error: "점수는 0 이상이어야 합니다." }, { status: 400 });
    }
  }

  // TC-NEW-013: winner_team_id는 해당 매치에 속한 팀이어야 함 (IDOR 방지)
  if (winner_team_id) {
    let wid: bigint;
    try {
      wid = BigInt(String(winner_team_id));
    } catch {
      return NextResponse.json({ error: "유효하지 않은 승자 팀 ID입니다." }, { status: 400 });
    }
    if (wid !== match.homeTeamId && wid !== match.awayTeamId) {
      return NextResponse.json({ error: "승자는 경기에 참여한 팀이어야 합니다." }, { status: 400 });
    }
  }

  // TC-006: 이미 완료된 매치인지 기록 (전적 중복 갱신 방지)
  const alreadyCompleted = match.status === "completed";

  // TC-NEW-014: 매치 업데이트 + 다음 경기 팀 배치를 원자적 트랜잭션으로 처리
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.tournamentMatch.update({
      where: { id: matchBigInt },
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
    if (winner_team_id && u.next_match_id) {
      const slot = u.next_match_slot; // "home" | "away"
      await tx.tournamentMatch.update({
        where: { id: u.next_match_id },
        data: {
          ...(slot === "home" && { homeTeamId: BigInt(String(winner_team_id)) }),
          ...(slot === "away" && { awayTeamId: BigInt(String(winner_team_id)) }),
          status: "scheduled",
        },
      });
    }

    return u;
  });

  // TC-006: 이미 completed였던 매치는 전적 재갱신 금지 (중복 increment 방지)
  if (status === "completed" && !alreadyCompleted) {
    updateTeamStandings(matchBigInt).catch((err) => {
      console.error(`[updateTeamStandings] matchId=${matchBigInt} 전적 갱신 실패:`, err);
    });
  }

  return toJSON(updated);
}

// DELETE /api/web/tournaments/[id]/matches/[matchId]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, matchId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let deleteBigInt: bigint;
  try {
    deleteBigInt = BigInt(matchId);
  } catch {
    return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });
  }

  const match = await prisma.tournamentMatch.findFirst({
    where: { id: deleteBigInt, tournamentId: id },
  });
  if (!match) return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });

  // TC-NEW-015: 완료된 경기는 전적 롤백 불가하므로 삭제 차단
  if (match.status === "completed") {
    return NextResponse.json(
      { error: "완료된 경기는 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  // delete + matches_count decrement 원자적 처리
  await prisma.$transaction(async (tx) => {
    await tx.tournamentMatch.delete({ where: { id: deleteBigInt } });
    await tx.tournament.update({ where: { id }, data: { matches_count: { decrement: 1 } } });
  });

  return NextResponse.json({ deleted: true });
}
