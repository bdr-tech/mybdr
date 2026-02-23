"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

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

        {/* Google 로그인 */}
        <a
          href="/api/auth/google"
          className="flex w-full items-center justify-center gap-3 rounded-[16px] border border-[#CBD5E1] bg-white px-4 py-3 text-sm font-medium text-[#374151] transition-opacity hover:opacity-90 active:opacity-80"
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
