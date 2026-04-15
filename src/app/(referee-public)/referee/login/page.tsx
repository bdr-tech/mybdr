"use client";

// 심판 전용 로그인 페이지 (/referee/login)
// - 기존 (web)/login 페이지의 구조/로직을 재사용하되, 브랜딩을 "심판/경기원 플랫폼"으로 변경
// - OAuth/이메일 로그인 후 항상 /referee 로 복귀하도록 redirect 를 /referee 로 고정
// - signupAction, loginAction 은 기존 actions/auth.ts 로직 그대로 재사용

import { useState, useActionState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, devLoginAction } from "@/app/actions/auth";

// OAuth 콜백에서 전달된 에러 코드 → 사용자 메시지 매핑 (기존과 동일)
const OAUTH_ERRORS: Record<string, string> = {
  kakao_token: "카카오 로그인에 실패했습니다.",
  kakao_fail: "카카오 로그인 중 오류가 발생했습니다.",
  naver_token: "네이버 로그인에 실패했습니다.",
  naver_fail: "네이버 로그인 중 오류가 발생했습니다.",
  google_token: "구글 로그인에 실패했습니다.",
  google_fail: "구글 로그인 중 오류가 발생했습니다.",
  no_permission: "해당 페이지에 접근할 권한이 없습니다.",
};

function RefereeLoginContent() {
  // 이메일 로그인 모달 토글
  const [showEmailModal, setShowEmailModal] = useState(false);
  // 비밀번호 표시/숨김 토글
  const [showPassword, setShowPassword] = useState(false);
  // 서버 액션 상태 (로그인/Dev로그인)
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, null);
  const [devState, devFormAction, devPending] = useActionState(devLoginAction, null);
  const searchParams = useSearchParams();

  const oauthError = searchParams.get("error");
  // 복귀 경로: URL ?redirect=... 파라미터가 있으면 사용, 없으면 /referee 로 고정
  // 이유: 이 페이지는 심판 플랫폼 전용 입구이므로 항상 /referee 로 돌려보내는 것이 기본 동작
  const redirectTo = searchParams.get("redirect") ?? "/referee";

  // 모달 열릴 때 body 스크롤 방지 (기존과 동일)
  useEffect(() => {
    if (showEmailModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showEmailModal]);

  return (
    <div className="flex min-h-[100vh] flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* 심판 브랜딩 헤더: 휘슬(sports) 아이콘 + 심판 타이틀 */}
      <div className="mb-6 text-center">
        <div
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--color-primary)", color: "white" }}
        >
          {/* Material Symbols — 휘슬 아이콘 */}
          <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>sports</span>
        </div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
          심판/경기원 플랫폼
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          로그인하여 배정과 정산을 확인하세요
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* OAuth 에러 표시 */}
        {oauthError && OAUTH_ERRORS[oauthError] && (
          <div className="rounded-[4px] px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-error)", color: "white", opacity: 0.9 }}>
            {OAUTH_ERRORS[oauthError]}
          </div>
        )}

        {/* 간편 로그인 카드 */}
        <div className="rounded-[4px] border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-card)" }}>
          <p className="mb-4 text-center text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>간편 로그인</p>
          <div className="flex flex-col gap-2.5">
            {/* 카카오 OAuth — redirect 파라미터로 /referee 강제 */}
            <a
              href={`/api/auth/login?provider=kakao&redirect=${encodeURIComponent(redirectTo)}`}
              className="flex h-12 items-center justify-center gap-2 rounded-[4px] transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FEE500", color: "#191919" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 1C4.58 1 1 3.8 1 7.2c0 2.2 1.46 4.13 3.66 5.23l-.93 3.42c-.08.3.26.54.52.36L8.1 13.6c.3.03.6.05.9.05 4.42 0 8-2.8 8-6.25S13.42 1 9 1" fill="#191919"/></svg>
              <span className="text-sm font-semibold">카카오로 로그인</span>
            </a>
            {/* 네이버 — 준비 중(기존 로그인 페이지와 동일 정책) */}
            <div
              className="flex h-12 items-center justify-center gap-2 rounded-[4px] opacity-40 cursor-not-allowed"
              style={{ backgroundColor: "#03C75A", color: "#FFFFFF" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10.85 8.55L4.92 0H0v16h5.15V7.45L11.08 16H16V0h-5.15v8.55z" fill="white"/></svg>
              <span className="text-sm font-semibold">네이버 (준비 중)</span>
            </div>
            {/* 구글 OAuth */}
            <a
              href={`/api/auth/login?provider=google&redirect=${encodeURIComponent(redirectTo)}`}
              className="flex h-12 items-center justify-center gap-2 rounded-[4px] border transition-colors"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Google로 로그인</span>
            </a>

            {/* 이메일 로그인: 모달 오픈 */}
            <button
              type="button"
              onClick={() => setShowEmailModal(true)}
              className="flex h-12 items-center justify-center gap-2 rounded-[4px] border text-white transition-colors"
              style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 7L2 7" />
              </svg>
              <span className="text-sm font-semibold">이메일 로그인</span>
            </button>
          </div>

          {/* 회원가입 / 비밀번호 찾기 — 심판 전용 회원가입으로 */}
          <div className="mt-4 flex items-center justify-center gap-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <Link href="/referee/signup" className="font-medium">회원가입</Link>
            <span style={{ color: "var(--color-text-muted)" }}>|</span>
            <Link href="/forgot-password" className="font-medium">비밀번호 찾기</Link>
          </div>
        </div>

        {/* Dev 자동 로그인 (프로덕션 제외) */}
        {process.env.NODE_ENV !== "production" && (
          <form action={devFormAction} className="text-center">
            <button type="submit" disabled={devPending}
              className="text-sm underline disabled:opacity-50" style={{ color: "var(--color-text-muted)" }}>
              {devPending ? "..." : "Dev 자동 로그인"}
            </button>
            {devState?.error && <p className="mt-1 text-sm text-red-400">{devState.error}</p>}
          </form>
        )}

        {/* 하단 추가 링크: 일반 로그인으로 */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-xs underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            일반(MyBDR) 로그인으로 이동
          </Link>
        </div>

        <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
          가입 시 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의합니다.
        </p>
      </div>

      {/* 이메일 로그인 모달 — 기존 페이지와 동일 구조 */}
      {showEmailModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEmailModal(false); }}
        >
          <div className="w-full max-w-sm rounded-t-[16px] sm:rounded-[16px] p-6 animate-slide-up sm:animate-fade-in" style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-elevated)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>이메일 로그인</h2>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            {/* 로그인 에러 */}
            {loginState?.error && (
              <div className="mb-3 rounded-[4px] bg-red-500/10 px-3 py-2 text-sm text-red-500">{loginState.error}</div>
            )}

            {/* 로그인 폼: redirect hidden input 으로 복귀 경로 전달 */}
            <form action={loginFormAction} className="space-y-3">
              <input type="hidden" name="redirect" value={redirectTo} />
              <input name="email" type="email" required placeholder="이메일"
                className="w-full rounded-[4px] border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-primary)" }} />
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} required placeholder="비밀번호"
                  className="w-full rounded-[4px] border px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-primary)" }} />
                {/* 비밀번호 보기/숨기기 토글 */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "var(--color-text-muted)" }}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <button type="submit" disabled={loginPending}
                className="w-full rounded-[4px] py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}>
                {loginPending ? "로그인 중..." : "로그인"}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <Link href="/referee/signup" className="font-medium" onClick={() => setShowEmailModal(false)}>회원가입</Link>
              <span style={{ color: "var(--color-text-muted)" }}>|</span>
              <Link href="/forgot-password" className="font-medium" onClick={() => setShowEmailModal(false)}>비밀번호 찾기</Link>
            </div>
          </div>
        </div>
      )}

      {/* 모달 애니메이션 (기존과 동일) */}
      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}

export default function RefereeLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[100vh] items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }} />}>
      <RefereeLoginContent />
    </Suspense>
  );
}
