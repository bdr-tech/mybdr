"use client";

import { useState } from "react";
import type { WizardFormData } from "./game-wizard";

/**
 * Step 3. 최종 확인
 * 디자인 시안 기준으로 카드 스타일 적용, 기존 로직 100% 유지
 */

// 실력 라벨 (7단계 + 전체 + 하위 호환)
const SKILL_LABELS: Record<string, string> = {
  all: "전체",
  lowest: "최하",
  low: "하",
  mid_low: "중하",
  mid: "중",
  mid_high: "중상",
  high: "상",
  highest: "최상",
  // 하위 호환 (기존 4단계)
  beginner: "초급",
  intermediate: "중급",
  intermediate_advanced: "중상",
  advanced: "상급",
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

  const typeLabel = data.gameType === "0" ? "Pickup (픽업)" : data.gameType === "1" ? "Guest Recruit (게스트 모집)" : "Team Match (팀 대결)";
  const title = data.title.trim() || generateTitle() || "경기 제목";
  const location = [data.city, data.district, data.venueName].filter(Boolean).join(" · ");
  const feeDisplay =
    data.feePerPerson > 0 ? `₩ ${data.feePerPerson.toLocaleString()}` : "무료";

  let dateDisplay = "";
  if (data.scheduledDate && data.scheduledTime) {
    const dt = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
    const y = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    const sh = String(dt.getHours()).padStart(2, "0");
    const sm = String(dt.getMinutes()).padStart(2, "0");
    if (data.durationHours) {
      const end = new Date(dt.getTime() + Number(data.durationHours) * 60 * 60 * 1000);
      const eh = String(end.getHours()).padStart(2, "0");
      const em = String(end.getMinutes()).padStart(2, "0");
      dateDisplay = `${y}-${mo}-${d} ${sh}시 ${sm}분 ~ ${eh}시 ${em}분`;
    } else {
      dateDisplay = `${y}-${mo}-${d} ${sh}시 ${sm}분`;
    }
  }

  return (
    <div>
      {/* 에러 메시지 */}
      {submitError && (
        <div className="mb-4 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 px-4 py-3 text-sm text-[var(--color-error)] flex items-center gap-2" role="alert">
          <span className="material-symbols-outlined text-[var(--color-error)]">error</span>
          {submitError}
        </div>
      )}

      {/* 최종 확인 카드 */}
      <div className="bg-[var(--color-card)] p-8 rounded-md border border-[var(--color-border)] shadow-sm">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">
          Step 3. 최종 확인
        </h2>

        {/* 미리보기 카드 */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] p-6 rounded-md mb-6">
          {/* 타입 배지 */}
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-[var(--color-surface)] rounded-full text-xs font-medium text-[var(--color-text-secondary)]">
              {typeLabel}
            </span>
          </div>

          {/* 제목 */}
          <h3 className="text-xl font-bold mb-4">{title}</h3>

          {/* 상세 정보 */}
          <div className="space-y-2.5">
            {dateDisplay && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined text-base">calendar_today</span>
                <span>{dateDisplay}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined text-base">location_on</span>
                <span>{location}</span>
              </div>
            )}
            {data.venueAddress && !location.includes(data.venueAddress) && (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] pl-7">
                <span>{data.venueAddress}</span>
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="my-4 h-px bg-[var(--color-border)]" />

          {/* 요약 정보 */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">group</span>
              최대 {data.maxParticipants}명
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">payments</span>
              {feeDisplay}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">fitness_center</span>
              {SKILL_LABELS[data.skillLevel] || "전체"} 수준
            </span>
          </div>

          {data.allowGuests && data.gameType !== "1" && (
            <div className="mt-3">
              <span className="inline-block rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined text-sm align-middle mr-1">person_add</span>
                게스트 허용
              </span>
            </div>
          )}

          {data.contactPhone && (
            <div className="mt-2">
              <span className="inline-block rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined text-sm align-middle mr-1">call</span>
                {data.contactPhone}
              </span>
            </div>
          )}
        </div>

        {/* 추가 설정 (접기/펼치기) */}
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)] transition-colors"
            aria-expanded={showAdvanced}
          >
            <span>추가 설정 (선택)</span>
            <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}>
              expand_more
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
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
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
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
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
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              )}

              {/* Recurring */}
              <div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--color-card)] px-4 py-3">
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
                      data.isRecurring ? "bg-[var(--color-primary)]" : "bg-[var(--color-text-muted)]"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
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
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
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
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
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
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
