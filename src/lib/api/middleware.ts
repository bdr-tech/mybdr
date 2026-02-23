import { NextRequest } from "next/server";
import { ZodSchema } from "zod";
import { verifyToken, type JwtPayload } from "@/lib/auth/jwt";
import { hasRole, type Role } from "@/lib/auth/rbac";
import {
  unauthorized,
  forbidden,
  validationError,
  internalError,
} from "./response";

export interface AuthContext {
  userId: string;
  userRole: string;
  payload: JwtPayload;
}

export interface ValidatedContext<T> extends AuthContext {
  data: T;
}

type HandlerWithAuth = (
  req: NextRequest,
  ctx: AuthContext
) => Promise<Response>;

type HandlerWithValidation<T> = (
  req: NextRequest,
  ctx: ValidatedContext<T>
) => Promise<Response>;

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  if (authHeader?.startsWith("Token ")) return authHeader.slice(6);
  return null;
}

export function withAuth(
  handler: HandlerWithAuth,
  options?: { roles?: Role[] }
) {
  return async (req: NextRequest) => {
    // 항상 JWT 토큰 직접 검증 (헤더 스푸핑 방지)
    const token = extractToken(req);
    if (!token) return unauthorized();

    const payload = await verifyToken(token);
    if (!payload) return unauthorized("Token expired");

    const userId = payload.sub;
    const userRole = payload.role;

    if (options?.roles) {
      const allowed = options.roles.some((role) => hasRole(userRole, role));
      if (!allowed) return forbidden();
    }

    return handler(req, { userId, userRole, payload });
  };
}

export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: HandlerWithValidation<T>
) {
  return async (req: NextRequest, ctx: AuthContext) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationError([{ field: "body", message: "유효하지 않은 값입니다." }]);
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      return validationError(result.error.issues);
    }

    return handler(req, { ...ctx, data: result.data });
  };
}

export function withErrorHandler(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      // 내부 에러는 로그만, 상세 정보 절대 노출 금지
      console.error("[API Error]", error instanceof Error ? error.message : "Unknown error");
      return internalError();
    }
  };
}
