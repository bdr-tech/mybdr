"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

type AuthStatus = "loading" | "unauthenticated" | "unauthorized" | "authorized";

export default function NewTournamentWizardPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
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

  useEffect(() => {
    fetch("/api/web/me")
      .then((res) => {
        if (!res.ok) {
          setAuthStatus("unauthenticated");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const role = (data.role ?? data.data?.role ?? "") as string;
        if (["super_admin", "organizer", "admin", "tournament_admin"].includes(role)) {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
        }
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?redirect=/tournament-admin/tournaments/new/wizard");
    }
  }, [authStatus, router]);

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[#6B7280]">로딩 중...</div>
      </div>
    );
  }

  if (authStatus === "unauthorized") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-bold text-[#111827]">권한이 필요합니다</h1>
        <p className="max-w-md text-sm text-[#6B7280]">
          대회를 만들려면 <strong>대회 관리자</strong> 이상의 권한이 필요합니다.<br />
          운영자에게 문의해주세요.
        </p>
        <Link
          href="/tournaments"
          className="mt-2 rounded-full bg-[#0066FF] px-6 py-2 text-sm font-semibold text-white hover:bg-[#0052CC] transition-colors"
        >
          대회 목록으로 돌아가기
        </Link>
      </div>
    );
  }

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
                ? "bg-[#0066FF] font-semibold text-white"
                : i < currentStep
                  ? "bg-[rgba(74,222,128,0.2)] text-[#4ADE80] cursor-pointer"
                  : "bg-[#EEF2FF] text-[#6B7280] cursor-not-allowed"
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
                    form.template === t ? "border-[#0066FF] bg-[rgba(0,102,255,0.08)]" : "border-[#E8ECF0] hover:border-[#0066FF]"
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
              className="w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
              placeholder="대회 이름 *"
            />
            <select
              value={form.format}
              onChange={(e) => update("format", e.target.value)}
              className="w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
            >
              {FORMAT_OPTIONS.map((f) => <option key={f}>{f}</option>)}
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[#6B7280]">시작일</label>
                <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#6B7280]">종료일</label>
                <input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className="w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50" />
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
                className="flex-1 rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50"
                placeholder="my-tournament (영문·숫자·하이픈)"
              />
              <span className="text-sm text-[#6B7280]">.mybdr.kr</span>
            </div>
            <p className="text-xs text-[#9CA3AF]">비워두면 대회 ID로 접근합니다.</p>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">디자인 설정</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-[#6B7280]">대표 색상</label>
                <input type="color" value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="h-12 w-full rounded-[16px] border-none bg-[#E8ECF0] p-1" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#6B7280]">보조 색상</label>
                <input type="color" value={form.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} className="h-12 w-full rounded-[16px] border-none bg-[#E8ECF0] p-1" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4 py-4">
            <div className="mb-2 text-center text-4xl">🎉</div>
            <h2 className="text-center text-lg font-semibold">미리보기</h2>
            <div className="rounded-[16px] bg-[#EEF2FF] p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#6B7280]">대회명</span><span className="font-medium">{form.name || "미입력"}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">형식</span><span>{form.format}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">기간</span><span>{form.startDate || "-"} ~ {form.endDate || "-"}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">URL</span><span>{form.subdomain ? `${form.subdomain}.mybdr.kr` : "자동 생성"}</span></div>
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
