import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";
import { extractToken } from "@/lib/api/middleware";
import { unauthorized, forbidden, notFound } from "@/lib/api/response";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";

export interface RecorderContext {
  userId: bigint;
  tournamentId: string;
  matchId: bigint;
}

/**
 * 기록원 권한 검증 미들웨어
 * - JWT 인증 확인
 * - tournament_recorders 테이블에서 활성 기록원 여부 확인 (주최자도 허용)
 * - 매치가 존재하는지 확인
 */
export async function requireRecorder(
  req: NextRequest,
  matchIdStr: string
): Promise<NextResponse | RecorderContext> {
  const token = extractToken(req);
  if (!token) return unauthorized();

  const payload = await verifyToken(token);
  if (!payload) return unauthorized("Token expired");

  const matchId = parseBigIntParam(matchIdStr);
  if (matchId === null) return notFound("경기를 찾을 수 없습니다.");

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { tournamentId: true },
  });
  if (!match) return notFound("경기를 찾을 수 없습니다.");

  const userId = BigInt(payload.sub);

  // super_admin은 항상 허용
  if (payload.role !== "super_admin") {
    // 주최자 확인
    const isOrganizer = await prisma.tournament.findFirst({
      where: { id: match.tournamentId, organizerId: userId },
      select: { id: true },
    });

    if (!isOrganizer) {
      // 기록원 등록 확인
      const recorder = await prisma.tournament_recorders.findFirst({
        where: {
          tournamentId: match.tournamentId,
          recorderId: userId,
          isActive: true,
        },
        select: { id: true },
      });
      if (!recorder) return forbidden("기록원 권한이 없습니다.");
    }
  }

  return { userId, tournamentId: match.tournamentId, matchId };
}
