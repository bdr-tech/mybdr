import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin, toJSON } from "@/lib/auth/tournament-auth";
import { getBracketVersionStatus, createBracketVersion, activateBracketVersion } from "@/lib/tournaments/bracket-version";
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

type Ctx = { params: Promise<{ id: string }> };

function nextPow2(n: number) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

function roundName(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - round;
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

// GET: bracket version status + matches + approved teams
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const [versionStatus, versions, matches, approvedTeams] = await Promise.all([
    getBracketVersionStatus(id),
    prisma.tournament_bracket_versions.findMany({
      where: { tournament_id: id },
      orderBy: { version_number: "asc" },
      select: { id: true, version_number: true, created_at: true, is_active: true },
    }),
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }],
      select: {
        id: true,
        roundName: true,
        round_number: true,
        bracket_position: true,
        match_number: true,
        status: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        winner_team_id: true,
        next_match_id: true,
        homeTeam: { select: { id: true, team: { select: { name: true, primaryColor: true } } } },
        awayTeam: { select: { id: true, team: { select: { name: true, primaryColor: true } } } },
      },
    }),
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id, status: "approved" },
      orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
      select: { id: true, seedNumber: true, team: { select: { name: true } } },
    }),
  ]);

  return toJSON({ ...versionStatus, versions, matches, approvedTeams });
}

// POST: generate bracket (single elimination)
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: { clear?: boolean } = {};
  try { body = await req.json(); } catch { /* optional */ }

  // Version limit check
  const versionStatus = await getBracketVersionStatus(id);
  if (versionStatus.needsApproval) {
    const [superAdmins, tournament] = await Promise.all([
      prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } }),
      prisma.tournament.findUnique({ where: { id }, select: { name: true } }),
    ]);
    if (superAdmins.length > 0) {
      await createNotificationBulk(
        superAdmins.map((u) => ({
          userId: u.id,
          notificationType: NOTIFICATION_TYPES.TOURNAMENT_BRACKET_APPROVAL,
          title: "대진표 추가 생성 승인 요청",
          content: `"${tournament?.name ?? id}" 대회에서 대진표 ${versionStatus.currentVersion + 1}번째 생성 승인이 요청되었습니다.`,
          actionUrl: `/admin/tournaments`,
        }))
      );
    }
    return NextResponse.json(
      { error: `무료 생성 횟수(${versionStatus.currentVersion}회)를 초과하였습니다. 슈퍼관리자의 승인을 요청했습니다.` },
      { status: 403 }
    );
  }

  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id, status: "approved" },
    orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
    select: { id: true, seedNumber: true },
  });

  if (teams.length < 2)
    return NextResponse.json({ error: "2팀 이상 승인되어야 대진표를 생성할 수 있습니다." }, { status: 400 });

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
  const roundMatchIds: Record<number, bigint[]> = {};
  let matchCounter = 1;

  for (let r = totalRounds; r >= 1; r--) {
    const matchCount = slots / Math.pow(2, r);
    roundMatchIds[r] = [];

    for (let pos = 1; pos <= matchCount; pos++) {
      let homeTeamId: bigint | null = null;
      let awayTeamId: bigint | null = null;

      if (r === 1) {
        const homeIdx = (pos - 1) * 2;
        const awayIdx = homeIdx + 1;
        homeTeamId = teams[homeIdx]?.id ?? null;
        awayTeamId = teams[awayIdx]?.id ?? null;
      }

      let nextMatchId: bigint | null = null;
      let nextMatchSlot: string | null = null;

      if (r < totalRounds) {
        const nextPos = Math.ceil(pos / 2);
        nextMatchId = roundMatchIds[r + 1]?.[nextPos - 1] ?? null;
        nextMatchSlot = pos % 2 === 1 ? "home" : "away";
      }

      if (r === 1 && homeTeamId && !awayTeamId) {
        if (nextMatchId && nextMatchSlot) {
          await prisma.tournamentMatch.update({
            where: { id: nextMatchId },
            data: {
              ...(nextMatchSlot === "home" && { homeTeamId }),
              ...(nextMatchSlot === "away" && { awayTeamId: homeTeamId }),
            },
          });
        }
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

  const total = await prisma.tournamentMatch.count({ where: { tournamentId: id } });
  await prisma.tournament.update({ where: { id }, data: { matches_count: total } });

  // Record new bracket version
  await createBracketVersion(id, auth.userId);

  return toJSON({
    success: true,
    matchesCreated: matchCounter - 1,
    rounds: totalRounds,
    versionNumber: versionStatus.currentVersion + 1,
  });
}

// PATCH: activate latest bracket version
export async function PATCH(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const latest = await prisma.tournament_bracket_versions.findFirst({
    where: { tournament_id: id },
    orderBy: { version_number: "desc" },
    select: { id: true },
  });

  if (!latest) {
    return NextResponse.json({ error: "생성된 대진표 버전이 없습니다." }, { status: 404 });
  }

  await activateBracketVersion(id, latest.id);
  return toJSON({ success: true });
}
