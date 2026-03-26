import { NextRequest } from "next/server";
import { refreshToken } from "@/lib/auth/jwt";
import { apiSuccess, apiError, unauthorized, internalError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

// FR-012: JWT 토큰 리프레시
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`v1-refresh:${ip}`, RATE_LIMITS.auth);
  if (!rl.allowed) return apiError("요청이 너무 많습니다.", 429);

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
