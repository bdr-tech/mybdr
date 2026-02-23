"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPostAction } from "@/app/actions/community";

export default function NewPostPage() {
  const [state, formAction, pending] = useActionState(createPostAction, null);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">글쓰기</h1>
      <Card>
        {state?.error && (
          <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[#6B7280]">카테고리</label>
            <select name="category" className="w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50">
              <option value="general">자유게시판</option>
              <option value="info">정보게시판</option>
              <option value="review">후기게시판</option>
              <option value="marketplace">장터게시판</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#6B7280]">제목 *</label>
            <input name="title" type="text" required className="w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50" placeholder="제목 입력" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#6B7280]">내용 *</label>
            <textarea name="content" rows={10} required className="w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50" placeholder="내용 입력" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "작성 중..." : "작성하기"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
