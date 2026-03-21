"use client";

import { useState } from "react";
import type { WizardFormData } from "./game-wizard";

const SKILL_LABELS: Record<string, string> = {
  all: "전체",
  beginner: "초급",
  intermediate: "중급",
  intermediate_advanced: "중고급",
  advanced: "고급",
};

const RECURRENCE_RULES = [
  { value: "weekly", label: "매주" },
  { value: "biweekly", label: "2주마다" },
  { value: "monthly", label: "매월" },
];

interface StepConfirmProps {
  data: WizardFormData;
  updateData: <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => void;
  generateTitle: () => string;
  submitError: string;
}

export function StepConfirm({ data, updateData, generateTitle, submitError }: StepConfirmProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const typeEmoji = data.gameType === "0" ? "🏀" : data.gameType === "1" ? "🤝" : "⚔️";
  const typeLabel = data.gameType === "0" ? "픽업" : data.gameType === "1" ? "게스트 모집" : "팀 대결";
  const title = data.title.trim() || generateTitle() || "경기 제목";
  const location = [data.city, data.district, data.venueName].filter(Boolean).join(" · ");
  const feeDisplay =
    data.feePerPerson > 0 ? `${data.feePerPerson.toLocaleString()}원` : "무료";

  let dateDisplay = "";
  if (data.scheduledDate && data.scheduledTime) {
    const dt = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
    dateDisplay = `${dt.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })} ${dt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}`;
    if (data.durationHours) dateDisplay += ` · ${data.durationHours}시간`;
  }

  return (
    <div aria-live="polite">
      <h2 className="mb-2 text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]">이렇게 만들까요?</h2>
      <p className="mb-6 text-sm text-[var(--color-text-secondary)]">내용을 확인하고 경기를 만들어보세요.</p>

      {/* Error toast */}
      {submitError && (
        <div className="mb-4 rounded-[12px] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600" role="alert">
          {submitError}
        </div>
      )}

      {/* Preview Card */}
      <div
        className="mb-6 overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        style={{ borderLeft: "3px solid var(--color-primary)" }}
      >
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-base">{typeEmoji}</span>
          <span className="text-xs font-medium text-[var(--color-primary)]">{typeLabel}</span>
        </div>

        <h3 className="mb-3 text-lg font-semibold leading-snug text-[var(--color-text-primary)]">{title}</h3>

        <div className="mb-3 space-y-1.5">
          {dateDisplay && (
            <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              <span>📅</span>
              <span>{dateDisplay}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              <span>📍</span>
              <span>{location}</span>
            </div>
          )}
          {data.venueAddress && !location.includes(data.venueAddress) && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              <span className="w-4" />
              <span>{data.venueAddress}</span>
            </div>
          )}
        </div>

        <div className="mb-3 h-px bg-[var(--color-border)]" />

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[var(--color-text-muted)]">
          <span>최대 {data.maxParticipants}명</span>
          <span>·</span>
          <span>{feeDisplay}</span>
          <span>·</span>
          <span>{SKILL_LABELS[data.skillLevel] || "전체"} 수준</span>
        </div>

        {data.allowGuests && data.gameType !== "1" && (
          <div className="mt-2">
            <span className="rounded-full bg-[var(--color-surface-bright)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
              게스트 허용
            </span>
          </div>
        )}

        {data.contactPhone && (
          <div className="mt-2">
            <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs text-[#92400E]">
              📞 {data.contactPhone}
            </span>
          </div>
        )}
      </div>

      {/* Advanced Settings Accordion */}
      <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
          aria-expanded={showAdvanced}
        >
          <span>추가 설정 (선택)</span>
          <span className={`transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {showAdvanced && (
          <div className="space-y-4 border-t border-[var(--color-border)] px-5 py-4">
            {/* Description */}
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]">설명</label>
              <textarea
                value={data.description}
                onChange={(e) => updateData("description", e.target.value)}
                rows={3}
                placeholder="경기 상세 설명"
                className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]">참가 조건</label>
              <textarea
                value={data.requirements}
                onChange={(e) => updateData("requirements", e.target.value)}
                rows={2}
                placeholder="예: 남성만, 3점슈터 우대"
                className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
              />
            </div>

            {/* Pickup: entry fee note */}
            {data.gameType === "0" && (
              <div>
                <label className="mb-1 block text-sm text-[var(--color-text-muted)]">참가비 안내</label>
                <input
                  type="text"
                  value={data.entryFeeNote}
                  onChange={(e) => updateData("entryFeeNote", e.target.value)}
                  placeholder="예: 음료 지참, 5,000원 현장 납부 등"
                  className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                />
              </div>
            )}

            {/* Recurring */}
            <div>
              <div className="flex items-center justify-between rounded-[12px] bg-[var(--color-surface)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">반복 경기</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">정기적으로 반복되는 경기</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={data.isRecurring}
                  onClick={() => updateData("isRecurring", !data.isRecurring)}
                  className={`relative h-6 w-12 flex-shrink-0 rounded-full transition-colors ${
                    data.isRecurring ? "bg-[var(--color-accent)]" : "bg-[#CBD5E1]"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-[var(--color-card)] transition-all ${
                      data.isRecurring ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {data.isRecurring && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">반복 주기</label>
                    <select
                      value={data.recurrenceRule}
                      onChange={(e) => updateData("recurrenceRule", e.target.value)}
                      className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                    >
                      {RECURRENCE_RULES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">총 횟수</label>
                    <input
                      type="number"
                      value={data.recurringCount}
                      onChange={(e) => updateData("recurringCount", parseInt(e.target.value) || 2)}
                      min={2}
                      max={52}
                      className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]">비고</label>
              <textarea
                value={data.notes}
                onChange={(e) => updateData("notes", e.target.value)}
                rows={2}
                placeholder="기타 안내사항"
                className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
