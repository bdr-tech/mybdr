"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RegionPicker, type Region } from "@/components/shared/region-picker";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

/** 숫자만 추출 후 000-0000-0000 형식으로 변환 */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/** 포맷된 번호에서 숫자만 추출 */
function stripPhone(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

export default function ProfileCompletePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    position: "",
    height: "",
    weight: "",
    bio: "",
  });
  const [regions, setRegions] = useState<Region[]>([{ city: "", district: "" }]);

  const [generatingBio, setGeneratingBio] = useState(false);

  const togglePosition = (pos: string) => {
    setForm((p) => {
      const selected = p.position ? p.position.split(",") : [];
      const idx = selected.indexOf(pos);
      if (idx >= 0) {
        selected.splice(idx, 1);
      } else {
        selected.push(pos);
      }
      return { ...p, position: selected.join(",") };
    });
  };

  const selectedPositions = form.position ? form.position.split(",") : [];

  const handleGenerateBio = async () => {
    setGeneratingBio(true);
    try {
      const res = await fetch("/api/web/profile/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      const bio = data.bio ?? data.data?.bio;
      if (bio) setForm((p) => ({ ...p, bio }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 자기소개 생성에 실패했습니다.");
    } finally {
      setGeneratingBio(false);
    }
  };

  // 전화번호 인증 상태
  const [verifyStep, setVerifyStep] = useState<"idle" | "sent" | "verified">("idle");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

  const handlePhoneChange = useCallback((value: string) => {
    const formatted = formatPhone(value);
    setForm((p) => ({ ...p, phone: formatted }));
    // 번호 변경 시 인증 초기화
    if (verifyStep !== "idle") {
      setVerifyStep("idle");
      setVerifyCode("");
      setVerifyError("");
    }
  }, [verifyStep]);

  const handleSendCode = async () => {
    const digits = stripPhone(form.phone);
    if (digits.length < 10 || digits.length > 11) {
      setVerifyError("올바른 전화번호를 입력하세요.");
      return;
    }
    setSendingCode(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/web/verify/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "인증번호 발송 실패");
      setVerifyStep("sent");
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verifyCode.length < 4) {
      setVerifyError("인증번호를 입력하세요.");
      return;
    }
    setVerifyError("");
    try {
      const res = await fetch("/api/web/verify/confirm-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: stripPhone(form.phone), code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "인증 실패");
      setVerifyStep("verified");
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "인증에 실패했습니다.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const phoneDigits = stripPhone(form.phone);
      const formattedPhone = phoneDigits ? formatPhone(phoneDigits) : null;

      // 전화번호를 입력했으면 인증 필요
      if (formattedPhone && verifyStep !== "verified") {
        setError("전화번호 인증을 완료해주세요.");
        setSaving(false);
        return;
      }

      const filledRegions = regions.filter((r) => r.city);
      // district가 빈 문자열이면 null로 저장 (필수값이 아니므로)
      const districtValue = filledRegions.map((r) => r.district).filter(Boolean).join(",") || null;
      const payload: Record<string, unknown> = {
        name: form.name || null,
        phone: formattedPhone,
        city: filledRegions.map((r) => r.city).join(",") || null,
        district: districtValue,
        position: form.position || null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        bio: form.bio || null,
        profile_completed: true,
      };

      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      // 프로필 저장 후 맞춤 설정 페이지로 이동 (온보딩 2단계)
      router.push("/profile/complete/preferences");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /* 입력필드/라벨 공통 스타일 - CSS 변수로 다크모드 자동 대응 */
  const inp =
    "w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 text-sm";
  const lbl = "mb-1 block text-sm text-[var(--color-text-muted)]";

  return (
    <div className="mx-auto max-w-lg py-8">
      {/* 환영 메시지 */}
      <div className="mb-8 text-center">
        <div className="mb-3"><svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/><path d="M19.07 4.93A10 10 0 0 1 22 12c0 2.76-1.12 5.26-2.93 7.07"/><path d="M4.93 19.07A10 10 0 0 1 2 12c0-2.76 1.12-5.26 2.93-7.07"/></svg></div>
        <h1 className="text-2xl font-extrabold uppercase tracking-wide text-[var(--color-text-primary)] sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>환영합니다!</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          프로필을 완성하면 더 나은 경험을 제공해드릴 수 있어요.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</div>
      )}

      {/* 기본 정보 */}
      <div className="mb-6 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 font-semibold uppercase tracking-wide text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>기본 정보</h2>
        <div className="space-y-4">
          <div>
            <label className={lbl}>이름 (실명)</label>
            <input
              className={inp}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="홍길동"
            />
          </div>

          {/* 전화번호 + 인증 */}
          <div>
            <label className={lbl}>전화번호</label>
            <div className="flex gap-2">
              <input
                type="tel"
                inputMode="numeric"
                className={`flex-1 rounded-[16px] border bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 text-sm ${
                  verifyStep === "verified" ? "border-[var(--color-success,#34d399)]" : "border-[var(--color-border)]"
                }`}
                value={form.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="01012345678"
                disabled={verifyStep === "verified"}
              />
              {verifyStep !== "verified" && (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || stripPhone(form.phone).length < 10}
                  className="flex-shrink-0 rounded-[10px] bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover,#142D6B)] disabled:opacity-50"
                >
                  {sendingCode ? "발송 중..." : verifyStep === "sent" ? "재발송" : "인증요청"}
                </button>
              )}
            </div>
            {verifyStep === "verified" && (
              <p className="mt-1 px-1 text-xs text-[var(--color-success,#10b981)]">인증 완료</p>
            )}
          </div>

          {/* 인증번호 입력 */}
          {verifyStep === "sent" && (
            <div>
              <label className={lbl}>인증번호</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="flex-1 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 text-sm"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="인증번호 6자리"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifyCode.length < 4}
                  className="flex-shrink-0 rounded-[10px] bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-hover,#C8101E)] disabled:opacity-50"
                >
                  확인
                </button>
              </div>
              {verifyError && <p className="mt-1 px-1 text-xs text-red-500">{verifyError}</p>}
            </div>
          )}

          {verifyStep === "idle" && verifyError && (
            <p className="px-1 text-xs text-red-500">{verifyError}</p>
          )}

          <RegionPicker value={regions} onChange={setRegions} max={3} />
        </div>
      </div>

      {/* 경기 정보 */}
      <div className="mb-6 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 font-semibold uppercase tracking-wide text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>경기 정보</h2>
        <div className="space-y-4">
          <div>
            <label className={lbl}>포지션 <span className="text-xs text-[var(--color-text-secondary)]">(복수 선택 가능)</span></label>
            <div className="flex gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePosition(pos)}
                  className={`flex-1 rounded-full border py-2 text-sm font-medium transition-colors ${
                    selectedPositions.includes(pos)
                      ? "border-[var(--color-accent)] bg-[rgba(27,60,135,0.12)] text-[var(--color-accent)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]"
                  }`}
                  style={{ borderRadius: "10px" }}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>키 (cm)</label>
              <input
                type="number"
                className={inp}
                value={form.height}
                onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
                placeholder="예: 180"
                min={100}
                max={250}
              />
            </div>
            <div>
              <label className={lbl}>몸무게 (kg)</label>
              <input
                type="number"
                className={inp}
                value={form.weight}
                onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                placeholder="예: 75"
                min={30}
                max={200}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm text-[var(--color-text-muted)]">자기소개</label>
              <button
                type="button"
                onClick={handleGenerateBio}
                disabled={generatingBio}
                className="flex items-center gap-1 rounded-[10px] border border-[var(--color-ai-purple)]/30 px-2.5 py-1.5 text-xs font-medium text-[var(--color-ai-purple)] transition-colors hover:bg-[var(--color-ai-purple)]/10 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-xs ${generatingBio ? "animate-spin" : ""}`}>auto_awesome</span>
                {generatingBio ? "생성 중..." : "AI 자동 작성"}
              </button>
            </div>
            <textarea
              className={inp}
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="간단한 자기소개 (최대 255자)"
              maxLength={255}
            />
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {form.bio.length}/255자 · AI가 내 활동 데이터를 기반으로 작성해줍니다
            </p>
          </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-[10px] bg-[var(--color-accent)] py-4 text-sm font-semibold text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover,#142D6B)] disabled:opacity-60"
        >
          {saving ? "저장 중..." : "프로필 저장하고 시작하기"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full rounded-[10px] border border-[var(--color-border)] py-4 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
        >
          나중에 할게요
        </button>
      </div>

      <div className="h-6" />
    </div>
  );
}
