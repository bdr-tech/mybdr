"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = [
  { id: "template", label: "템플릿", icon: "🎨" },
  { id: "info", label: "기본 정보", icon: "📝" },
  { id: "url", label: "URL 설정", icon: "🔗" },
  { id: "design", label: "디자인", icon: "🎨" },
  { id: "preview", label: "미리보기", icon: "👁" },
];

const FORMAT_OPTIONS = ["싱글 엘리미네이션", "라운드 로빈", "그룹 스테이지", "더블 엘리미네이션", "스위스"];

export default function NewTournamentWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    template: "기본형",
    name: "",
    format: "싱글 엘리미네이션",
    startDate: "",
    endDate: "",
    subdomain: "",
    primaryColor: "#F4A261",
    secondaryColor: "#E76F51",
  });

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/web/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(data.redirectUrl ?? "/tournament-admin/tournaments");
      } else {
        setError(data.error ?? "오류가 발생했습니다.");
        setLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">새 대회 만들기</h1>

      {/* Step Indicator */}
      <div className="mb-8 flex gap-1 overflow-x-auto">
        {steps.map((step, i) => (
          <button
            key={step.id}
            onClick={() => i < currentStep && setCurrentStep(i)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              i === currentStep
                ? "bg-[#F4A261] font-semibold text-[#0A0A0A]"
                : i < currentStep
                  ? "bg-[rgba(74,222,128,0.2)] text-[#4ADE80] cursor-pointer"
                  : "bg-[#252525] text-[#A0A0A0] cursor-not-allowed"
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
                <div
                  key={t}
                  onClick={() => update("template", t)}
                  className={`cursor-pointer rounded-[16px] border p-6 text-center transition-colors ${
                    form.template === t ? "border-[#F4A261] bg-[rgba(244,162,97,0.08)]" : "border-[#2A2A2A] hover:border-[#F4A261]"
                  }`}
                >
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
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50"
              placeholder="대회 이름 *"
            />
            <select
              value={form.format}
              onChange={(e) => update("format", e.target.value)}
              className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50"
            >
              {FORMAT_OPTIONS.map((f) => <option key={f}>{f}</option>)}
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[#A0A0A0]">시작일</label>
                <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#A0A0A0]">종료일</label>
                <input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className="w-full rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">URL 설정 (선택)</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.subdomain}
                onChange={(e) => update("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="flex-1 rounded-[16px] border-none bg-[#2A2A2A] px-4 py-3 text-white placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#F4A261]/50"
                placeholder="my-tournament (영문·숫자·하이픈)"
              />
              <span className="text-sm text-[#A0A0A0]">.mybdr.kr</span>
            </div>
            <p className="text-xs text-[#666666]">비워두면 대회 ID로 접근합니다.</p>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">디자인 설정</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-[#A0A0A0]">대표 색상</label>
                <input type="color" value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="h-12 w-full rounded-[16px] border-none bg-[#2A2A2A] p-1" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#A0A0A0]">보조 색상</label>
                <input type="color" value={form.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} className="h-12 w-full rounded-[16px] border-none bg-[#2A2A2A] p-1" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4 py-4">
            <div className="mb-2 text-center text-4xl">🎉</div>
            <h2 className="text-center text-lg font-semibold">미리보기</h2>
            <div className="rounded-[16px] bg-[#252525] p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#A0A0A0]">대회명</span><span className="font-medium">{form.name || "미입력"}</span></div>
              <div className="flex justify-between"><span className="text-[#A0A0A0]">형식</span><span>{form.format}</span></div>
              <div className="flex justify-between"><span className="text-[#A0A0A0]">기간</span><span>{form.startDate || "-"} ~ {form.endDate || "-"}</span></div>
              <div className="flex justify-between"><span className="text-[#A0A0A0]">URL</span><span>{form.subdomain ? `${form.subdomain}.mybdr.kr` : "자동 생성"}</span></div>
            </div>
            {error && <p className="text-center text-sm text-red-400">{error}</p>}
          </div>
        )}
      </Card>

      <div className="mt-4 flex justify-between">
        <Button
          variant="secondary"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0 || loading}
        >
          이전
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => {
              if (currentStep === 1 && !form.name.trim()) {
                alert("대회 이름을 입력하세요.");
                return;
              }
              setCurrentStep(currentStep + 1);
            }}
          >
            다음
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "생성 중..." : "대회 생성"}
          </Button>
        )}
      </div>
    </div>
  );
}
