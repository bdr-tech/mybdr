import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { generateToken } from "./jwt";
import { WEB_SESSION_COOKIE } from "./web-session";
import { findUnmatchedReferee, executeMatch } from "@/lib/services/referee-matching";

/**
 * 로그인 성공 후 사전 등록된 심판과 자동 매칭 시도.
 * 이유: 협회가 미리 등록한 심판(unmatched)을 유저 로그인 시 자동 연결하여
 *       유저가 별도 작업 없이 심판 플랫폼을 바로 이용할 수 있게 한다.
 *
 * 중요: 매칭 실패가 로그인을 방해하면 안 됨 — try-catch로 감싸서 에러 시 조용히 무시
 */
async function tryAutoMatch(userId: bigint, name: string | null, phone: string | null) {
  if (!name || !phone) return null;
  try {
    const referee = await findUnmatchedReferee(name, phone);
    if (referee) {
      await executeMatch(referee.id, userId);
      return referee;
    }
  } catch {
    // 매칭 실패는 로그인 실패로 이어지면 안 됨 — 조용히 무시
  }
  return null;
}

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

  // 5. 사전 등록 심판 자동 매칭 시도 (로그인 성공 후, 리다이렉트 전)
  //    유저의 이름+전화번호로 unmatched 심판을 찾아 자동 연결
  await tryAutoMatch(user.id, user.name ?? null, user.phone ?? null);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  // 이메일 또는 전화번호가 없으면 인증 페이지로 (redirect보다 우선)
  const needsEmail = !user.email || user.email.endsWith("@oauth.local");
  const needsPhone = !user.phone;
  if (needsEmail || needsPhone) {
    const missing = [needsEmail && "email", needsPhone && "phone"].filter(Boolean).join(",");
    return Response.redirect(new URL(`/verify?missing=${missing}`, baseUrl));
  }

  // bdr_redirect 쿠키가 있으면 해당 경로로 복귀, 없으면 홈으로
  const redirectPath = cookieStore.get("bdr_redirect")?.value;
  if (redirectPath && redirectPath.startsWith("/") && !redirectPath.startsWith("//")) {
    // 사용한 쿠키는 삭제 (일회용)
    cookieStore.delete("bdr_redirect");
    return Response.redirect(new URL(redirectPath, baseUrl));
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
