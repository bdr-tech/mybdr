import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// CSP nonce는 middleware(proxy.ts)에서 생성 → x-nonce 헤더로 전달
// 빌드 시점 정적 헤더용 fallback (nonce 없는 경로)
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  {
    // unsafe-eval / unsafe-inline 제거
    // nonce는 proxy.ts에서 동적 주입 (Next.js 15 패턴)
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // TODO: middleware에서 nonce 생성 구현 후 'unsafe-inline' 제거
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://t1.daumcdn.net",
      "style-src 'self' 'unsafe-inline'", // Tailwind inline은 불가피
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-src https://postcode.map.daum.net http://postcode.map.daum.net https://t1.daumcdn.net", // 카카오 우편번호
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Serwist(@serwist/next)가 webpack config를 추가함 → Turbopack이 경고 발생
  // dev는 disable:true로 SW 비활성화, 프로덕션 빌드(webpack)만 Serwist 사용
  // turbopack: {} → "이 설정을 인지했다"고 Next.js에 알림 (경고 억제)
  turbopack: {},
  // 클라이언트 라우터 캐시: 동적 페이지도 30초간 캐시하여 뒤로가기/재방문 즉시 표시
  experimental: {
    staleTimes: {
      dynamic: 30,  // 동적 페이지 30초 캐시 (기본 0)
      static: 300,  // 정적 페이지 5분 캐시 (기본 180)
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // SW는 캐시 금지 (항상 최신 버전 사용)
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/api/v1/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.CORS_ORIGIN || "https://mybdr.kr",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, Token",
          },
          // max-age 86400 → 3600 (1시간)
          { key: "Access-Control-Max-Age", value: "3600" },
        ],
      },
    ];
  },
};

// PWA: Serwist 래퍼 (개발 환경에서는 SW 비활성화 → Turbopack 충돌 방지)
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
