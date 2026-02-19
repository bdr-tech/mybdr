"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Rails tournament_admin/tournaments#wizard — 5단계 위자드
const steps = [
  { id: "template", label: "템플릿", icon: "🎨" },
  { id: "info", label: "기본 정보", icon: "📝" },
  { id: "url", label: "URL 설정", icon: "🔗" },
  { id: "design", label: "디자인", icon: "🎨" },
  { id: "preview", label: "미리보기", icon: "👁" },
];

export default function TournamentWizardPage() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">대회 생성 위자드</h1>

      {/* Step Indicator */}
      <div className="mb-8 flex gap-1 overflow-x-auto">
        {steps.map((step, i) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(i)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              i === currentStep
                ? "bg-[#F4A261] font-semibold text-[#0A0A0A]"
                : i < currentStep
                  ? "bg-[rgba(74,222,128,0.2)] text-[#4ADE80]"
                  : "bg-[#252525] text-[#A0A0A0]"
            }`}
          >
            <span>{step.icon}</span>
            {step.label}
          </button>
        ))}
      </div>

      <Card className="min-h-[300px]">
        {currentStep === 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold">템플릿 선택</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {["기본형", "리그형", "토너먼트형"].map((t) => (
                <div key={t} className="cursor-pointer rounded-[16px] border border-[#2A2A2A] p-6 text-center hover:border-[#F4A261] transition-colors">
                  <div className="mb-2 text-2xl">🏆</div>
                  <p className="font-medium">{t}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">기본 정보</h2>
            <input type="text" className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="대회 이름" />
            <select className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50">
              <option>싱글 엘리미네이션</option><option>라운드 로빈</option><option>그룹 스테이지</option><option>더블 엘리미네이션</option><option>스위스</option>
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="date" className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" />
              <input type="date" className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" />
            </div>
          </div>
        )}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">URL 설정</h2>
            <div className="flex items-center gap-2">
              <input type="text" className="flex-1 rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" placeholder="my-tournament" />
              <span className="text-sm text-[#A0A0A0]">.mybdr.kr</span>
            </div>
          </div>
        )}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">디자인 설정</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-sm text-[#A0A0A0]">대표 색상</label><input type="color" defaultValue="#F4A261" className="h-12 w-full rounded-[16px] border-none bg-[#2A2A2A] p-1" /></div>
              <div><label className="mb-1 block text-sm text-[#A0A0A0]">보조 색상</label><input type="color" defaultValue="#E76F51" className="h-12 w-full rounded-[16px] border-none bg-[#2A2A2A] p-1" /></div>
            </div>
          </div>
        )}
        {currentStep === 4 && (
          <div className="text-center py-8">
            <div className="mb-4 text-4xl">🎉</div>
            <h2 className="text-lg font-semibold">미리보기</h2>
            <p className="mt-2 text-sm text-[#A0A0A0]">대회 설정을 확인하고 생성하세요.</p>
          </div>
        )}
      </Card>

      <div className="mt-4 flex justify-between">
        <Button variant="secondary" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>이전</Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep(currentStep + 1)}>다음</Button>
        ) : (
          <Button>대회 생성</Button>
        )}
      </div>
    </div>
  );
}
