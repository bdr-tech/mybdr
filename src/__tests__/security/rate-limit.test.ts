import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

describe("Rate Limit", () => {
  const testIdentifier = `test-ip-${Date.now()}`;

  it("maxRequests 이하 요청은 허용된다", () => {
    const config = { maxRequests: 3, windowMs: 60000 };
    const id = `allow-test-${Date.now()}`;

    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit(id, config);
      expect(result.allowed).toBe(true);
    }
  });

  it("maxRequests 초과 요청은 차단된다", () => {
    const config = { maxRequests: 3, windowMs: 60000 };
    const id = `block-test-${Date.now()}`;

    for (let i = 0; i < 3; i++) {
      checkRateLimit(id, config);
    }

    const blocked = checkRateLimit(id, config);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("remaining 카운트가 정확히 감소한다", () => {
    const config = { maxRequests: 5, windowMs: 60000 };
    const id = `remaining-test-${Date.now()}`;

    const first = checkRateLimit(id, config);
    expect(first.remaining).toBe(4);

    const second = checkRateLimit(id, config);
    expect(second.remaining).toBe(3);
  });

  it("limit 필드가 maxRequests와 일치한다", () => {
    const config = { maxRequests: 10, windowMs: 60000 };
    const id = `limit-test-${Date.now()}`;

    const result = checkRateLimit(id, config);
    expect(result.limit).toBe(10);
  });

  it("RATE_LIMITS 기본값이 정의되어 있다", () => {
    expect(RATE_LIMITS.api).toBeDefined();
    expect(RATE_LIMITS.login).toBeDefined();
    expect(RATE_LIMITS.admin).toBeDefined();
  });
});
