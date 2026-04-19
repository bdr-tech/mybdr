"use client";

// M5 온보딩 압축:
// - 기존 7필드(이름/전화번호+인증/지역/포지션/키/몸무게/자기소개) → 3필드(닉네임/포지션/지역)로 축소
// - 전화번호 인증은 가입 직후 /verify?missing=phone 단계에서 별도 처리되므로 여기서는 받지 않음
// - 키/몸무게/자기소개/이름은 /profile/edit 등 마이페이지에서 추후 보완 가능 (게임 신청 가드와 무관)
// - profile_completed 필드는 의도적으로 보내지 않음 → 게임 신청 시 기존 가드(src/lib/profile/completion.ts)가 자연스럽게 동작
// - 옵션 카드 2개("지금 채우기" / "나중에 할게요")로 사용자 선택권을 명시적으로 노출

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RegionPicker, type Region } from "@/components/shared/region-picker";

// 농구 5포지션 — 복수 선택 가능
const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

export default function ProfileCompletePage() {
  const router = useRouter();

  // 단계 관리: "choose" = 옵션 선택 카드, "fill" = 3필드 입력 폼
  // 가입 직후 사용자에게 "지금/나중" 선택권을 먼저 보여주기 위함
  const [step, setStep] = useState<"choose" | "fill">("choose");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 닉네임 prefill: 가입 시 입력한 값을 GET /api/web/profile 로 미리 채워줌
  // 사용자 입장에서는 "이미 입력한 닉네임을 또 묻지 않는" UX
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState(""); // CSV 형식 ("PG,SG")
  const [regions, setRegions] = useState<Region[]>([{ city: "", district: "" }]);

  // 마운트 시 기존 닉네임 prefill (서버 가입 직후엔 이미 닉네임이 저장돼 있음)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/web/profile");
        if (!res.ok) return;
        const data = await res.json();
        // apiSuccess 응답은 snake_case로 직렬화됨 (raw fetch이므로 변환 없음)
        const u = data?.user;
        if (cancelled || !u) return;
        if (u.nickname) setNickname(u.nickname);
        if (u.position) setPosition(u.position);
        // 지역 prefill: city/district는 CSV(쉼표 구분) 저장 형식
        if (u.city) {
          const cities = String(u.city).split(",");
          const districts = String(u.district ?? "").split(",");
          const restored: Region[] = cities.map((c, i) => ({
            city: c.trim(),
            district: (districts[i] ?? "").trim(),
          })).filter((r) => r.city);
          if (restored.length > 0) setRegions(restored);
        }
      } catch {
        // prefill 실패는 치명적이지 않음 — 빈 폼으로 진행
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 포지션 토글 (복수 선택)
  const togglePosition = (pos: string) => {
    const selected = position ? position.split(",") : [];
    const idx = selected.indexOf(pos);
    if (idx >= 0) selected.splice(idx, 1);
    else selected.push(pos);
    setPosition(selected.join(","));
  };
  const selectedPositions = position ? position.split(",") : [];

  // 저장: 3필드만 PATCH. profile_completed 의도적 미전송 (게임 신청 가드 보존)
  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const filledRegions = regions.filter((r) => r.city);
      // district는 빈 문자열이면 null 처리 (필수값 아님)
      const districtValue = filledRegions.map((r) => r.district).filter(Boolean).join(",") || null;

      const payload = {
        nickname: nickname.trim() || null,
        position: position || null,
        city: filledRegions.map((r) => r.city).join(",") || null,
        district: districtValue,
      };

      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "저장 실패");

      // M5: 저장 후 곧장 홈으로 (preferences 강제 redirect 제거)
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 공통 입력 스타일 (border-radius 4px, BDR Red 포커스 링)
  const inp =
    "w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 text-sm";
  const lbl = "mb-1 block text-sm text-[var(--color-text-muted)]";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* 환영 헤더 — Material Symbols 농구 아이콘 */}
      <div className="mb-8 text-center">
        <div className="mb-3">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "48px", color: "var(--color-primary)" }}
          >
            sports_basketball
          </span>
        </div>
        <h1
          className="text-2xl font-extrabold uppercase tracking-wide text-[var(--color-text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          환영합니다!
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {step === "choose"
            ? "프로필을 더 채우면 맞춤 추천을 받을 수 있어요."
            : "닉네임, 포지션, 지역만 입력하면 끝나요."}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-[4px] bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* 1단계: 옵션 카드 2개 — 모바일 세로, lg 가로 2열 */}
      {step === "choose" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 카드 1: 지금 채우기 — primary 강조 */}
          <button
            type="button"
            onClick={() => setStep("fill")}
            className="group flex flex-col items-start rounded-[4px] border-2 border-[var(--color-primary)] bg-[var(--color-card)] p-6 text-left shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span
              className="material-symbols-outlined mb-3"
              style={{ fontSize: "32px", color: "var(--color-primary)" }}
            >
              edit_note
            </span>
            <h2
              className="mb-1 text-lg font-bold text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              지금 채우기
            </h2>
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">
              닉네임 · 포지션 · 활동 지역 (1분 소요)
            </p>
            <span
              className="mt-auto inline-flex items-center gap-1 rounded-[4px] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-on-primary)]"
            >
              시작하기
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                arrow_forward
              </span>
            </span>
          </button>

          {/* 카드 2: 나중에 — 보조 */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="group flex flex-col items-start rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-left shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span
              className="material-symbols-outlined mb-3"
              style={{ fontSize: "32px", color: "var(--color-text-muted)" }}
            >
              schedule
            </span>
            <h2
              className="mb-1 text-lg font-bold text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              나중에 할게요
            </h2>
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">
              먼저 둘러보고, 마이페이지에서 채울게요
            </p>
            <span
              className="mt-auto inline-flex items-center gap-1 rounded-[4px] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)]"
            >
              홈으로 가기
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                home
              </span>
            </span>
          </button>
        </div>
      )}

      {/* 2단계: 3필드 입력 폼 (닉네임/포지션/지역) */}
      {step === "fill" && (
        <>
          <div
            className="mb-6 rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-card)]"
          >
            <div className="space-y-5">
              {/* 닉네임 */}
              <div>
                <label className={lbl}>닉네임</label>
                <input
                  className={inp}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임 (2~20자)"
                  minLength={2}
                  maxLength={20}
                />
              </div>

              {/* 포지션 */}
              <div>
                <label className={lbl}>
                  포지션{" "}
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    (복수 선택 가능)
                  </span>
                </label>
                <div className="flex gap-2">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => togglePosition(pos)}
                      className={`flex-1 rounded-[4px] border py-2 text-sm font-medium transition-colors ${
                        selectedPositions.includes(pos)
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* 활동 지역 */}
              <div>
                <label className={lbl}>활동 지역</label>
                <RegionPicker value={regions} onChange={setRegions} max={3} />
              </div>
            </div>
          </div>

          {/* 액션 버튼: 저장 / 뒤로 */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-[4px] bg-[var(--color-primary)] py-4 text-sm font-semibold text-[var(--color-on-primary)] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "저장 중..." : "저장하고 시작하기"}
            </button>
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="w-full rounded-[4px] border border-[var(--color-border)] py-4 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
            >
              뒤로
            </button>
          </div>
        </>
      )}

      <div className="h-6" />
    </div>
  );
}
