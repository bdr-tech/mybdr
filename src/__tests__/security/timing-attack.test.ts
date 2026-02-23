import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// timing attack 방지 로직 단독 검증
describe("Timing Attack Prevention", () => {
  const DUMMY_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.P2PEey";

  it("DUMMY_HASH는 유효한 bcrypt 해시 형식이어야 한다", () => {
    expect(DUMMY_HASH).toMatch(/^\$2[ab]\$\d{2}\$/);
  });

  it("bcrypt.compare는 user 없을 때 항상 false 반환 (timing 일관성)", async () => {
    const result = await bcrypt.compare("anypassword", DUMMY_HASH);
    // 더미 해시는 어떤 비밀번호와도 매칭되지 않아야 함
    expect(result).toBe(false);
  });

  it("user 없을 때 bcrypt.compare 실행 시간이 측정 가능해야 한다", async () => {
    const start = Date.now();
    await bcrypt.compare("testpassword", DUMMY_HASH);
    const elapsed = Date.now() - start;
    // bcrypt 12라운드: 최소 50ms 이상 소요 (timing 공격 방지 효과 확인)
    expect(elapsed).toBeGreaterThan(50);
  });
});
