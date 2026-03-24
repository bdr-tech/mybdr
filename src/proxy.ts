import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

function extractSubdomain(hostname: string, searchParams?: URLSearchParams): string | null {
  // 개발 환경: ?_sub=rookie 로 서브도메인 시뮬레이션
  if (process.env.NODE_ENV === "development") {
    const devSub = searchParams?.get("_sub");
    if (devSub && !["www", "api", "admin"].includes(devSub)) return devSub;
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") return null;
  if (hostname.endsWith(".vercel.app")) return null;

  const mainDomain = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
    : null;

  if (!mainDomain) return null;

  const parts = hostname.split(".");
  const mainParts = mainDomain.split(".");

  if (parts.length > mainParts.length) {
    const subdomain = parts[0];
    if (["www", "api", "admin"].includes(subdomain)) return null;
    return subdomain;
  }

  return null;
}

const PUBLIC_API_ROUTES = [
  "/api/v1/auth/login",
  "/api/v1/site-templates",
  "/api/v1/tournaments/connect", // 대회 API 토큰 연결 (JWT 불필요, 토큰 자체가 인증)
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
    const result = await checkRateLimit(`${ip}:${pathname}`, config);

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMITED" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
          },
        }
      );
    }

    // API v1 토큰 존재 여부 체크 (early reject)
    if (pathname.startsWith("/api/v1") && !isPublicApiRoute(pathname)) {
      if (req.method !== "OPTIONS") {
        const authHeader = req.headers.get("authorization");
        const hasToken =
          authHeader?.startsWith("Bearer ") || authHeader?.startsWith("Token ");
        if (!hasToken) {
          return NextResponse.json(
            { error: "Unauthorized", code: "UNAUTHORIZED" },
            { status: 401 }
          );
        }
      }
    }

    // Rate Limit 헤더를 NextResponse.next()에 직접 설정하여 반환
    // (await processRequest 패턴은 Next.js 16 proxy에서 블로킹 발생)
    const headers = new Headers();
    headers.set("X-RateLimit-Limit", String(result.limit));
    headers.set("X-RateLimit-Remaining", String(result.remaining));
    headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
    return NextResponse.next({ headers });
  }

  // 페이지 요청: 서브도메인 감지
  const subdomain = extractSubdomain(hostname, req.nextUrl.searchParams);
  if (subdomain) {
    const url = req.nextUrl.clone();
    url.pathname = `/_site${pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-tournament-subdomain", subdomain);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
