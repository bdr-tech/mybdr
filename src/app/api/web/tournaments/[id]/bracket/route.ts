import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";

type Ctx = { params: Promise<{ id: string }> };

function nextPow2(n: number) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

function roundName(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - round; // 0 = 결승, 1 = 준결승, ...
  const names: Record<number, string> = {
    0: "결승",
    1: "준결승",
    2: "준준결승",
    3: "8강",
    4: "16강",
    5: "32강",
  };
  return names[fromFinal] ?? `라운드 ${round}`;
}

// POST /api/web/tournaments/[id]/bracket
// 대진표 자동 생성 (싱글 엘리미네이션)
// body: { clear?: boolean } — clear=true면 기존 경기 삭제 후 재생성
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: { clear?: boolean } = {};
  try {
    body = await req.json();
  } catch { /* optional */ }

  // 승인된 팀 목록
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id, status: "approved" },
    orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
    select: { id: true, seedNumber: true },
  });

  if (teams.length < 2)
    return NextResponse.json({ error: "2팀 이상 승인되어야 대진표를 생성할 수 있습니다." }, { status: 400 });

  // 기존 경기 삭제 옵션
  if (body.clear) {
    await prisma.tournamentMatch.deleteMany({ where: { tournamentId: id } });
  } else {
    const existing = await prisma.tournamentMatch.count({ where: { tournamentId: id } });
    if (existing > 0)
      return NextResponse.json(
        { error: "이미 경기가 존재합니다. clear=true로 재생성하세요." },
        { status: 409 }
      );
  }

  const n = teams.length;
  const slots = nextPow2(n);
  const totalRounds = Math.log2(slots);

  // 생성된 matchId를 round별로 보관
  // roundMatchIds[r] = [matchId at pos 1, matchId at pos 2, ...]
  // r=totalRounds = 결승, r=1 = 첫 라운드
  const roundMatchIds: Record<number, bigint[]> = {};

  // 결승부터 첫 라운드까지 역순으로 생성 → next_match_id 연결 가능
  let matchCounter = 1;

  for (let r = totalRounds; r >= 1; r--) {
    const matchCount = slots / Math.pow(2, r);
    roundMatchIds[r] = [];

    for (let pos = 1; pos <= matchCount; pos++) {
      // 첫 라운드에서만 실제 팀 배치
      let homeTeamId: bigint | null = null;
      let awayTeamId: bigint | null = null;

      if (r === 1) {
        const homeIdx = (pos - 1) * 2;
        const awayIdx = homeIdx + 1;
        homeTeamId = teams[homeIdx]?.id ?? null;
        awayTeamId = teams[awayIdx]?.id ?? null;
      }

      // 다음 라운드 경기 ID 연결
      let nextMatchId: bigint | null = null;
      let nextMatchSlot: string | null = null;

      if (r < totalRounds) {
        const nextPos = Math.ceil(pos / 2); // 1-indexed
        nextMatchId = roundMatchIds[r + 1]?.[nextPos - 1] ?? null;
        nextMatchSlot = pos % 2 === 1 ? "home" : "away";
      }

      // 부전승 처리: 팀이 homeTeamId만 있고 awayTeamId가 null이면
      // homeTeam이 자동 승자 → 생성하지 않고 다음 경기에 배치
      if (r === 1 && homeTeamId && !awayTeamId) {
        // 부전승 — 다음 경기에 직접 배치
        if (nextMatchId && nextMatchSlot) {
          await prisma.tournamentMatch.update({
            where: { id: nextMatchId },
            data: {
              ...(nextMatchSlot === "home" && { homeTeamId }),
              ...(nextMatchSlot === "away" && { awayTeamId: homeTeamId }),
            },
          });
        }
        // 부전승 매치는 placeholder로 생성 (혹은 skip)
        // 여기선 placeholder로 생성하되 status=bye
        const match = await prisma.tournamentMatch.create({
          data: {
            tournamentId: id,
            homeTeamId,
            awayTeamId: null,
            roundName: roundName(r, totalRounds),
            round_number: r,
            bracket_level: r,
            bracket_position: pos,
            match_number: matchCounter++,
            status: "bye",
            winner_team_id: homeTeamId,
            next_match_id: nextMatchId,
            next_match_slot: nextMatchSlot,
          },
        });
        roundMatchIds[r].push(match.id);
        continue;
      }

      const match = await prisma.tournamentMatch.create({
        data: {
          tournamentId: id,
          homeTeamId,
          awayTeamId,
          roundName: roundName(r, totalRounds),
          round_number: r,
          bracket_level: r,
          bracket_position: pos,
          match_number: matchCounter++,
          status: r === 1 ? "scheduled" : "pending",
          next_match_id: nextMatchId,
          next_match_slot: nextMatchSlot,
        },
      });

      roundMatchIds[r].push(match.id);
    }
  }

  // matches_count 갱신
  const total = await prisma.tournamentMatch.count({ where: { tournamentId: id } });
  await prisma.tournament.update({ where: { id }, data: { matches_count: total } });

  return toJSON({ success: true, matchesCreated: matchCounter - 1, rounds: totalRounds });
}
