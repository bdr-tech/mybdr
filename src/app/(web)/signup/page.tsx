"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

// OAuth 에러 메시지 맵: 로그인 페이지와 동일한 패턴
const OAUTH_ERRORS: Record<string, string> = {
  kakao_token: "카카오 로그인에 실패했습니다.",
  kakao_fail: "카카오 로그인 중 오류가 발생했습니다.",
  naver_token: "네이버 로그인에 실패했습니다.",
  naver_fail: "네이버 로그인 중 오류가 발생했습니다.",
  google_token: "구글 로그인에 실패했습니다.",
  google_fail: "구글 로그인 중 오류가 발생했습니다.",
};

export default function SignupPage() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 -mt-8">
      {/* 브랜드 로고 + 타이틀 (로그인 페이지와 동일) */}
      <div className="mb-4 text-center">
        <Image src="/images/logo.png" alt="BDR" width={208} height={104} className="mx-auto mb-2 w-52 h-auto" />
        <p className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          BDR에 가입하고 농구를 즐기세요
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          간편하게 시작할 수 있어요
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* OAuth 에러 메시지 */}
        {oauthError && OAUTH_ERRORS[oauthError] && (
          <div className="rounded-[12px] px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-error)", color: "white", opacity: 0.9 }}>
            {OAUTH_ERRORS[oauthError]}
          </div>
        )}

        {/* 간편 가입 카드: 로그인 페이지와 동일한 스타일 */}
        <div className="rounded-[20px] border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-card)" }}>
          <p className="mb-4 text-center text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>간편 가입</p>
          <div className="flex flex-col gap-2.5">
            {/* 카카오: 브랜드 고유 색상 #FEE500 */}
            <a
              href="/api/auth/login?provider=kakao"
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FEE500", color: "#191919" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 1C4.58 1 1 3.8 1 7.2c0 2.2 1.46 4.13 3.66 5.23l-.93 3.42c-.08.3.26.54.52.36L8.1 13.6c.3.03.6.05.9.05 4.42 0 8-2.8 8-6.25S13.42 1 9 1" fill="#191919"/></svg>
              <span className="text-sm font-semibold">카카오로 시작하기</span>
            </a>
            {/* 네이버: 브랜드 고유 색상 #03C75A */}
            <a
              href="/api/auth/login?provider=naver"
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#03C75A", color: "#FFFFFF" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10.85 8.55L4.92 0H0v16h5.15V7.45L11.08 16H16V0h-5.15v8.55z" fill="white"/></svg>
              <span className="text-sm font-semibold">네이버로 시작하기</span>
            </a>
            {/* 구글: 테두리/배경 CSS 변수 */}
            <a
              href="/api/auth/login?provider=google"
              className="flex h-12 items-center justify-center gap-2 rounded-[12px] border transition-colors"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Google로 시작하기</span>
            </a>
          </div>

          {/* 로그인 링크 */}
          <div className="mt-4 flex items-center justify-center gap-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>이미 계정이 있으신가요?</span>
            <Link href="/login" className="font-medium transition-colors" style={{ color: "var(--color-primary)" }}>로그인</Link>
          </div>
        </div>

        {/* 약관 동의 안내 */}
        <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
          가입 시 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의합니다.
        </p>
      </div>
    </div>
  );
}
