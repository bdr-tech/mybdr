import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withValidation, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { duoPairSchema, type DuoPairInput } from "@/lib/validation/duo";

// ---------------------------------------------------------------------------
// PIN 생성 헬퍼: 4자리 숫자, 중복 체크 (최대 10회 재시도)
// ---------------------------------------------------------------------------
async function generateUniquePin(): Promise<string | null> {
  for (let i = 0; i < 10; i++) {
    const pin = String(Math.floor(1000 + Math.random() * 9000)); // 1000~9999
    const existing = await prisma.duoSession.findUnique({ where: { pin } });
    if (!existing) return pin;
  }
  return null;
}

// ---------------------------------------------------------------------------
// POST /api/v1/duo/pair — 호스트가 2인 모드 세션 생성
// ---------------------------------------------------------------------------
async function handlePost(
  _req: NextRequest,
  ctx: { userId: string; userRole: string; payload: AuthContext["payload"]; data: DuoPairInput }
) {
  const { tournament_id, match_id } = ctx.data;
  const hostUserId = BigInt(ctx.userId);

  // 대회 존재 확인
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournament_id },
    select: { id: true },
  });
  if (!tournament) return apiError("Tournament not found", 404, "NOT_FOUND");

  // 경기 존재 확인 (해당 대회 소속)
  const match = await prisma.tournamentMatch.findFirst({
    where: { id: match_id, tournamentId: tournament_id },
    select: { id: true },
  });
  if (!match) return apiError("Match not found in tournament", 404, "NOT_FOUND");

  // 이미 활성 세션이 있는지 확인 (동일 경기에 대해)
  const existingSession = await prisma.duoSession.findFirst({
    where: {
      matchId: BigInt(match_id),
      hostUserId,
      status: { in: ["waiting", "paired", "active"] },
    },
  });
  if (existingSession) {
    return apiSuccess({
      pin: existingSession.pin,
      channel_name: existingSession.channelName,
      host_team: existingSession.hostTeam,
      expires_at: existingSession.expiresAt.toISOString(),
    });
  }

  // PIN 생성
  const pin = await generateUniquePin();
  if (!pin) return apiError("PIN 생성에 실패했습니다. 잠시 후 다시 시도하세요.", 503, "PIN_GENERATION_FAILED");

  const channelName = `duo_${pin}_${match_id}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2시간

  const session = await prisma.duoSession.create({
    data: {
      pin,
      matchId: BigInt(match_id),
      tournamentId: tournament_id,
      hostUserId,
      hostTeam: "home",
      status: "waiting",
      channelName,
      expiresAt,
    },
  });

  return apiSuccess(
    {
      pin: session.pin,
      channel_name: session.channelName,
      host_team: session.hostTeam,
      expires_at: session.expiresAt.toISOString(),
    },
    201
  );
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------
export const POST = withErrorHandler(
  withAuth((req, ctx) =>
    withValidation(duoPairSchema, (r, validatedCtx) =>
      handlePost(r, validatedCtx)
    )(req, ctx)
  )
);
