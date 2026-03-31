import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

// ============================================================
// Next.js Edge Middleware — 인증 보호 + admin 권한 체크
//
// 왜 middleware인가?
// - 서버 컴포넌트/API보다 먼저 실행되어, 인증 안 된 요청을 페이지 로드 전에 차단
// - Edge Runtime에서 동작 → 빠르고, 모든 요청에 적용 가능
//
// 동작 방식:
// 1. 로그인 필요 페이지 접근 → 쿠키에 JWT 없으면 /login으로 리다이렉트
// 2. /admin 페이지 접근 → JWT의 role이 super_admin이 아니면 /으로 리다이렉트
// 3. 나머지 페이지 → 통과
// ============================================================

// 쿠키명: 프로덕션에서는 __Host- 접두사로 보안 강화
const isProduction = process.env.NODE_ENV === "production";
const COOKIE_NAME = isProduction ? "__Host-bdr_session" : "bdr_session";

// 로그인이 필요한 경로 목록 (정확히 시작하는 경로)
const PROTECTED_PATHS = [
  "/profile",
  "/notifications",
  "/admin",
];

// admin 전용 경로 (super_admin role만 접근 가능)
const ADMIN_PATHS = ["/admin"];

/**
 * Edge Runtime에서 JWT를 디코딩하여 role을 확인한다.
 * jose 라이브러리는 Edge Runtime 호환이므로 안전하게 사용 가능.
 *
 * 주의: middleware는 DB 접근 불가 → JWT payload만으로 판단
 */
async function getTokenPayload(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as { sub: string; role: string };
  } catch {
    // 만료되었거나 유효하지 않은 토큰 → null 반환
    return null;
  }
}

/**
 * 주어진 pathname이 특정 경로 목록에 해당하는지 확인
 * 예: pathname="/admin/users" → ADMIN_PATHS의 "/admin"과 매칭됨
 */
function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 보호 경로가 아니면 바로 통과
  if (!matchesPath(pathname, PROTECTED_PATHS)) {
    return NextResponse.next();
  }

  // 쿠키에서 JWT 토큰 추출
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    // 토큰 없음 → 로그인 페이지로 리다이렉트 (원래 가려던 경로를 callbackUrl로 전달)
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // JWT 검증 (만료/위조 체크)
  const payload = await getTokenPayload(token);

  if (!payload) {
    // 토큰이 유효하지 않음 → 로그인 페이지로
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // admin 경로 접근 시 role 체크
  if (matchesPath(pathname, ADMIN_PATHS)) {
    if (payload.role !== "super_admin") {
      // 관리자가 아닌 사용자 → 홈으로 리다이렉트
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 인증 통과 → 요청 진행
  return NextResponse.next();
}

// ============================================================
// matcher: middleware가 실행될 경로를 제한
// - _next, api, 정적 파일 등은 제외하여 불필요한 실행 방지
// - 모든 (web) 페이지 경로에만 적용
// ============================================================
export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 적용:
     * - api (API 라우트 — 자체 인증 처리)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico, sw.js, manifest 등 정적 에셋
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|sw\\.js|serwist-|manifest\\.json|images/).*)",
  ],
};
