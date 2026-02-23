import { describe, it, expect } from "vitest";
import { validationError } from "@/lib/api/response";

describe("Validation Error Sanitization", () => {
  it("Zod 에러 응답이 field와 message만 포함해야 한다", async () => {
    const issues = [
      {
        path: ["email"],
        message: "Invalid email",
        code: "invalid_string",
        // 내부 Zod 상세 필드 (노출 금지)
        validation: "email",
      } as Parameters<typeof validationError>[0][0],
    ];

    const response = validationError(issues);
    const body = await response.json();

    expect(body.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(body.error)).toBe(true);

    const firstError = body.error[0];
    // field와 message만 포함
    expect(firstError).toHaveProperty("field");
    expect(firstError).toHaveProperty("message");
    // 내부 상세 정보 노출 금지
    expect(firstError).not.toHaveProperty("code");
    expect(firstError).not.toHaveProperty("validation");
    expect(firstError).not.toHaveProperty("path");
  });

  it("sanitized 메시지는 일반적인 문구여야 한다", async () => {
    const issues = [
      { path: ["password"], message: "String must contain at least 8 character(s)" } as Parameters<typeof validationError>[0][0],
    ];

    const response = validationError(issues);
    const body = await response.json();

    const firstError = body.error[0];
    // 원본 상세 에러 메시지 노출 금지
    expect(firstError.message).not.toContain("String must contain");
    expect(firstError.message).toBe("유효하지 않은 값입니다.");
  });

  it("HTTP 상태코드가 422여야 한다", async () => {
    const issues = [{ path: ["test"], message: "error" } as Parameters<typeof validationError>[0][0]];
    const response = validationError(issues);
    expect(response.status).toBe(422);
  });
});
