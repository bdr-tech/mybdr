import { NextRequest } from "next/server";
import { refreshToken } from "@/lib/auth/jwt";
import { apiSuccess, unauthorized, internalError } from "@/lib/api/response";

// FR-012: JWT 토큰 리프레시
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader?.startsWith("Token ")
        ? authHeader.slice(6)
        : null;

    if (!token) return unauthorized();

    const newToken = await refreshToken(token);
    if (!newToken) return unauthorized("Token expired");

    return apiSuccess({ token: newToken });
  } catch (error) {
    console.error("[POST /api/v1/auth/refresh]", error);
    return internalError();
  }
}
