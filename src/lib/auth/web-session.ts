import { cookies } from "next/headers";
import { verifyToken, type JwtPayload } from "./jwt";
import { unauthorized } from "@/lib/api/response";

/**
 * __Host- prefix: Secure + Path=/ + Domain 미설정 필수.
 * localhost(HTTP)에서는 __Host-가 작동하지 않으므로 production에서만 적용.
 */
const isProduction = process.env.NODE_ENV === "production";
export const WEB_SESSION_COOKIE = isProduction
  ? "__Host-bdr_session"
  : "bdr_session";

/**
 * 서버 컴포넌트 / Server Action에서 현재 로그인 유저를 가져옵니다.
 * httpOnly 쿠키에 저장된 JWT를 검증합니다.
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

/**
 * Web API Route용 인증 미들웨어.
 * 쿠키에서 JWT를 꺼내 검증하고, userId(bigint)와 session을 handler에 전달.
 * v1 API용 withAuth(Bearer 토큰)와 동일한 패턴.
 *
 * 사용법:
 *   export const GET = withWebAuth(async (ctx) => { ... });
 *   export const POST = withWebAuth(async (req, ctx) => { ... });
 *   export const PATCH = withWebAuth(async (req, routeCtx, ctx) => { ... });
 */
export interface WebAuthContext {
  userId: bigint;
  session: JwtPayload;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withWebAuth<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): (...args: any[]) => Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]) => {
    const cookieStore = await cookies();
    const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
    if (!token) return unauthorized("로그인이 필요합니다.");

    const session = await verifyToken(token);
    if (!session) return unauthorized("세션이 만료되었습니다.");

    const userId = BigInt(session.sub);
    const ctx: WebAuthContext = { userId, session };

    // handler.length로 원래 핸들러의 파라미터 수를 판별
    // 1 = (ctx), 2 = (req, ctx), 3 = (req, routeCtx, ctx)
    if (handler.length <= 1) {
      return handler(ctx);
    } else if (handler.length === 2) {
      return handler(args[0], ctx);
    } else {
      return handler(args[0], args[1], ctx);
    }
  };
}
