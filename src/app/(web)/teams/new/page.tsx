"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewTeamPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">팀 만들기</h1>
      <Card>
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">팀 이름</label>
            <input type="text" className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="팀 이름" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">팀 소개</label>
            <textarea rows={3} className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="팀 소개" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[#A0A0A0]">대표 색상</label>
              <input type="color" defaultValue="#F4A261" className="h-12 w-full rounded-[16px] border-none bg-[#2A2A2A] p-1" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#A0A0A0]">보조 색상</label>
              <input type="color" defaultValue="#E76F51" className="h-12 w-full rounded-[16px] border-none bg-[#2A2A2A] p-1" />
            </div>
          </div>
          <Button className="w-full">팀 만들기</Button>
        </form>
      </Card>
    </div>
  );
}
