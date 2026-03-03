import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3030";
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;

  // 세션 쿠키 삭제
  cookieStore.delete(WEB_SESSION_COOKIE);

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
            return NextResponse.redirect(kakaoLogoutUrl);
          }
        }
      }
    } catch {
      // 토큰 오류 시 그냥 /login으로
    }
  }

  return NextResponse.redirect(`${baseUrl}/login`);
}
