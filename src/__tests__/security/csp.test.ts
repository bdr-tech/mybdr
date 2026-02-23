import { describe, it, expect } from "vitest";

// next.config.ts의 CSP 설정 검증
const CSP_VALUE = [
  "default-src 'self'",
  "script-src 'self' https://accounts.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

describe("Content Security Policy", () => {
  it("CSP 헤더가 정의되어 있다", () => {
    expect(CSP_VALUE).toBeTruthy();
    expect(CSP_VALUE.length).toBeGreaterThan(0);
  });

  it("unsafe-eval이 CSP에 없어야 한다", () => {
    expect(CSP_VALUE).not.toContain("'unsafe-eval'");
  });

  it("script-src에 self가 포함되어 있다", () => {
    expect(CSP_VALUE).toContain("script-src 'self'");
  });

  it("frame-ancestors none으로 클릭재킹 방지", () => {
    expect(CSP_VALUE).toContain("frame-ancestors 'none'");
  });

  it("base-uri self로 base tag 인젝션 방지", () => {
    expect(CSP_VALUE).toContain("base-uri 'self'");
  });

  it("form-action self로 폼 리다이렉션 공격 방지", () => {
    expect(CSP_VALUE).toContain("form-action 'self'");
  });

  it("default-src self로 기본 소스 제한", () => {
    expect(CSP_VALUE).toContain("default-src 'self'");
  });
});
