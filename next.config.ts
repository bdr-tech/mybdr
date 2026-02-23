import type { NextConfig } from "next";

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
      // nonce 기반으로 교체; 빌드 정적 헤더엔 'self'만
      "script-src 'self' https://accounts.google.com",
      "style-src 'self' 'unsafe-inline'", // Tailwind inline은 불가피
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
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

export default nextConfig;
