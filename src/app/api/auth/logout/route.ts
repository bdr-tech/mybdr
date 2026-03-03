import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

const CLEAR_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3030";
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;

  // 카카오 유저이면 카카오 세션도 함께 종료
  if (token) {
    try {
      const session = await verifyToken(token);
      if (session) {
        const user = await prisma.user.findUnique({
          where: { id: BigInt(session.sub) },
          select: { provider: true },
        });

        if (user?.provider === "kakao") {
          const clientId = process.env.KAKAO_CLIENT_ID;
          if (clientId && clientId !== "placeholder") {
            const logoutRedirectUri = `${baseUrl}/api/auth/kakao/callback`;
            const kakaoLogoutUrl =
              `https://kauth.kakao.com/oauth/logout` +
              `?client_id=${clientId}` +
              `&logout_redirect_uri=${encodeURIComponent(logoutRedirectUri)}`;
            const kakaoRes = NextResponse.redirect(kakaoLogoutUrl);
            // 세션 쿠키 삭제 — redirect 응답에 직접 설정해야 반영됨
            kakaoRes.cookies.set(WEB_SESSION_COOKIE, "", CLEAR_COOKIE);
            return kakaoRes;
          }
        }
      }
    } catch {
      // 토큰 오류 시 그냥 /login으로
    }
  }

  const response = NextResponse.redirect(`${baseUrl}/login`);
  // 세션 쿠키 삭제 — redirect 응답에 직접 설정해야 반영됨
  response.cookies.set(WEB_SESSION_COOKIE, "", CLEAR_COOKIE);
  return response;
}
