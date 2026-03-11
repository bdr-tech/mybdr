import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { apiSuccess, apiError } from "@/lib/api/response";

// GET /api/v1/matches/:id/roster
// 경기 홈/어웨이 선수 명단 반환 (기록원 권한 필요)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireRecorder(req, id);
    if (auth instanceof NextResponse) return auth;
    const { matchId } = auth as { matchId: bigint; userId: bigint; tournamentId: string };

    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: {
          select: {
            id: true,
            players: {
              where: { is_active: true },
              select: {
                id: true,
                jerseyNumber: true,
                isStarter: true,
                position: true,
                users: {
                  select: { id: true, name: true },
                },
              },
              orderBy: [{ isStarter: "desc" }, { jerseyNumber: "asc" }],
            },
          },
        },
        awayTeam: {
          select: {
            id: true,
            players: {
              where: { is_active: true },
              select: {
                id: true,
                jerseyNumber: true,
                isStarter: true,
                position: true,
                users: {
                  select: { id: true, name: true },
                },
              },
              orderBy: [{ isStarter: "desc" }, { jerseyNumber: "asc" }],
            },
          },
        },
      },
    });

    if (!match) return apiError("경기를 찾을 수 없습니다.", 404);

    const mapPlayer = (p: {
      id: bigint;
      jerseyNumber: number | null;
      isStarter: boolean | null;
      position: string | null;
      users: { id: bigint; name: string | null } | null;
    }) => ({
      id: Number(p.id),
      name: p.users?.name ?? "선수",
      jersey_number: p.jerseyNumber,
      is_starter: p.isStarter ?? false,
      position: p.position,
    });

    return apiSuccess({
      home_players: (match.homeTeam?.players ?? []).map(mapPlayer),
      away_players: (match.awayTeam?.players ?? []).map(mapPlayer),
    });
  } catch (err) {
    console.error("[GET /api/v1/matches/[id]/roster]", err);
    return apiError("Internal server error", 500);
  }
}
