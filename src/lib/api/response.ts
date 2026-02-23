import { NextResponse } from "next/server";
import { ZodIssue } from "zod";
import { convertKeysToSnakeCase } from "@/lib/utils/case";

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json(convertKeysToSnakeCase(data), { status });
}

export function apiError(
  error: string,
  status: number,
  code?: string
) {
  return NextResponse.json(
    { error, ...(code && { code }) },
    { status }
  );
}

export function unauthorized(message = "Unauthorized") {
  return apiError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden") {
  return apiError(message, 403, "FORBIDDEN");
}

export function notFound(message = "Not found") {
  return apiError(message, 404, "NOT_FOUND");
}

// Zod 에러 sanitization: 내부 스키마 상세 숨김
export function validationError(issues: ZodIssue[] | { field?: string; message: string }[]) {
  const sanitized = (issues as Array<{ path?: (string | number)[]; message: string; field?: string }>).map((e) => ({
    field: e.field ?? (e.path ? e.path.join(".") : ""),
    message: "유효하지 않은 값입니다.",
  }));
  return NextResponse.json(
    { error: sanitized, code: "VALIDATION_ERROR" },
    { status: 422 }
  );
}

export function rateLimited() {
  return apiError("Too many requests", 429, "RATE_LIMITED");
}

export function internalError() {
  return apiError("Internal server error", 500, "INTERNAL_ERROR");
}
