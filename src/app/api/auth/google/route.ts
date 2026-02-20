import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10분
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
