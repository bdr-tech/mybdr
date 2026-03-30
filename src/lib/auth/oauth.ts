import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { generateToken } from "./jwt";
import { WEB_SESSION_COOKIE } from "./web-session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
};

interface OAuthProfile {
  provider: string;
  uid: string;
  email?: string | null;
  nickname?: string | null;
  profileImage?: string | null;
  phone?: string | null;
}

/**
 * OAuth 로그인/가입 공통 처리
 * 1. provider+uid로 기존 유저 검색
 * 2. 없으면 email로 검색 (기존 계정 연결)
 * 3. 그래도 없으면 새 유저 생성
 * 4. JWT 발급 + 쿠키 설정
 */
export async function handleOAuthLogin(profile: OAuthProfile): Promise<Response> {
  const { provider, uid, email, nickname, profileImage, phone } = profile;

  // 1. provider+uid로 검색
  let user = await prisma.user.findFirst({
    where: { provider, uid },
  });

  // 2. email로 기존 계정 검색 → OAuth 연결
  if (!user && email) {
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { provider, uid },
      });
    }
  }

  // 3. 새 유저 생성
  if (!user) {
    let finalNickname = nickname || `유저${uid.slice(-6)}`;
    // 닉네임 중복 시 접미사 추가
    const existing = await prisma.user.findFirst({ where: { nickname: finalNickname } });
    if (existing) {
      finalNickname = `${finalNickname}_${Math.random().toString(36).slice(2, 6)}`;
    }

    user = await prisma.user.create({
      data: {
        email: email || `${provider}_${uid}@oauth.local`,
        passwordDigest: "", // OAuth 유저는 비밀번호 없음
        nickname: finalNickname,
        provider,
        uid,
        profile_image_url: profileImage,
        phone,
        status: "active",
      },
    });
  } else {
    // 프로필 이미지/닉네임 업데이트 (없는 경우만)
    const updates: Record<string, string> = {};
    if (!user.profile_image_url && profileImage) updates.profile_image_url = profileImage;
    if (!user.nickname && nickname) {
      const nicknameExists = await prisma.user.findFirst({ where: { nickname } });
      if (!nicknameExists) updates.nickname = nickname;
    }
    if (!user.phone && phone) updates.phone = phone;
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({ where: { id: user.id }, data: updates });
    }
  }

  // 4. JWT + 쿠키
  const token = await generateToken(user);
  const cookieStore = await cookies();
  cookieStore.set(WEB_SESSION_COOKIE, token, COOKIE_OPTIONS);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  // 이메일 또는 전화번호가 없으면 인증 페이지로
  const needsEmail = !user.email || user.email.endsWith("@oauth.local");
  const needsPhone = !user.phone;
  if (needsEmail || needsPhone) {
    const missing = [needsEmail && "email", needsPhone && "phone"].filter(Boolean).join(",");
    return Response.redirect(new URL(`/verify?missing=${missing}`, baseUrl));
  }

  return Response.redirect(new URL("/", baseUrl));
}

/**
 * OAuth 시작 URL 생성
 */
export function getOAuthStartUrl(provider: "kakao" | "naver" | "google"): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const callbackUrl = `${baseUrl}/api/auth/callback/${provider}`;

  if (provider === "kakao") {
    return `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code`;
  }

  if (provider === "naver") {
    const state = Math.random().toString(36).slice(2);
    return `https://nid.naver.com/oauth2.0/authorize?client_id=${process.env.NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&state=${state}`;
  }

  // google
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
}
