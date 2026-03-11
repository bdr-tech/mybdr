import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";

type AuthOk = { userId: bigint; session: { sub: string; role: string } };
type AuthErr = { error: NextResponse };

/** 대회 관리자(주최자 or 관리 멤버) 권한 검증 */
export async function requireTournamentAdmin(
  tournamentId: string
): Promise<AuthOk | AuthErr> {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token)
    return { error: apiError("로그인이 필요합니다.", 401) };

  const session = await verifyToken(token);
  if (!session)
    return { error: apiError("세션이 만료되었습니다.", 401) };

  const userId = BigInt(session.sub);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { organizerId: true },
  });

  if (!tournament)
    return { error: apiError("대회를 찾을 수 없습니다.", 404) };

  if (tournament.organizerId !== userId) {
    const member = await prisma.tournamentAdminMember.findFirst({
      where: { tournamentId, userId, isActive: true },
    });
    if (!member)
      return { error: apiError("권한이 없습니다.", 403) };
  }

  return { userId, session };
}

/** 간단한 웹 세션 유저 추출 */
export async function getWebUser(): Promise<{ userId: bigint; sub: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) return null;
  return { userId: BigInt(session.sub), sub: session.sub };
}
