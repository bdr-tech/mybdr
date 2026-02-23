import { cookies } from "next/headers";
import { verifyToken, type JwtPayload } from "./jwt";

export const WEB_SESSION_COOKIE = "bdr_session";

/**
 * 서버 컴포넌트 / Server Action에서 현재 로그인 유저를 가져옵니다.
 * httpOnly 쿠키(__Host-bdr_session)에 저장된 JWT를 검증합니다.
 */
export async function getWebSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireWebSession(): Promise<JwtPayload> {
  const session = await getWebSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
