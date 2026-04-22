"use client";

// 심판 전용 회원가입 페이지 (/referee/signup)
// - OAuth 3버튼(카카오/구글/네이버 준비 중) + 이메일 가입 폼
// - signupAction 은 기존 actions/auth.ts 그대로 재사용
//   → M5 온보딩 압축 이후: 가입 성공 시 /verify?missing=phone 로 이동 (phone 인증 강제),
//     verify 완료 후 /profile/complete (닉네임/포지션/지역 3필드 압축 폼)으로 이어짐
// - OAuth 경로로 가입 시에만 redirect 쿠키로 /referee 복귀가 동작 (기존 구현 활용)

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signupAction } from "@/app/actions/auth";

const OAUTH_ERRORS: Record<string, string> = {
  kakao_token: "카카오 로그인에 실패했습니다.",
  kakao_fail: "카카오 로그인 중 오류가 발생했습니다.",
  naver_token: "네이버 로그인에 실패했습니다.",
  naver_fail: "네이버 로그인 중 오류가 발생했습니다.",
  google_token: "구글 로그인에 실패했습니다.",
  google_fail: "구글 로그인 중 오류가 발생했습니다.",
};

function RefereeSignupContent() {
  // 회원가입 서버 액션 상태
  const [state, formAction, pending] = useActionState(signupAction, null);
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  // OAuth 성공 후 /referee 로 복귀하도록 redirect 파라미터 주입
  const redirectTo = "/referee";

  return (
    <div className="flex min-h-[100vh] flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* 심판 브랜딩 헤더 */}
      <div className="mb-6 text-center">
        <div
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--color-primary)", color: "white" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>sports</span>
        </div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          심판/경기원 가입
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          같은 아이디로 MyBDR도 이용 가능합니다
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* OAuth 에러 */}
        {oauthError && OAUTH_ERRORS[oauthError] && (
          <div className="rounded-[4px] px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-error)", color: "white", opacity: 0.9 }}>
            {OAUTH_ERRORS[oauthError]}
          </div>
        )}

        {/* 안내 박스: 협회 사전 등록 자동 매칭 설명 */}
        <div
          className="rounded-[4px] border px-4 py-3 text-xs leading-relaxed"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-secondary)" }}
        >
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--color-info, var(--color-primary))" }}>info</span>
            <span>
              협회 관리자가 이미 등록한 경우, 가입 후 자동으로 심판 자격이 부여됩니다.
            </span>
          </div>
        </div>

        {/* 간편 가입 카드 (OAuth) */}
        <div className="rounded-[4px] border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-card)" }}>
          <p className="mb-4 text-center text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>간편 가입</p>
          <div className="flex flex-col gap-2.5">
            {/* 카카오 — redirect 로 /referee 로 복귀 */}
            <a
              href={`/api/auth/login?provider=kakao&redirect=${encodeURIComponent(redirectTo)}`}
              className="flex h-12 items-center justify-center gap-2 rounded-[4px] transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FEE500", color: "#191919" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 1C4.58 1 1 3.8 1 7.2c0 2.2 1.46 4.13 3.66 5.23l-.93 3.42c-.08.3.26.54.52.36L8.1 13.6c.3.03.6.05.9.05 4.42 0 8-2.8 8-6.25S13.42 1 9 1" fill="#191919"/></svg>
              <span className="text-sm font-semibold">카카오로 시작하기</span>
            </a>
            {/* 네이버 — 준비 중 */}
            <div
              className="flex h-12 items-center justify-center gap-2 rounded-[4px] opacity-40 cursor-not-allowed"
              style={{ backgroundColor: "#03C75A", color: "#FFFFFF" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10.85 8.55L4.92 0H0v16h5.15V7.45L11.08 16H16V0h-5.15v8.55z" fill="white"/></svg>
              <span className="text-sm font-semibold">네이버 (준비 중)</span>
            </div>
            {/* 구글 */}
            <a
              href={`/api/auth/login?provider=google&redirect=${encodeURIComponent(redirectTo)}`}
              className="flex h-12 items-center justify-center gap-2 rounded-[4px] border"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Google로 시작하기</span>
            </a>
          </div>
        </div>

        {/* 이메일 가입 카드 — signupAction 재사용 */}
        <div className="rounded-[4px] border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-card)" }}>
          <p className="mb-4 text-center text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>이메일로 가입</p>

          {/* 서버 액션 에러 메시지 — 하드코딩 red-500 → CSS 변수 토큰 (bg: color-mix 10%, text: error) */}
          {state?.error && (
            <div className="mb-3 rounded-[4px] bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-error)]">{state.error}</div>
          )}

          <form action={formAction} className="space-y-3">
            <input
              name="email"
              type="email"
              required
              placeholder="이메일"
              className="w-full rounded-[4px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-primary)" }}
            />
            <input
              name="nickname"
              type="text"
              required
              minLength={2}
              maxLength={20}
              placeholder="닉네임 (2~20자)"
              className="w-full rounded-[4px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-primary)" }}
            />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="비밀번호 (8자 이상, 영문+숫자+특수문자)"
              className="w-full rounded-[4px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-primary)" }}
            />
            <input
              name="password_confirm"
              type="password"
              required
              minLength={8}
              placeholder="비밀번호 확인"
              className="w-full rounded-[4px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-primary)" }}
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-[4px] py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {pending ? "가입 중..." : "가입하기"}
            </button>
          </form>
        </div>

        {/* 하단 링크: 이미 계정 있음 → 로그인, 일반 가입 페이지 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>이미 계정이 있으신가요?</span>
            <Link href="/referee/login" className="font-medium" style={{ color: "var(--color-primary)" }}>로그인</Link>
          </div>
          <Link
            href="/signup"
            className="text-xs underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            일반(MyBDR) 회원가입으로 이동
          </Link>
        </div>

        <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
          가입 시 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의합니다.
        </p>
      </div>
    </div>
  );
}

export default function RefereeSignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[100vh] items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }} />}>
      <RefereeSignupContent />
    </Suspense>
  );
}
