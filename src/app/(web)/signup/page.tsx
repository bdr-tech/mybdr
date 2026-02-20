"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signupAction } from "@/app/actions/auth";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, null);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="mt-1 text-sm text-[#A0A0A0]">BDR에 가입하고 농구를 즐기세요</p>
        </div>

        {state?.error && (
          <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">이메일</label>
            <input name="email" type="email" required className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="email@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">닉네임</label>
            <input name="nickname" type="text" required className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="닉네임" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">비밀번호</label>
            <input name="password" type="password" required className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="8자 이상" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">비밀번호 확인</label>
            <input name="password_confirm" type="password" required className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="비밀번호 확인" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "가입 중..." : "가입하기"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#A0A0A0]">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-[#F4A261] hover:underline">로그인</Link>
        </p>
      </Card>
    </div>
  );
}
