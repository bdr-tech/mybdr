"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">글쓰기</h1>
      <Card>
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">카테고리</label>
            <select className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50">
              <option value="general">자유게시판</option>
              <option value="info">정보게시판</option>
              <option value="review">후기게시판</option>
              <option value="marketplace">장터게시판</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">제목</label>
            <input type="text" className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="제목 입력" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">내용</label>
            <textarea rows={10} className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="내용 입력" />
          </div>
          <Button className="w-full">작성하기</Button>
        </form>
      </Card>
    </div>
  );
}
