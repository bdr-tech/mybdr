import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { generateToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // __Host- prefix는 항상 secure 필수
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30일
  path: "/",
};

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3030";
  const redirectTo = (path: string) => NextResponse.redirect(`${baseUrl}${path}`);

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("[OAuth] Google returned error:", error);
    return redirectTo(`/login?error=${error === "access_denied" ? "google_denied" : "google_error"}`);
  }
  if (!code) {
    console.error("[OAuth] No code in callback");
    return redirectTo("/login?error=no_code");
  }

  // CSRF 검증
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!savedState || savedState !== state) {
    return redirectTo("/login?error=invalid_state");
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // 코드 → 액세스 토큰 교환
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[OAuth] Token exchange failed:", errText);
      return redirectTo("/login?error=token_exchange");
    }

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("[OAuth] Token data error:", tokenData.error, tokenData.error_description);
      return redirectTo("/login?error=token_data_error");
    }
    const accessToken = tokenData.access_token as string;
    if (!accessToken) {
      console.error("[OAuth] No access_token in token data. Keys:", Object.keys(tokenData).join(", "));
      return redirectTo("/login?error=no_access_token");
    }
    // 유저 정보 조회
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      console.error("[OAuth] Userinfo failed:", userInfoRes.status, await userInfoRes.text());
      return redirectTo("/login?error=userinfo_failed");
    }

    const googleUser = (await userInfoRes.json()) as GoogleUserInfo;
    const { sub: googleSub, email, name = "", picture = null } = googleUser;

    // 유저 조회: google uid → email 순
    let user = await prisma.user.findFirst({
      where: { provider: "google", uid: googleSub },
    });

    if (!user) {
      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        // 기존 이메일 계정에 Google 연동
        user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            provider: "google",
            uid: googleSub,
            oauth_token: accessToken,
            profile_image_url: picture,
            last_login_at: new Date(),
            updatedAt: new Date(),
          },
        });
      } else {
        // 신규 유저 생성
        const nickname = name || email.split("@")[0];
        user = await prisma.user.create({
          data: {
            email,
            name,
            nickname,
            passwordDigest: "", // OAuth 유저는 비밀번호 없음
            provider: "google",
            uid: googleSub,
            oauth_token: accessToken,
            profile_image_url: picture,
            status: "active",
            last_login_at: new Date(),
          },
        });
      }
    } else {
      // 기존 Google 유저: 토큰 갱신
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          oauth_token: accessToken,
          profile_image_url: picture,
          last_login_at: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // JWT 발급 후 쿠키를 redirect 응답에 직접 설정 (cookies().set()은 redirect에 미적용됨)
    const token = await generateToken(user);
    const response = NextResponse.redirect(`${baseUrl}/`);
    response.cookies.set(WEB_SESSION_COOKIE, token, COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error("[OAuth] Callback error:", String(err));
    return redirectTo("/login?error=server_error");
  }
}
