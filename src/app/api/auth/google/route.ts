import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === "placeholder") {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/login?error=google_not_configured`
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3030";
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // CSRF state
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  // oauth_state 쿠키를 redirect 응답에 직접 첨부
  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 10, // 10분
    path: "/",
  });
  return response;
}
