import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { generateToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30일
  path: "/",
};

interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    email?: string;
    email_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3030";
  const redirectTo = (path: string) => NextResponse.redirect(`${baseUrl}${path}`);

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("[OAuth] Kakao returned error:", error);
    return redirectTo(`/login?error=${error === "access_denied" ? "kakao_denied" : "kakao_error"}`);
  }
  if (!code) {
    // 카카오 로그아웃 후 리다이렉트된 경우 — 에러 없이 로그인 페이지로 이동
    return redirectTo("/login");
  }

  // CSRF 검증
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!savedState || savedState !== state) {
    return redirectTo("/login?error=invalid_state");
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/kakao/callback`;

    // 코드 → 액세스 토큰 교환
    const tokenParams: Record<string, string> = {
      code,
      client_id: process.env.KAKAO_CLIENT_ID!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    };
    const kakaoSecret = process.env.KAKAO_CLIENT_SECRET;
    if (kakaoSecret && kakaoSecret !== "placeholder") {
      tokenParams.client_secret = kakaoSecret;
    }
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(tokenParams),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[OAuth] Kakao token exchange failed:", errText);
      return redirectTo("/login?error=token_exchange");
    }

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("[OAuth] Kakao token data error:", tokenData.error, tokenData.error_description);
      return redirectTo("/login?error=token_data_error");
    }
    const accessToken = tokenData.access_token as string;
    if (!accessToken) {
      console.error("[OAuth] No access_token from Kakao. Keys:", Object.keys(tokenData).join(", "));
      return redirectTo("/login?error=no_access_token");
    }

    // 유저 정보 조회
    const userInfoRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      console.error("[OAuth] Kakao userinfo failed:", userInfoRes.status, await userInfoRes.text());
      return redirectTo("/login?error=userinfo_failed");
    }

    const kakaoUser = (await userInfoRes.json()) as KakaoUserInfo;
    const kakaoId = kakaoUser.id.toString();
    const email = kakaoUser.kakao_account?.email ?? null;
    const nickname = kakaoUser.kakao_account?.profile?.nickname ?? null;
    const picture = kakaoUser.kakao_account?.profile?.profile_image_url ?? null;

    // 유저 조회: kakao uid → email 순
    let user = await prisma.user.findFirst({
      where: { provider: "kakao", uid: kakaoId },
    });

    if (!user) {
      if (email) {
        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
          // 기존 이메일 계정에 카카오 연동
          user = await prisma.user.update({
            where: { id: existing.id },
            data: {
              provider: "kakao",
              uid: kakaoId,
              oauth_token: accessToken,
              profile_image_url: picture,
              last_login_at: new Date(),
              updatedAt: new Date(),
            },
          });
        } else {
          // 신규 유저 생성 (이메일 있는 경우)
          user = await prisma.user.create({
            data: {
              email,
              name: nickname ?? email.split("@")[0],
              nickname: nickname ?? email.split("@")[0],
              passwordDigest: "",
              provider: "kakao",
              uid: kakaoId,
              oauth_token: accessToken,
              profile_image_url: picture,
              status: "active",
              last_login_at: new Date(),
            },
          });
        }
      } else {
        // 이메일 없는 경우 kakaoId 기반으로 신규 생성
        const fallbackNickname = nickname ?? `kakao_${kakaoId}`;
        user = await prisma.user.create({
          data: {
            email: `kakao_${kakaoId}@kakao.local`,
            name: fallbackNickname,
            nickname: fallbackNickname,
            passwordDigest: "",
            provider: "kakao",
            uid: kakaoId,
            oauth_token: accessToken,
            profile_image_url: picture,
            status: "active",
            last_login_at: new Date(),
          },
        });
      }
    } else {
      // 기존 카카오 유저: 토큰 갱신
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

    // JWT 발급 후 쿠키를 redirect 응답에 직접 설정
    const token = await generateToken(user);
    const response = NextResponse.redirect(`${baseUrl}/`);
    response.cookies.set(WEB_SESSION_COOKIE, token, COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error("[OAuth] Kakao callback error:", String(err));
    return redirectTo("/login?error=server_error");
  }
}
