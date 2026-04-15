import { NextRequest, NextResponse } from "next/server";
import { getOAuthStartUrl } from "@/lib/auth/oauth";

/**
 * OAuth 로그인 시작점.
 * redirect 쿼리 파라미터가 있으면 쿠키에 저장하여
 * 콜백(handleOAuthLogin)에서 로그인 완료 후 해당 경로로 복귀할 수 있게 한다.
 */

// redirect 경로 검증: 내부 경로만 허용 (외부 URL, 프로토콜 상대 URL 차단)
function isValidRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") as "kakao" | "naver" | "google";
  if (!provider || !["kakao", "naver", "google"].includes(provider)) {
    return Response.json({ error: "Invalid provider" }, { status: 400 });
  }

  const oauthUrl = getOAuthStartUrl(provider);
  const response = NextResponse.redirect(oauthUrl);

  // redirect 파라미터가 유효하면 쿠키에 저장 (5분 TTL)
  const redirectPath = req.nextUrl.searchParams.get("redirect");
  if (redirectPath && isValidRedirect(redirectPath)) {
    response.cookies.set("bdr_redirect", redirectPath, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5분 — OAuth 플로우 완료에 충분한 시간
      path: "/",
    });
  }

  return response;
}
