"use client";

import { useState, useRef, useEffect } from "react";
import { Save, FolderOpen } from "lucide-react";
import type { WizardFormData, RecentVenue } from "./game-wizard";

const SKILL_LEVELS = [
  { value: "lowest",                label: "최하", color: "#9CA3AF" },
  { value: "beginner",              label: "하",   color: "#16A34A" },
  { value: "intermediate_low",      label: "중하", color: "#059669" },
  { value: "intermediate",          label: "중",   color: "#2563EB" },
  { value: "intermediate_advanced", label: "중상", color: "#D97706" },
  { value: "advanced",              label: "상",   color: "#DC2626" },
  { value: "highest",               label: "최상", color: "#7C3AED" },
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
        className="flex w-full items-center justify-between rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm text-[var(--color-text-primary)]"
      >
        <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
        <span>{value ? `${ampm} ${String(display12).padStart(2, "0")}:${displayMin}` : "--:--"}</span>
      </button>
      {open && (
        <div className="absolute left-1/2 top-12 z-50 w-[220px] -translate-x-1/2 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <div className="flex flex-col gap-1">
              {(["오전", "오후"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setAmpm(v)}
                  className={`rounded-[8px] py-1.5 text-xs font-medium ${ampm === v ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)]"}`}>{v}</button>
              ))}
            </div>
            <div className="max-h-[150px] overflow-y-auto space-y-0.5">
              {HOURS.map((h) => (
                <button key={h} type="button" onClick={() => setSelHour(h)}
                  className={`w-full rounded-[6px] py-1 text-xs ${selHour === h ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-bright)]"}`}>{String(h).padStart(2, "0")}</button>
              ))}
            </div>
            <div className="max-h-[150px] overflow-y-auto space-y-0.5">
              {MINUTES.map((m) => (
                <button key={m} type="button" onClick={() => setSelMin(m)}
                  className={`w-full rounded-[6px] py-1 text-xs ${selMin === m ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-bright)]"}`}>{m}</button>
              ))}
            </div>
          </div>
          <button type="button" onClick={confirm}
            className="w-full rounded-full bg-[var(--color-accent)] py-2 text-xs font-semibold text-white">확인</button>
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

function AdvancedSettings({ data, updateData }: {
  data: WizardFormData;
  updateData: <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)]">
        <span>추가 설정 (선택)</span>
        <span className={`transition-transform duration-200 text-xs ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-[var(--color-border)] px-4 py-4">
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">설명</label>
            <textarea value={data.description} onChange={(e) => updateData("description", e.target.value)}
              rows={2} placeholder="경기 상세 설명"
              className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">참가 조건</label>
            <textarea value={data.requirements} onChange={(e) => updateData("requirements", e.target.value)}
              rows={1} placeholder="예: 남성만, 3점슈터 우대"
              className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
          </div>
          <div className="flex items-center justify-between rounded-[10px] bg-[var(--color-surface)] px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">반복 경기</p>
              <p className="text-xs text-[var(--color-text-secondary)]">정기적으로 반복</p>
            </div>
            <button type="button" role="switch" aria-checked={data.isRecurring}
              onClick={() => updateData("isRecurring", !data.isRecurring)}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${data.isRecurring ? "bg-[var(--color-accent)]" : "bg-[#CBD5E1]"}`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${data.isRecurring ? "left-6" : "left-1"}`} />
            </button>
          </div>
          {data.isRecurring && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">반복 주기</label>
                <select value={data.recurrenceRule} onChange={(e) => updateData("recurrenceRule", e.target.value)}
                  className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 text-xs text-[var(--color-text-primary)]">
                  {RECURRENCE_RULES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">총 횟수</label>
                <input type="number" value={data.recurringCount} onChange={(e) => updateData("recurringCount", parseInt(e.target.value) || 2)}
                  min={2} max={52}
                  className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 text-xs text-[var(--color-text-primary)]" />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">비고</label>
            <textarea value={data.notes} onChange={(e) => updateData("notes", e.target.value)}
              rows={1} placeholder="기타 안내사항"
              className="w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
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

  // 종료시간 → durationHours 자동 계산
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
    <div aria-live="polite">
      {/* 헤더 + 저장/불러오기 */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]">언제, 어디서 뛰나요?</h2>
        <div className="flex gap-1.5">
          <button type="button" title="설정 저장"
            onClick={() => setShowSaveModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[rgba(27,60,135,0.08)] transition-colors">
            <Save size={16} />
          </button>
          <button type="button" title="설정 불러오기"
            onClick={() => { setPresets(loadPresets()); setShowLoadModal(true); }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[rgba(27,60,135,0.08)] transition-colors">
            <FolderOpen size={16} />
          </button>
        </div>
      </div>
      <p className="mb-5 text-sm text-[var(--color-text-secondary)]">날짜와 장소를 선택해주세요.</p>

      {/* 경기 제목 */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">
          경기 제목 <span className="text-[var(--color-primary)]">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateData("title", e.target.value)}
          placeholder="예: 강남 주말 픽업 - 중급"
          maxLength={50}
          className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
        />
      </div>

      {/* 일시: 날짜 + 시작 ~ 종료 */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">
          일시 <span className="text-[var(--color-primary)]">*</span>
        </label>
        <input
          type="date"
          value={data.scheduledDate}
          min={minDate}
          onChange={(e) => updateData("scheduledDate", e.target.value)}
          className={`mb-2 w-full rounded-[12px] border bg-[var(--color-card)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 ${
            errors.scheduledAt ? "border-red-400" : "border-[var(--color-border)]"
          }`}
        />
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TimePicker value={data.scheduledTime} onChange={(v) => updateData("scheduledTime", v)} label="시작" />
          <span className="text-sm text-[var(--color-text-secondary)]">~</span>
          <TimePicker value={data.endTime} onChange={(v) => updateData("endTime", v)} label="종료" />
        </div>
        {data.durationHours > 0 && data.scheduledTime && data.endTime && (
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">경기 시간: {data.durationHours}시간</p>
        )}
        {errors.scheduledAt && <p role="alert" className="mt-1 text-xs text-red-400">{errors.scheduledAt}</p>}
      </div>

      <div className="mb-5 h-px bg-[var(--color-border)]" />

      {/* 장소 — 통합 카드 */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--color-text-muted)]">장소</label>
          <button type="button" onClick={onOpenPostcode}
            className="flex items-center gap-1.5 rounded-[10px] bg-[#FEE500] px-3 py-1.5 text-xs font-medium text-[#3C1E1E] hover:opacity-90">
            🔍 주소 검색
          </button>
        </div>
        <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <input type="text" value={data.venueName}
            onChange={(e) => updateData("venueName", e.target.value)}
            placeholder="장소명 / 체육관 이름"
            className="w-full border-b border-[var(--color-border)] bg-transparent px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none" />
          {data.venueAddress ? (
            <div className="px-4 py-2 text-xs text-[var(--color-text-muted)]">📍 {data.venueAddress}</div>
          ) : (
            <div className="px-4 py-2 text-xs text-[var(--color-text-secondary)]">주소 검색으로 입력하세요</div>
          )}
        </div>
      </div>

      {/* Recent venues */}
      {!venuesLoading && recentVenues.length > 0 && (
        <div className="mb-5">
          <p className="mb-1.5 text-xs text-[var(--color-text-secondary)]">최근 장소</p>
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
            {recentVenues.map((v, i) => {
              const isActive = v.venue_name === data.venueName && v.city === data.city;
              return (
                <button key={i} type="button" onClick={() => onApplyVenue(v)}
                  className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs ${
                    isActive ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]" : "bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/50"
                  }`}>{v.venue_name || v.district || v.city}</button>
              );
            })}
          </div>
        </div>
      )}

      {(data.city || data.district) && (
        <div className="mb-5 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span>📍 활동지역:</span>
          <span className="text-[var(--color-text-primary)]">{[data.city, data.district].filter(Boolean).join(" ")}</span>
        </div>
      )}

      <div className="mb-5 h-px bg-[var(--color-border)]" />

      {/* 모집 인원 */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">모집 인원</label>
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={data.maxParticipants} value={data.minParticipants}
            onChange={(e) => updateData("minParticipants", Number(e.target.value) || 1)}
            className="w-14 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-center text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
          <span className="text-xs text-[var(--color-text-secondary)]">~</span>
          <input type="number" min={data.minParticipants} max={100} value={data.maxParticipants}
            onChange={(e) => updateData("maxParticipants", Number(e.target.value) || 1)}
            className="w-14 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-center text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
          <span className="text-xs text-[var(--color-text-secondary)]">명</span>
        </div>
      </div>

      {/* 참가비 */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">참가비</label>
        <div className="flex flex-wrap gap-1.5">
          {[0, 5000, 8000, 10000].map((v) => (
            <button key={v} type="button" onClick={() => updateData("feePerPerson", v)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium min-h-[36px] ${
                data.feePerPerson === v ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bright)]"
              }`}>{v === 0 ? "무료" : `${(v / 1000).toFixed(0)}천원`}</button>
          ))}
          <input type="number" min={0} step={1000} value={data.feePerPerson || ""}
            onChange={(e) => updateData("feePerPerson", Number(e.target.value) || 0)}
            placeholder="직접입력"
            className="w-20 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-center text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50" />
        </div>
      </div>

      {/* 실력 — 7단계 */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">실력</label>
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

      <div className="mb-5 h-px bg-[var(--color-border)]" />

      {/* 추가 설정 아코디언 */}
      <AdvancedSettings data={data} updateData={updateData} />

      {/* 하단 네비바 가림 방지 여백 */}
      <div className="h-24" />

      {/* === 저장 모달 === */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowSaveModal(false); }}>
          <div className="w-full max-w-xs rounded-[16px] bg-[var(--color-card)] p-5 shadow-xl">
            <h3 className="mb-3 text-base font-bold text-[var(--color-text-primary)]">경기 설정 저장</h3>
            <input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)}
              placeholder="저장 이름 (예: 주말 픽업)"
              className="mb-3 w-full rounded-[12px] border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
              autoFocus />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowSaveModal(false)}
                className="flex-1 rounded-[10px] border border-[var(--color-border)] py-2 text-sm text-[var(--color-text-muted)]">취소</button>
              <button type="button" onClick={handleSave}
                className="flex-1 rounded-[10px] bg-[var(--color-accent)] py-2 text-sm font-semibold text-white">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* === 불러오기 모달 === */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowLoadModal(false); }}>
          <div className="w-full max-w-xs rounded-[16px] bg-[var(--color-card)] p-5 shadow-xl">
            <h3 className="mb-3 text-base font-bold text-[var(--color-text-primary)]">자주 쓰는 경기</h3>
            {presets.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">저장된 설정이 없습니다.</p>
            ) : (
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {presets.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-[12px] border border-[var(--color-border)] p-3">
                    <button type="button" onClick={() => handleLoad(p)} className="flex-1 text-left">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{p.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {p.data.venueName && `${p.data.venueName} · `}
                        {p.data.maxParticipants}명 · {p.data.feePerPerson ? `${(p.data.feePerPerson / 1000).toFixed(0)}천원` : "무료"}
                      </p>
                    </button>
                    <button type="button" onClick={() => handleDeletePreset(i)}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[#EF4444]">삭제</button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setShowLoadModal(false)}
              className="mt-3 w-full rounded-[10px] border border-[var(--color-border)] py-2 text-sm text-[var(--color-text-muted)]">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
