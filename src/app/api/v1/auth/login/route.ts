import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { generateToken } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/validation/auth";
import { apiSuccess, apiError, validationError, internalError } from "@/lib/api/response";
import { getClientIp } from "@/lib/security/get-client-ip";
import {
  isLoginBlocked,
  recordLoginAttempt,
  clearLoginAttempts,
} from "@/lib/security/login-attempts";

// timing attack 방지용 더미 해시 (bcrypt 12라운드)
const DUMMY_HASH =
  "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.P2PEey";

// FR-020: 로그인 API (인증 불필요)
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationError([{ field: "body", message: "유효하지 않은 값입니다." }]);
    }

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error.issues);
    }

    const { email, password } = result.data;

    // 브루트포스 차단 (email + IP 기준)
    const emailBlocked = await isLoginBlocked(email);
    const ipBlocked = await isLoginBlocked(ip);
    if (emailBlocked || ipBlocked) {
      return apiError("Too many login attempts. Try again later.", 429, "RATE_LIMITED");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // timing attack 방지: user 없어도 반드시 bcrypt 실행
    if (!user || !user.passwordDigest) {
      await bcrypt.compare(password, DUMMY_HASH);
      await recordLoginAttempt(email, ip);
      return apiError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (user.status !== "active") {
      await recordLoginAttempt(email, ip);
      return apiError("Account suspended", 403, "ACCOUNT_SUSPENDED");
    }

    const valid = await bcrypt.compare(password, user.passwordDigest);
    if (!valid) {
      await recordLoginAttempt(email, ip);
      return apiError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    // 로그인 성공: 시도 기록 삭제
    await clearLoginAttempts(email);

    const token = await generateToken(user);

    return apiSuccess({
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.profile_image_url,
        membershipType: user.membershipType,
        isAdmin: user.isAdmin ?? false,
      },
    });
  } catch (error) {
    console.error("[POST /api/v1/auth/login]", error);
    return internalError();
  }
}
