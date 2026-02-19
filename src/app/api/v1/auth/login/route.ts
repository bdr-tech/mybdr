import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { generateToken } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/validation/auth";
import { apiSuccess, apiError, validationError, internalError } from "@/lib/api/response";

// FR-020: 로그인 API (인증 불필요, Rate Limit: 5/분)
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationError([{ message: "Invalid JSON body" }]);
    }

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error.issues);
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordDigest) {
      return apiError("Invalid credentials", 401);
    }

    // status 기반 활성 체크 (Rails: status column)
    if (user.status !== "active") {
      return apiError("Account suspended", 403);
    }

    const valid = await bcrypt.compare(password, user.passwordDigest);
    if (!valid) {
      return apiError("Invalid credentials", 401);
    }

    const token = await generateToken(user);

    return apiSuccess({
      token,
      user: {
        id: user.id.toString(), // BigInt → string
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
