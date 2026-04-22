"use client";

import { useState, useRef, useEffect } from "react";
import type { WizardFormData, RecentVenue } from "./game-wizard";

/**
 * Step 2. Schedule & Location (일정 및 장소)
 * 디자인 시안(bdr_3/bdr_4) 기준:
 * - DATE PICKER: 날짜 선택
 * - TIME PICKER: 시간 선택
 * - LOCATION SEARCH (KAKAO STYLE): 주소 검색 + 지도 미리보기
 * + 기존 프리셋 저장/불러오기, 최근 장소, 실력/모집인원 등은 유지
 */

// 실력 수준별 색상 -- CSS 변수 참조
const SKILL_LEVELS = [
  { value: "lowest",                label: "최하", color: "var(--color-badge-gray)" },
  { value: "beginner",              label: "하",   color: "var(--color-badge-green)" },
  { value: "intermediate_low",      label: "중하", color: "var(--color-success)" },
  { value: "intermediate",          label: "중",   color: "var(--color-badge-blue)" },
  { value: "intermediate_advanced", label: "중상", color: "var(--color-badge-amber)" },
  { value: "advanced",              label: "상",   color: "var(--color-badge-red)" },
  { value: "highest",               label: "최상", color: "var(--color-ai-purple)" },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "10", "20", "30", "40", "50"];

// --- 저장/불러오기 로컬스토리지 ---
const PRESETS_KEY = "bdr_game_presets";

interface GamePreset {
  name: string;
  data: Partial<WizardFormData>;
  savedAt: string;
}

function loadPresets(): GamePreset[] {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || "[]");
  } catch { return []; }
}

function savePreset(name: string, data: WizardFormData) {
  const presets = loadPresets();
  const { scheduledDate, scheduledTime, endTime, ...saveable } = data;
  presets.unshift({ name, data: saveable, savedAt: new Date().toISOString() });
  // 최대 10개
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.slice(0, 10)));
}

// --- TimePicker ---
function TimePicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [hh, mm] = value ? value.split(":").map(Number) : [19, 0];
  const isPM = hh >= 12;
  const display12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
  const displayMin = String(mm).padStart(2, "0");

  const [ampm, setAmpm] = useState<"오전" | "오후">(isPM ? "오후" : "오전");
  const [selHour, setSelHour] = useState(display12);
  const [selMin, setSelMin] = useState(displayMin);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const confirm = () => {
    let h24 = selHour;
    if (ampm === "오후" && selHour !== 12) h24 = selHour + 12;
    if (ampm === "오전" && selHour === 12) h24 = 0;
    onChange(`${String(h24).padStart(2, "0")}:${selMin}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-4 py-3 text-sm text-[var(--color-text-primary)]"
      >
        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
        <span>{value ? `${ampm} ${String(display12).padStart(2, "0")}:${displayMin}` : "--:--"}</span>
      </button>
      {open && (
        <div className="absolute left-1/2 top-12 z-50 w-[220px] -translate-x-1/2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <div className="flex flex-col gap-1">
              {(["오전", "오후"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setAmpm(v)}
                  className={`rounded-lg py-1.5 text-xs font-medium ${ampm === v ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)]"}`}>{v}</button>
              ))}
            </div>
            <div className="max-h-[150px] overflow-y-auto space-y-0.5">
              {HOURS.map((h) => (
                <button key={h} type="button" onClick={() => setSelHour(h)}
                  className={`w-full rounded-md py-1 text-xs ${selHour === h ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-bright)]"}`}>{String(h).padStart(2, "0")}</button>
              ))}
            </div>
            <div className="max-h-[150px] overflow-y-auto space-y-0.5">
              {MINUTES.map((m) => (
                <button key={m} type="button" onClick={() => setSelMin(m)}
                  className={`w-full rounded-md py-1 text-xs ${selMin === m ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-bright)]"}`}>{m}</button>
              ))}
            </div>
          </div>
          <button type="button" onClick={confirm}
            className="w-full rounded-full bg-[var(--color-primary)] py-2 text-xs font-semibold text-white">확인</button>
        </div>
      )}
    </div>
  );
}

const RECURRENCE_RULES = [
  { value: "weekly", label: "매주" },
  { value: "biweekly", label: "2주마다" },
  { value: "monthly", label: "매월" },
];

// 추가 설정 아코디언 (기존 로직 유지)
function AdvancedSettings({ data, updateData }: {
  data: WizardFormData;
  updateData: <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)]">
        <span>추가 설정 (선택)</span>
        <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${open ? "rotate-180" : ""}`}>expand_more</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-[var(--color-border)] px-4 py-4">
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">설명</label>
            <textarea value={data.description} onChange={(e) => updateData("description", e.target.value)}
              rows={2} placeholder="경기 상세 설명"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">참가 조건</label>
            <textarea value={data.requirements} onChange={(e) => updateData("requirements", e.target.value)}
              rows={1} placeholder="예: 남성만, 3점슈터 우대"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">반복 경기</p>
              <p className="text-xs text-[var(--color-text-secondary)]">정기적으로 반복</p>
            </div>
            <button type="button" role="switch" aria-checked={data.isRecurring}
              onClick={() => updateData("isRecurring", !data.isRecurring)}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${data.isRecurring ? "bg-[var(--color-primary)]" : "bg-[var(--color-text-muted)]"}`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${data.isRecurring ? "left-6" : "left-1"}`} />
            </button>
          </div>
          {data.isRecurring && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">반복 주기</label>
                <select value={data.recurrenceRule} onChange={(e) => updateData("recurrenceRule", e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-2 py-1.5 text-xs text-[var(--color-text-primary)]">
                  {RECURRENCE_RULES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">총 횟수</label>
                <input type="number" value={data.recurringCount} onChange={(e) => updateData("recurringCount", parseInt(e.target.value) || 2)}
                  min={2} max={52}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-2 py-1.5 text-xs text-[var(--color-text-primary)]" />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">비고</label>
            <textarea value={data.notes} onChange={(e) => updateData("notes", e.target.value)}
              rows={1} placeholder="기타 안내사항"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main ---
interface StepWhenWhereProps {
  data: WizardFormData;
  updateData: <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => void;
  errors: Record<string, string>;
  recentVenues: RecentVenue[];
  venuesLoading: boolean;
  onApplyVenue: (v: RecentVenue) => void;
  onOpenPostcode: () => void;
}

export function StepWhenWhere({
  data,
  updateData,
  errors,
  recentVenues,
  venuesLoading,
  onApplyVenue,
  onOpenPostcode,
}: StepWhenWhereProps) {
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<GamePreset[]>([]);

  // 종료시간 -> durationHours 자동 계산
  useEffect(() => {
    if (data.scheduledTime && data.endTime) {
      const [sh, sm] = data.scheduledTime.split(":").map(Number);
      const [eh, em] = data.endTime.split(":").map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff <= 0) diff += 24 * 60;
      updateData("durationHours", Math.round(diff / 60 * 10) / 10);
    }
  }, [data.scheduledTime, data.endTime, updateData]);

  const handleSave = () => {
    if (!presetName.trim()) return;
    savePreset(presetName.trim(), data);
    setShowSaveModal(false);
    setPresetName("");
  };

  const handleLoad = (preset: GamePreset) => {
    Object.entries(preset.data).forEach(([k, v]) => {
      if (v !== undefined) updateData(k as keyof WizardFormData, v as never);
    });
    setShowLoadModal(false);
  };

  const handleDeletePreset = (idx: number) => {
    const all = loadPresets();
    all.splice(idx, 1);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(all));
    setPresets(all);
  };

  return (
    <div>
      {/* 폼 카드 (디자인 시안의 Step 2 카드) */}
      <div className="bg-[var(--color-card)] p-8 rounded-md border border-[var(--color-border)] shadow-sm">
        {/* 카드 헤더 + 저장/불러오기 버튼 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            Step 2. Schedule &amp; Location
          </h2>
          <div className="flex gap-1.5">
            <button type="button" title="설정 저장"
              onClick={() => setShowSaveModal(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors">
              <span className="material-symbols-outlined text-base">save</span>
            </button>
            <button type="button" title="설정 불러오기"
              onClick={() => { setPresets(loadPresets()); setShowLoadModal(true); }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors">
              <span className="material-symbols-outlined text-base">folder_open</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* DATE + TIME (2열) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
                Date Picker
              </label>
              <input
                type="date"
                value={data.scheduledDate}
                min={minDate}
                onChange={(e) => updateData("scheduledDate", e.target.value)}
                className={`w-full px-4 py-3 rounded-md border bg-[var(--color-surface-lowest)] text-[var(--color-text-primary)] text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-0 ${
                  errors.scheduledAt ? "border-[var(--color-error)]" : "border-[var(--color-border)]"
                }`}
              />
            </div>
            {/* Time Picker */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
                Time Picker
              </label>
              <TimePicker value={data.scheduledTime} onChange={(v) => updateData("scheduledTime", v)} label="시작 시간" />
            </div>
          </div>

          {/* 종료 시간 (기존 기능 유지) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
                End Time
              </label>
              <TimePicker value={data.endTime} onChange={(v) => updateData("endTime", v)} label="종료 시간" />
            </div>
            <div className="flex items-end pb-1">
              {data.durationHours > 0 && data.scheduledTime && data.endTime && (
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">timer</span>
                  경기 시간: {data.durationHours}시간
                </p>
              )}
            </div>
          </div>

          {errors.scheduledAt && <p role="alert" className="text-xs text-[var(--color-error)]">{errors.scheduledAt}</p>}

          {/* LOCATION SEARCH (Kakao style) */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
              Location Search (Kakao style)
            </label>
            <div className="relative">
              {/* 위치 아이콘 */}
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[var(--color-text-muted)]">location_on</span>
              <input
                type="text"
                value={data.venueName}
                onChange={(e) => updateData("venueName", e.target.value)}
                onClick={onOpenPostcode}
                readOnly
                placeholder="경기장 이름 또는 주소 검색"
                className="w-full pl-11 pr-4 py-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-lowest)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none cursor-pointer"
              />
            </div>

            {/* 주소 표시 */}
            {data.venueAddress && (
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined text-sm align-middle mr-1">pin_drop</span>
                {data.venueAddress}
              </p>
            )}

            {/* 지도 미리보기 이미지 (디자인 시안에서 보여주는 플레이스홀더) */}
            {data.venueName && (
              <div className="mt-4 aspect-video rounded-lg overflow-hidden border border-[var(--color-border)] relative bg-[var(--color-surface)]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-[var(--color-card)] px-4 py-2 rounded shadow-lg flex items-center gap-2 border border-[var(--color-border)]">
                    <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">{data.venueName}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 최근 장소 (카드 밖에 배치) */}
      {!venuesLoading && recentVenues.length > 0 && (
        <div className="mt-6">
          <p className="mb-1.5 text-xs text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined text-sm align-middle mr-1">history</span>
            최근 장소
          </p>
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
            {recentVenues.map((v, i) => {
              const isActive = v.venue_name === data.venueName && v.city === data.city;
              return (
                <button key={i} type="button" onClick={() => onApplyVenue(v)}
                  className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs ${
                    isActive ? "bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]" : "bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)]"
                  }`}>{v.venue_name || v.district || v.city}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* 활동지역 표시 */}
      {(data.city || data.district) && (
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="material-symbols-outlined text-sm">map</span>
          <span>활동지역:</span>
          <span className="text-[var(--color-text-primary)]">{[data.city, data.district].filter(Boolean).join(" ")}</span>
        </div>
      )}

      {/* 모집 인원 + 실력 + 추가 설정 (별도 카드) */}
      <div className="mt-6 bg-[var(--color-card)] p-6 rounded-md border border-[var(--color-border)] shadow-sm space-y-5">
        {/* 모집 인원 */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Participants
          </label>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={data.maxParticipants} value={data.minParticipants}
              onChange={(e) => updateData("minParticipants", Number(e.target.value) || 1)}
              className="w-14 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-2 py-2 text-center text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]" />
            <span className="text-xs text-[var(--color-text-secondary)]">~</span>
            <input type="number" min={data.minParticipants} max={100} value={data.maxParticipants}
              onChange={(e) => updateData("maxParticipants", Number(e.target.value) || 1)}
              className="w-14 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-2 py-2 text-center text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]" />
            <span className="text-xs text-[var(--color-text-secondary)]">명</span>
          </div>
        </div>

        {/* 참가비 빠른 선택 */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Entry Fee
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[0, 5000, 8000, 10000].map((v) => (
              <button key={v} type="button" onClick={() => updateData("feePerPerson", v)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium min-h-[36px] ${
                  data.feePerPerson === v ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bright)]"
                }`}>{v === 0 ? "무료" : `${(v / 1000).toFixed(0)}천원`}</button>
            ))}
            <input type="number" min={0} step={1000} value={data.feePerPerson || ""}
              onChange={(e) => updateData("feePerPerson", Number(e.target.value) || 0)}
              placeholder="직접입력"
              className="w-20 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-3 py-1.5 text-center text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
        </div>

        {/* 실력 — 7단계 */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Skill Level
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_LEVELS.map((s) => (
              <button key={s.value} type="button" onClick={() => updateData("skillLevel", s.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium min-h-[36px] transition-colors ${
                  data.skillLevel === s.value ? "text-white" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bright)]"
                }`}
                style={data.skillLevel === s.value ? { backgroundColor: s.color } : undefined}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {/* 추가 설정 아코디언 */}
        <AdvancedSettings data={data} updateData={updateData} />
      </div>

      {/* === 저장 모달 === */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowSaveModal(false); }}>
          <div className="w-full max-w-xs rounded-md bg-[var(--color-card)] p-5 shadow-xl">
            <h3 className="mb-3 text-base font-bold text-[var(--color-text-primary)]">경기 설정 저장</h3>
            <input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)}
              placeholder="저장 이름 (예: 주말 픽업)"
              className="mb-3 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-lowest)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
              autoFocus />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowSaveModal(false)}
                className="flex-1 rounded-lg border border-[var(--color-border)] py-2 text-sm text-[var(--color-text-muted)]">취소</button>
              <button type="button" onClick={handleSave}
                className="flex-1 rounded-lg bg-[var(--color-primary)] py-2 text-sm font-semibold text-white">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* === 불러오기 모달 === */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowLoadModal(false); }}>
          <div className="w-full max-w-xs rounded-md bg-[var(--color-card)] p-5 shadow-xl">
            <h3 className="mb-3 text-base font-bold text-[var(--color-text-primary)]">자주 쓰는 경기</h3>
            {presets.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">저장된 설정이 없습니다.</p>
            ) : (
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {presets.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] p-3">
                    <button type="button" onClick={() => handleLoad(p)} className="flex-1 text-left">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{p.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {p.data.venueName && `${p.data.venueName} · `}
                        {p.data.maxParticipants}명 · {p.data.feePerPerson ? `${(p.data.feePerPerson / 1000).toFixed(0)}천원` : "무료"}
                      </p>
                    </button>
                    <button type="button" onClick={() => handleDeletePreset(i)}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-error)]">삭제</button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setShowLoadModal(false)}
              className="mt-3 w-full rounded-lg border border-[var(--color-border)] py-2 text-sm text-[var(--color-text-muted)]">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
