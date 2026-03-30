"use client";

import { useState } from "react";
import type { WizardFormData } from "./game-wizard";

const SKILL_LEVELS = [
  { value: "all", label: "전체" },
  { value: "beginner", label: "초급" },
  { value: "intermediate", label: "중급" },
  { value: "intermediate_advanced", label: "중고급" },
  { value: "advanced", label: "고급" },
];

const FEE_PRESETS = [0, 5000, 10000];

const UNIFORM_COLORS = [
  { value: "#FF0000", label: "빨강" },
  { value: "#0000FF", label: "파랑" },
  { value: "#FFFFFF", label: "흰색" },
  { value: "#000000", label: "검정" },
  { value: "#FFA500", label: "주황" },
  { value: "#008000", label: "초록" },
  { value: "#800080", label: "보라" },
  { value: "#FFFF00", label: "노랑" },
];

interface StepSettingsProps {
  data: WizardFormData;
  updateData: <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => void;
  errors: Record<string, string>;
  generateTitle: () => string;
}

export function StepSettings({ data, updateData, errors, generateTitle }: StepSettingsProps) {
  const [customFee, setCustomFee] = useState(false);
  const isTeamMatch = data.gameType === "2";
  const isPickup = data.gameType === "0";
  const suggestedTitle = generateTitle();

  if (isTeamMatch) {
    return <TeamMatchSettings data={data} updateData={updateData} errors={errors} />;
  }

  return (
    <div aria-live="polite">
      <h2 className="mb-2 text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]">어떤 분들이 올 수 있나요?</h2>
      <p className="mb-6 text-sm text-[var(--color-text-secondary)]">모두 기본값이 적용돼요. 필요할 때만 바꾸세요.</p>

      {/* Title */}
      <div className="mb-5">
        <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">경기 제목</label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateData("title", e.target.value)}
          placeholder={suggestedTitle || "경기 제목"}
          maxLength={50}
          className={`w-full rounded-[16px] border bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 ${
            errors.title ? "border-red-400" : "border-[var(--color-border)]"
          }`}
        />
        {errors.title && (
          <p role="alert" className="mt-1 text-xs text-red-400">{errors.title}</p>
        )}
        {suggestedTitle && !data.title && (
          <button
            type="button"
            onClick={() => updateData("title", suggestedTitle)}
            className="mt-1 text-xs text-[var(--color-primary)] hover:underline"
          >
            자동 제안: &quot;{suggestedTitle}&quot; ← 적용
          </button>
        )}
      </div>

      {/* Max Participants + Skill Level */}
      <div className="mb-5 grid grid-cols-2 gap-4">
        {/* Participant Stepper */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">최대 인원</label>
          <div className="flex items-center gap-2 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2">
            <button
              type="button"
              onClick={() => updateData("maxParticipants", Math.max(2, data.maxParticipants - 1))}
              disabled={data.maxParticipants <= 2}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-bright)] disabled:opacity-30"
              aria-label="인원 감소"
            >
              -
            </button>
            <span className="flex-1 text-center font-semibold text-[var(--color-text-primary)]">
              {data.maxParticipants}명
            </span>
            <button
              type="button"
              onClick={() => updateData("maxParticipants", Math.min(100, data.maxParticipants + 1))}
              disabled={data.maxParticipants >= 100}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-bright)] disabled:opacity-30"
              aria-label="인원 증가"
            >
              +
            </button>
          </div>
        </div>

        {/* Skill Level */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">기술 수준</label>
          <select
            value={data.skillLevel}
            onChange={(e) => updateData("skillLevel", e.target.value)}
            className="w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
          >
            {SKILL_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fee */}
      <div className="mb-5">
        <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">참가비 (원)</label>
        <div className="flex gap-2 mb-2">
          {FEE_PRESETS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                updateData("feePerPerson", f);
                setCustomFee(false);
              }}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                !customFee && data.feePerPerson === f
                  ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-transparent hover:bg-[var(--color-surface-bright)]"
              }`}
            >
              {f === 0 ? "무료" : `${f.toLocaleString()}원`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomFee(true)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              customFee
                ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-transparent hover:bg-[var(--color-surface-bright)]"
            }`}
          >
            직접입력
          </button>
        </div>
        {customFee && (
          <input
            type="number"
            value={data.feePerPerson || ""}
            onChange={(e) => updateData("feePerPerson", parseInt(e.target.value) || 0)}
            min={0}
            step={1000}
            placeholder="금액 입력"
            className="w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            autoFocus
          />
        )}
      </div>

      {/* Guest toggle (hide for 게스트 모집 — always true) */}
      {data.gameType !== "1" && (
        <div className="mb-5 flex items-center justify-between rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">게스트 허용</p>
            <p className="text-xs text-[var(--color-text-secondary)]">팀 없이 개인 참가 가능</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={data.allowGuests}
            onClick={() => updateData("allowGuests", !data.allowGuests)}
            className={`relative h-6 w-12 flex-shrink-0 rounded-full transition-colors ${
              data.allowGuests ? "bg-[var(--color-accent)]" : "bg-[var(--color-text-muted)]"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-[var(--color-card)] transition-all ${
                data.allowGuests ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      )}

      {/* Pickup: contact phone */}
      {isPickup && (
        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">
            담당자 연락처 <span className="text-[var(--color-primary)]">*</span>
          </label>
          <input
            type="tel"
            value={data.contactPhone}
            onChange={(e) => updateData("contactPhone", e.target.value)}
            placeholder="010-1234-5678"
            className={`w-full rounded-[16px] border bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 ${
              errors.contactPhone ? "border-red-400" : "border-[var(--color-border)]"
            }`}
          />
          {errors.contactPhone && (
            <p role="alert" className="mt-1 text-xs text-red-400">{errors.contactPhone}</p>
          )}
        </div>
      )}
    </div>
  );
}

// --- Team Match Settings (STEP 3B) ---

function TeamMatchSettings({
  data,
  updateData,
  errors,
}: {
  data: WizardFormData;
  updateData: <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div aria-live="polite">
      <h2 className="mb-2 text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]">팀 대결 설정</h2>
      <p className="mb-6 text-sm text-[var(--color-text-secondary)]">팀 대결에 필요한 정보를 입력하세요.</p>

      {/* Title */}
      <div className="mb-5">
        <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">
          경기 제목 <span className="text-[var(--color-primary)]">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateData("title", e.target.value)}
          placeholder="예: 우리팀 vs 도전자 모집"
          maxLength={50}
          className={`w-full rounded-[16px] border bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 ${
            errors.title ? "border-red-400" : "border-[var(--color-border)]"
          }`}
        />
        {errors.title && (
          <p role="alert" className="mt-1 text-xs text-red-400">{errors.title}</p>
        )}
      </div>

      {/* Max Participants (per team) */}
      <div className="mb-5">
        <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">최대 인원 (팀당)</label>
        <div className="flex items-center gap-2 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 max-w-[200px]">
          <button
            type="button"
            onClick={() => updateData("maxParticipants", Math.max(2, data.maxParticipants - 1))}
            disabled={data.maxParticipants <= 2}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-bright)] disabled:opacity-30"
            aria-label="인원 감소"
          >
            -
          </button>
          <span className="flex-1 text-center font-semibold text-[var(--color-text-primary)]">
            {data.maxParticipants}명
          </span>
          <button
            type="button"
            onClick={() => updateData("maxParticipants", Math.min(20, data.maxParticipants + 1))}
            disabled={data.maxParticipants >= 20}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-bright)] disabled:opacity-30"
            aria-label="인원 증가"
          >
            +
          </button>
        </div>
      </div>

      {/* Uniform Colors */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">유니폼 색상</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">홈팀 색상</label>
            <select
              value={data.uniformHomeColor}
              onChange={(e) => updateData("uniformHomeColor", e.target.value)}
              className="w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            >
              {UNIFORM_COLORS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">어웨이 색상</label>
            <select
              value={data.uniformAwayColor}
              onChange={(e) => updateData("uniformAwayColor", e.target.value)}
              className="w-full rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            >
              {UNIFORM_COLORS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Color preview */}
        <div className="mt-3 flex items-center justify-center gap-4 rounded-[12px] bg-[var(--color-surface)] py-3">
          <div className="text-center">
            <div
              className="mx-auto mb-1 h-8 w-8 rounded-full border border-[var(--color-border)]"
              style={{ backgroundColor: data.uniformHomeColor }}
            />
            <span className="text-xs text-[var(--color-text-secondary)]">홈</span>
          </div>
          <span className="text-sm font-bold text-[var(--color-text-secondary)]">vs</span>
          <div className="text-center">
            <div
              className="mx-auto mb-1 h-8 w-8 rounded-full border border-[var(--color-border)]"
              style={{ backgroundColor: data.uniformAwayColor }}
            />
            <span className="text-xs text-[var(--color-text-secondary)]">어웨이</span>
          </div>
        </div>
      </div>
    </div>
  );
}
