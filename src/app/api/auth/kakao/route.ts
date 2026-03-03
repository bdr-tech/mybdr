import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.KAKAO_CLIENT_ID;
  if (!clientId || clientId === "placeholder") {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/login?error=kakao_not_configured`
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3030";
  const redirectUri = `${baseUrl}/api/auth/kakao/callback`;

  // CSRF state
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "profile_nickname profile_image account_email",
    state,
  });

  const response = NextResponse.redirect(
    `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
  );
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10분
    path: "/",
  });
  return response;
}
