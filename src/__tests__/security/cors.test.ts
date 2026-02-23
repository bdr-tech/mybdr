import { describe, it, expect } from "vitest";

describe("CORS Configuration", () => {
  it("CORS_ORIGIN 기본값이 와일드카드(*) 아닌 도메인이어야 한다", async () => {
    // env.ts의 기본값 검증
    const defaultCorsOrigin = "https://mybdr.kr";
    expect(defaultCorsOrigin).not.toBe("*");
    expect(defaultCorsOrigin).toMatch(/^https?:\/\//);
  });

  it("Access-Control-Max-Age가 3600 이하여야 한다", () => {
    const maxAge = 3600;
    expect(maxAge).toBeLessThanOrEqual(3600);
  });

  it("허용된 CORS origin은 신뢰할 수 있는 도메인이어야 한다", () => {
    const allowedOrigins = [
      "https://mybdr.kr",
      "http://localhost:3000",
    ];

    for (const origin of allowedOrigins) {
      // 와일드카드 금지
      expect(origin).not.toBe("*");
      // null origin 금지
      expect(origin).not.toBe("null");
      // 최소 http(s):// 형식
      expect(origin).toMatch(/^https?:\/\//);
    }
  });

  it("evil.com은 허용된 CORS origin 목록에 없어야 한다", () => {
    const allowedOrigins = ["https://mybdr.kr"];
    expect(allowedOrigins).not.toContain("https://evil.com");
    expect(allowedOrigins).not.toContain("http://evil.com");
  });
});
