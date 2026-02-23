import { NextRequest, NextResponse } from "next/server";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";

// 임시 테스트용: 세션 쿠키 설정 + 리디렉션 시뮬레이션
// 배포 후 즉시 제거할 것
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (key !== process.env.TEST_SESSION_KEY) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const { generateToken } = await import("@/lib/auth/jwt");

  const fakeUser = {
    id: BigInt(999999),
    email: "sessiontest@mybdr.kr",
    nickname: "세션테스트",
    membershipType: 0,
  };

  const token = await generateToken(fakeUser);
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3030";
  const response = NextResponse.redirect(`${baseUrl}/`);
  response.cookies.set(WEB_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60,
    path: "/",
  });
  return response;
}
