import { NextResponse } from "next/server";
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

export function validationError(issues: unknown) {
  return NextResponse.json(
    { error: issues, code: "VALIDATION_ERROR" },
    { status: 400 }
  );
}

export function rateLimited() {
  return apiError("Too many requests", 429, "RATE_LIMITED");
}

export function internalError() {
  return apiError("Internal server error", 500, "INTERNAL_ERROR");
}
