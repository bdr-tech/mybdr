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
 * - JWT 인증 우선, 실패 시 대회 API token으로 폴백
 * - tournament_recorders 테이블에서 활성 기록원 여부 확인 (주최자도 허용)
 * - 매치가 존재하는지 확인
 */
export async function requireRecorder(
  req: NextRequest,
  matchIdStr: string
): Promise<NextResponse | RecorderContext> {
  const token = extractToken(req);
  if (!token) return unauthorized();

  const matchId = parseBigIntParam(matchIdStr);
  if (matchId === null) return notFound("경기를 찾을 수 없습니다.");

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { tournamentId: true },
  });
  if (!match) return notFound("경기를 찾을 수 없습니다.");

  // 1차: JWT 토큰 검증
  const payload = await verifyToken(token);
  if (payload) {
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

  // 2차: 대회 API token 폴백 — JWT가 아닌 경우 대회의 apiToken과 비교
  const tournament = await prisma.tournament.findUnique({
    where: { id: match.tournamentId },
    select: { apiToken: true, organizerId: true },
  });

  if (tournament?.apiToken && tournament.apiToken === token) {
    // API token 일치 → 주최자 권한으로 허용
    return {
      userId: tournament.organizerId,
      tournamentId: match.tournamentId,
      matchId,
    };
  }

  return unauthorized("Token expired or invalid");
}
