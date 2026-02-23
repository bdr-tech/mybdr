"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="mt-1 text-sm text-[#6B7280]">BDR에 가입하고 농구를 즐기세요</p>
        </div>

        {/* Google 회원가입 */}
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
          Google로 시작하기
        </a>

        <p className="mt-6 text-center text-sm text-[#6B7280]">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-[#F4A261] hover:underline">로그인</Link>
        </p>
      </Card>
    </div>
  );
}
