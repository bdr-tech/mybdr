"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { generateToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import {
  isLoginBlocked,
  recordLoginAttempt,
  clearLoginAttempts,
} from "@/lib/security/login-attempts";
import { DUMMY_HASH } from "@/lib/security/constants";

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30일
  path: "/",
};

async function getRequestIp(): Promise<string> {
  // Server Action에서는 headers()로 IP 추출 (Next.js 15: async)
  const headersList = await headers();
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export async function loginAction(_prevState: { error: string } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력하세요." };
  }

  const ip = await getRequestIp();

  try {
    // 브루트포스 차단 (email 기준)
    const emailBlocked = await isLoginBlocked(email);
    const ipBlocked = await isLoginBlocked(ip);
    if (emailBlocked || ipBlocked) {
      return { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요." };
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // timing attack 방지: user 없어도 반드시 bcrypt 실행
    if (!user || !user.passwordDigest) {
      await bcrypt.compare(password, DUMMY_HASH);
      await recordLoginAttempt(email, ip);
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    if (user.status !== "active") {
      await recordLoginAttempt(email, ip);
      return { error: "정지된 계정입니다." };
    }

    const valid = await bcrypt.compare(password, user.passwordDigest);
    if (!valid) {
      await recordLoginAttempt(email, ip);
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    // 로그인 성공: 시도 기록 삭제
    await clearLoginAttempts(email);

    const token = await generateToken(user);
    const cookieStore = await cookies();
    cookieStore.set(WEB_SESSION_COOKIE, token, COOKIE_OPTIONS);
  } catch {
    return { error: "로그인 중 오류가 발생했습니다." };
  }

  redirect("/");
}

export async function signupAction(_prevState: { error: string } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const nickname = formData.get("nickname") as string;
  const password = formData.get("password") as string;
  const passwordConfirm = formData.get("password_confirm") as string;

  if (!email || !nickname || !password || !passwordConfirm) {
    return { error: "모든 항목을 입력하세요." };
  }
  if (nickname.length < 2 || nickname.length > 20) {
    return { error: "닉네임은 2~20자여야 합니다." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return { error: "비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  try {
    // 이메일 중복 확인
    const existingEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingEmail) {
      return { error: "이미 사용 중인 이메일입니다." };
    }

    // 닉네임 중복 확인
    const existingNickname = await prisma.user.findFirst({
      where: { nickname: { equals: nickname, mode: "insensitive" } },
      select: { id: true },
    });
    if (existingNickname) {
      return { error: "이미 사용 중인 닉네임입니다." };
    }

    const passwordDigest = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        nickname,
        passwordDigest,
        status: "active",
      },
    });

    const token = await generateToken(user);
    const cookieStore = await cookies();
    cookieStore.set(WEB_SESSION_COOKIE, token, COOKIE_OPTIONS);
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("Unique constraint")) {
      return { error: "이미 사용 중인 이메일 또는 닉네임입니다." };
    }
    console.error("Signup error:", message);
    return { error: "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  redirect("/profile/complete");
}

export async function devLoginAction(_prevState: { error: string } | null, _formData: FormData) {
  try {
    // DB 첫 번째 active 유저로 자동 로그인
    const user = await prisma.user.findFirst({
      where: { status: "active" },
      orderBy: { id: "asc" },
    });

    if (!user) {
      return { error: "active 유저가 없습니다." };
    }

    const token = await generateToken(user);
    const cookieStore = await cookies();
    cookieStore.set(WEB_SESSION_COOKIE, token, COOKIE_OPTIONS);
  } catch {
    return { error: "Dev 로그인 중 오류가 발생했습니다." };
  }

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(WEB_SESSION_COOKIE);
  redirect("/login");
}
