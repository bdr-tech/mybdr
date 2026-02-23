"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SiteRegistrationPage() {
  const [step, setStep] = useState<"form" | "done">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    teamName: "",
    captainName: "",
    captainPhone: "",
    captainEmail: "",
    playerCount: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teamName || !form.captainName || !form.captainEmail) {
      setError("팀명, 대표자명, 이메일은 필수 입력 항목입니다.");
      return;
    }
    setSubmitting(true);
    setError("");

    // 현재 서브도메인 추출
    const hostname = window.location.hostname;
    const subdomain = hostname.split(".")[0];

    try {
      const res = await fetch(`/api/site/registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subdomain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "신청 실패");
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50";
  const labelCls = "mb-1 block text-sm text-[#6B7280]";

  if (step === "done") {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <h2 className="mb-2 text-2xl font-bold">신청 완료!</h2>
        <p className="text-[#6B7280]">
          참가 신청이 완료되었습니다. 대회 관계자 검토 후 승인 연락드립니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-6 text-2xl font-bold">참가 신청</h2>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>팀명 *</label>
            <input
              className={inputCls}
              value={form.teamName}
              onChange={(e) => set("teamName", e.target.value)}
              placeholder="참가 팀 이름"
              required
            />
          </div>

          <div>
            <label className={labelCls}>대표자 이름 *</label>
            <input
              className={inputCls}
              value={form.captainName}
              onChange={(e) => set("captainName", e.target.value)}
              placeholder="연락 담당자 이름"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>이메일 *</label>
              <input
                type="email"
                className={inputCls}
                value={form.captainEmail}
                onChange={(e) => set("captainEmail", e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>
            <div>
              <label className={labelCls}>연락처</label>
              <input
                type="tel"
                className={inputCls}
                value={form.captainPhone}
                onChange={(e) => set("captainPhone", e.target.value)}
                placeholder="010-0000-0000"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>예상 선수 인원</label>
            <input
              type="number"
              className={inputCls}
              value={form.playerCount}
              onChange={(e) => set("playerCount", e.target.value)}
              placeholder="예: 10"
              min={1}
              max={30}
            />
          </div>

          <div>
            <label className={labelCls}>남기실 말씀</label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="문의사항이나 특이사항을 입력해 주세요."
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "신청 중..." : "참가 신청하기"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
