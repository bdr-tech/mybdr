"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/app/actions/auth";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google 로그인이 취소되었습니다.",
  google_not_configured: "Google 로그인이 아직 설정되지 않았습니다.",
  invalid_state: "보안 검증에 실패했습니다. 다시 시도해주세요.",
  token_exchange: "Google 인증에 실패했습니다. 다시 시도해주세요.",
  userinfo_failed: "Google 계정 정보를 가져오지 못했습니다.",
  server_error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

function GoogleErrorBanner() {
  const params = useSearchParams();
  const errorKey = params.get("error");
  if (!errorKey) return null;
  const msg = GOOGLE_ERROR_MESSAGES[errorKey] ?? "로그인 중 오류가 발생했습니다.";
  return (
    <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">
      {msg}
    </div>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#F4A261]">BDR</h1>
          <p className="mt-1 text-sm text-[#6B7280]">농구 토너먼트 플랫폼</p>
        </div>

        {/* Google OAuth 에러 */}
        <Suspense>
          <GoogleErrorBanner />
        </Suspense>

        {/* 이메일/비밀번호 에러 */}
        {state?.error && (
          <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        {/* Google 로그인 */}
        <a
          href="/api/auth/google"
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-[16px] border border-[#CBD5E1] bg-white px-4 py-3 text-sm font-medium text-[#374151] transition-opacity hover:opacity-90 active:opacity-80"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Google로 로그인
        </a>

        {/* 구분선 */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#CBD5E1]" />
          <span className="text-xs text-[#9CA3AF]">또는</span>
          <div className="h-px flex-1 bg-[#CBD5E1]" />
        </div>

        {/* 이메일/비밀번호 로그인 */}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[#6B7280]">이메일</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#6B7280]">비밀번호</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
              placeholder="비밀번호 입력"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6B7280]">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-[#F4A261] hover:underline">
            회원가입
          </Link>
        </p>
      </Card>
    </div>
  );
}
