import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";

/**
 * POST /api/web/logout
 * 웹 프론트에서 호출하는 로그아웃 엔드포인트
 * - 세션 쿠키를 삭제하고 성공 응답 반환
 * - 프론트(layout, slide-menu, profile)에서 POST로 호출
 * - 카카오 연동 로그아웃은 /api/auth/logout (GET)에서 별도 처리
 */
export async function POST() {
  const cookieStore = await cookies();

  // 세션 쿠키 삭제 옵션: maxAge 0으로 즉시 만료
  const clearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  // 기존 쿠키 존재 여부와 무관하게 삭제 시도 (항상 안전)
  cookieStore.set(WEB_SESSION_COOKIE, "", clearOptions);

  return NextResponse.json({ success: true });
}
