"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { generateToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30일
  path: "/",
};

export async function loginAction(_prevState: { error: string } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 입력하세요." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordDigest) {
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }
    if (user.status !== "active") {
      return { error: "정지된 계정입니다." };
    }

    const valid = await bcrypt.compare(password, user.passwordDigest);
    if (!valid) {
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

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

  if (!email || !nickname || !password) {
    return { error: "모든 항목을 입력하세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호가 일치하지 않습니다." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "이미 사용 중인 이메일입니다." };
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
  } catch {
    return { error: "회원가입 중 오류가 발생했습니다." };
  }

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(WEB_SESSION_COOKIE);
  redirect("/login");
}
