"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createTeamAction } from "@/app/actions/teams";

export default function NewTeamPage() {
  const [state, formAction, pending] = useActionState(createTeamAction, null);

  const isUpgradeRequired = (state as unknown as { error: string; feature?: string } | null)?.error === "UPGRADE_REQUIRED";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">팀 만들기</h1>

      {isUpgradeRequired && (
        <div className="mb-4 rounded-[16px] border border-[#F4A261]/30 bg-[rgba(244,162,97,0.08)] p-4">
          <p className="mb-2 text-sm font-medium text-[#F4A261]">팀 생성은 유료 기능입니다.</p>
          <p className="mb-3 text-xs text-[#A0A0A0]">팀 생성권을 구매하면 최대 2개의 팀을 만들 수 있습니다.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 rounded-[10px] bg-[#F4A261] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#E76F51]"
          >
            요금제 확인하기 →
          </Link>
        </div>
      )}

      <Card>
        {state?.error && !isUpgradeRequired && (
          <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">팀 이름 *</label>
            <input name="name" type="text" required className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="팀 이름" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#A0A0A0]">팀 소개</label>
            <textarea name="description" rows={3} className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="팀 소개" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[#A0A0A0]">대표 색상</label>
              <input name="primary_color" type="color" defaultValue="#F4A261" className="h-12 w-full rounded-[16px] border-none bg-[#2A2A2A] p-1" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#A0A0A0]">보조 색상</label>
              <input name="secondary_color" type="color" defaultValue="#E76F51" className="h-12 w-full rounded-[16px] border-none bg-[#2A2A2A] p-1" />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "생성 중..." : "팀 만들기"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
