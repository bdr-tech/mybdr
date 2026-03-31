import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

/**
 * POST /api/web/auth/forgot-password
 * 비밀번호 재설정 토큰을 생성한다.
 * - 이메일로 유저를 찾고, 랜덤 토큰을 DB에 저장한다.
 * - 개발 환경에서는 응답에 토큰을 직접 포함한다 (이메일 발송 미구현).
 */
export async function POST(req: NextRequest) {
  try {
    // 비밀번호 재설정은 남용 위험이 높으므로 rate limit 적용 (login 수준)
    const ip = getClientIp(req);
    const rl = await checkRateLimit(`forgot-pwd:${ip}`, RATE_LIMITS.login);
    if (!rl.allowed) {
      return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
    }

    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();

    // 이메일 형식 기본 검증
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError("유효한 이메일을 입력해주세요.", 400);
    }

    // 해당 이메일의 유저 조회
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    // 유저가 없어도 동일한 응답 (이메일 존재 여부 노출 방지)
    if (!user || user.status === "withdrawn") {
      return apiSuccess({
        message: "해당 이메일로 비밀번호 재설정 안내가 전송되었습니다.",
      });
    }

    // 랜덤 토큰 생성 (64자 hex) + 만료시간 30분
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);

    // DB에 토큰 저장
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires,
      },
    });

    // 개발 환경: 응답에 토큰 포함 (프로덕션에서는 이메일로 발송해야 함)
    const isDev = process.env.NODE_ENV !== "production";
    return apiSuccess({
      message: "해당 이메일로 비밀번호 재설정 안내가 전송되었습니다.",
      ...(isDev && { reset_token: resetToken }),
    });
  } catch {
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}
