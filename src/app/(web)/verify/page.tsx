"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const missing = params.get("missing")?.split(",") ?? [];

  const needsEmail = missing.includes("email");
  const needsPhone = missing.includes("phone");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [step, setStep] = useState<"input" | "verify-phone">("input");
  const [sentCode, setSentCode] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 전화번호 인증 코드 발송 (실제 SMS 연동 전 앱 내 시뮬레이션)
  const sendCode = async () => {
    if (!phone.match(/^01[016789]\d{7,8}$/)) {
      setError("올바른 전화번호를 입력해주세요. (예: 01012345678)");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/web/verify/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setSentCode(data.code ?? ""); // 개발 환경에서는 코드를 반환
        setStep("verify-phone");
      } else {
        setError(data.error ?? "발송 실패");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setSending(false);
    }
  };

  // 인증 코드 확인 + 프로필 저장
  const handleSubmit = async () => {
    if (needsPhone && step === "input") {
      sendCode();
      return;
    }

    if (needsPhone && step === "verify-phone" && verifyCode.length !== 6) {
      setError("6자리 인증 코드를 입력해주세요.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/web/verify/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: needsEmail ? email : undefined,
          phone: needsPhone ? phone : undefined,
          code: needsPhone ? verifyCode : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // M5 온보딩 압축: phone 인증 완료 → 미니멀 옵션 카드로 자연 진입
        // ("지금 채우기"/"나중에" 1클릭으로 홈 도달 가능)
        router.push("/profile/complete");
      } else {
        setError(data.error ?? "저장 실패");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  const skipable = !needsPhone; // 전화번호는 필수, 이메일은 건너뛰기 가능

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>추가 인증이 필요해요</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">서비스 이용을 위해 아래 정보를 인증해주세요.</p>
        </div>

        <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
          {error && (
            <div
              className="mb-4 rounded-[10px] px-3 py-2 text-sm text-[var(--color-error)]"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)" }}
            >
              {error}
            </div>
          )}

          {/* 전화번호 인증 */}
          {needsPhone && step === "input" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">
                  전화번호 <span className="text-[var(--color-primary)]">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="01012345678"
                  maxLength={11}
                  className="w-full rounded-[12px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                />
              </div>
              {needsEmail && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">
                    이메일 <span className="text-xs text-[var(--color-text-muted)]">(선택)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full rounded-[12px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                  />
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={sending || !phone}
                className="w-full rounded-[12px] bg-[var(--color-accent)] py-3 text-sm font-semibold text-[var(--color-on-accent)] transition-all hover:bg-[var(--color-accent-hover)] active:scale-[0.98] disabled:opacity-50"
              >
                {sending ? "발송 중..." : "인증 코드 받기"}
              </button>
            </div>
          )}

          {/* 인증 코드 입력 */}
          {needsPhone && step === "verify-phone" && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-text-muted)]">
                <span className="font-medium text-[var(--color-text-primary)]">{phone}</span>으로 인증 코드를 보냈습니다.
              </p>
              {/* [개발 모드] 인증 코드 노출 박스 — amber 하드코딩 → warning 토큰 (semantic 일치) */}
              {sentCode && (
                <div className="rounded-[10px] bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] px-3 py-2 text-xs text-[var(--color-warning)]">
                  [개발 모드] 인증 코드: <span className="font-bold">{sentCode}</span>
                </div>
              )}
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="6자리 인증 코드"
                maxLength={6}
                className="w-full rounded-[12px] border border-[var(--color-border)] bg-white px-4 py-3 text-center text-lg font-bold tracking-[0.5em] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] placeholder:tracking-normal placeholder:text-sm placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                autoFocus
              />
              <button
                onClick={handleSubmit}
                disabled={saving || verifyCode.length !== 6}
                className="w-full rounded-[12px] bg-[var(--color-accent)] py-3 text-sm font-semibold text-[var(--color-on-accent)] transition-all hover:bg-[var(--color-accent-hover)] active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "확인 중..." : "인증 완료"}
              </button>
              <button
                onClick={() => { setStep("input"); setVerifyCode(""); setSentCode(""); }}
                className="w-full text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                전화번호 다시 입력
              </button>
            </div>
          )}

          {/* 이메일만 필요한 경우 */}
          {!needsPhone && needsEmail && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full rounded-[12px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={saving || !email}
                className="w-full rounded-[12px] bg-[var(--color-accent)] py-3 text-sm font-semibold text-[var(--color-on-accent)] transition-all hover:bg-[var(--color-accent-hover)] active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "저장 중..." : "완료"}
              </button>
            </div>
          )}
        </div>

        {skipable && (
          <button
            onClick={() => router.push("/")}
            className="mt-4 w-full text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          >
            나중에 하기
          </button>
        )}
      </div>
    </div>
  );
}
