import { type NextRequest } from "next/server";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { apiSuccess, apiError } from "@/lib/api/response";
import { listMatches, createMatch } from "@/lib/services/match";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/web/tournaments/[id]/matches
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const matches = await listMatches(id);

  return apiSuccess(matches);
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
    return apiError("잘못된 요청입니다.", 400);
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
    return apiError("유효하지 않은 팀 ID입니다.", 400);
  }

  const match = await createMatch({
    tournamentId: id,
    homeTeamId: homeBigInt,
    awayTeamId: awayBigInt,
    roundName: roundName ?? null,
    roundNumber: round_number ? Number(round_number) : null,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    venueName: venue_name ?? null,
  });

  return apiSuccess(match);
}
