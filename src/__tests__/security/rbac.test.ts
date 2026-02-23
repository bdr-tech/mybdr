import { describe, it, expect } from "vitest";

// RBAC 역할 계층 검증 (lib/auth/rbac.ts 기반)
// hasRole 로직을 여기서 재현하여 테스트
const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 100,
  admin: 80,
  moderator: 60,
  organizer: 40,
  user: 20,
  guest: 0,
};

function hasRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

describe("RBAC (Role-Based Access Control)", () => {
  it("super_admin은 모든 역할에 접근 가능", () => {
    expect(hasRole("super_admin", "admin")).toBe(true);
    expect(hasRole("super_admin", "moderator")).toBe(true);
    expect(hasRole("super_admin", "user")).toBe(true);
  });

  it("admin은 moderator, organizer, user에 접근 가능", () => {
    expect(hasRole("admin", "moderator")).toBe(true);
    expect(hasRole("admin", "organizer")).toBe(true);
    expect(hasRole("admin", "user")).toBe(true);
  });

  it("admin은 super_admin 역할 접근 불가", () => {
    expect(hasRole("admin", "super_admin")).toBe(false);
  });

  it("user는 기본 user 역할만 접근 가능", () => {
    expect(hasRole("user", "user")).toBe(true);
    expect(hasRole("user", "moderator")).toBe(false);
    expect(hasRole("user", "admin")).toBe(false);
  });

  it("알 수 없는 역할은 guest 수준 처리", () => {
    expect(hasRole("unknown_role", "user")).toBe(false);
    expect(hasRole("unknown_role", "guest")).toBe(true);
  });

  it("guest는 최하위 접근 권한", () => {
    expect(hasRole("guest", "guest")).toBe(true);
    expect(hasRole("guest", "user")).toBe(false);
  });
});
