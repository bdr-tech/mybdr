import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withValidation, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess, apiError } from "@/lib/api/response";
import { duoJoinSchema, type DuoJoinInput } from "@/lib/validation/duo";

// ---------------------------------------------------------------------------
// POST /api/v1/duo/join — 게스트가 PIN으로 세션 참가
// ---------------------------------------------------------------------------
async function handlePost(
  _req: NextRequest,
  ctx: { userId: string; userRole: string; payload: AuthContext["payload"]; data: DuoJoinInput }
) {
  const { pin } = ctx.data;
  const guestUserId = BigInt(ctx.userId);

  // 세션 조회
  const session = await prisma.duoSession.findUnique({ where: { pin } });
  if (!session) return apiError("유효하지 않은 PIN입니다", 404, "NOT_FOUND");

  // 만료 확인
  if (session.expiresAt < new Date()) {
    await prisma.duoSession.update({
      where: { id: session.id },
      data: { status: "closed" },
    });
    return apiError("세션이 만료되었습니다", 410, "SESSION_EXPIRED");
  }

  // 호스트가 자기 세션에 참가하는 것 방지
  if (session.hostUserId === guestUserId) {
    return apiError("자신이 생성한 세션에는 참가할 수 없습니다", 400, "SELF_JOIN_NOT_ALLOWED");
  }

  // 상태 확인:
  // - waiting: 정상 참가
  // - paired/active: 같은 게스트면 재참가 허용 (네트워크 끊김 후 재접속), 다른 게스트는 거부
  if (session.status !== "waiting") {
    if (session.guestUserId !== null && session.guestUserId !== guestUserId) {
      return apiError("이미 다른 참가자가 있는 세션입니다", 409, "SESSION_ALREADY_PAIRED");
    }
    // 같은 게스트 재참가 → 그대로 통과
  }

  // 세션 업데이트: waiting → paired
  const updated = await prisma.duoSession.update({
    where: { id: session.id },
    data: {
      guestUserId,
      status: "paired",
    },
  });

  const guestTeam = updated.hostTeam === "home" ? "away" : "home";

  return apiSuccess({
    channel_name: updated.channelName,
    tournament_id: updated.tournamentId,
    match_id: Number(updated.matchId),
    guest_team: guestTeam,
    host_team: updated.hostTeam,
  });
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------
export const POST = withErrorHandler(
  withAuth((req, ctx) =>
    withValidation(duoJoinSchema, (r, validatedCtx) =>
      handlePost(r, validatedCtx)
    )(req, ctx)
  )
);
