import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { verifyToken } from "@/lib/auth/jwt";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function extractSubdomain(hostname: string): string | null {
  // localhost/개발 환경은 서브도메인 없음
  if (hostname === "localhost" || hostname === "127.0.0.1") return null;

  // Vercel 프리뷰/배포 URL은 서브도메인 감지 제외
  if (hostname.endsWith(".vercel.app")) return null;

  // 메인 도메인 설정 (예: mybdr.kr)
  const mainDomain = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
    : null;

  // NEXT_PUBLIC_APP_URL 미설정 시 서브도메인 감지 비활성화
  if (!mainDomain) return null;

  // subdomain.mybdr.kr 형식에서 subdomain 추출
  const parts = hostname.split(".");
  const mainParts = mainDomain.split(".");

  if (parts.length > mainParts.length) {
    const subdomain = parts[0];
    // www, api 등 예약어 제외
    if (["www", "api", "admin"].includes(subdomain)) return null;
    return subdomain;
  }

  return null;
}

// 인증 불필요한 API 경로
const PUBLIC_API_ROUTES = [
  "/api/v1/auth/login",
  "/api/v1/site-templates",
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

function getRateLimitConfig(pathname: string) {
  if (pathname.includes("/auth/login")) return RATE_LIMITS.login;
  if (pathname.includes("/subdomain")) return RATE_LIMITS.subdomain;
  if (pathname.includes("/admin")) return RATE_LIMITS.admin;
  return RATE_LIMITS.api;
}

export async function proxy(req: NextRequest) {
  const { pathname, hostname } = req.nextUrl;

  // 1. Rate Limiting (모든 API 요청)
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(req);
    const config = getRateLimitConfig(pathname);
    const result = checkRateLimit(`${ip}:${pathname}`, config);

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMITED" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((result.resetAt - Date.now()) / 1000)
            ),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // 2. 서브도메인 감지 → 토너먼트 사이트 라우팅
  const subdomain = extractSubdomain(hostname);
  if (subdomain) {
    const url = req.nextUrl.clone();
    // (site) 라우트 그룹으로 리라이트
    url.pathname = `/_site${pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-tournament-subdomain", subdomain);
    return response;
  }

  // 3. API JWT 인증
  if (pathname.startsWith("/api/v1") && !isPublicApiRoute(pathname)) {
    // OPTIONS (CORS preflight) 허용
    if (req.method === "OPTIONS") {
      return NextResponse.next();
    }

    const authHeader = req.headers.get("authorization");
    const token =
      authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader?.startsWith("Token ")
          ? authHeader.slice(6)
          : null;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token expired", code: "TOKEN_EXPIRED" },
        { status: 401 }
      );
    }

    // 유저 정보를 헤더에 주입 → API Route에서 사용
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.sub);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
