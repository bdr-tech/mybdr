"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewGamePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">경기 만들기</h1>
      <Card>
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">경기 제목</label>
            <input type="text" className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="예: 토요일 오후 픽업 경기" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[#A0A0A0]">일시</label>
              <input type="datetime-local" className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#A0A0A0]">장소</label>
              <input type="text" className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="장소 입력" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[#A0A0A0]">최대 인원</label>
              <input type="number" className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="10" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#A0A0A0]">참가비</label>
              <input type="number" className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">설명</label>
            <textarea rows={4} className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="경기 상세 설명" />
          </div>
          <Button className="w-full">경기 만들기</Button>
        </form>
      </Card>
    </div>
  );
}
