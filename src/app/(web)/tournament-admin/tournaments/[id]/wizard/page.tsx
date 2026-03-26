"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScheduleForm, type ScheduleFormData } from "@/components/tournament/schedule-form";
import {
  RegistrationSettingsForm,
  type RegistrationSettingsData,
} from "@/components/tournament/registration-settings-form";
import { TeamSettingsForm, type TeamSettingsData } from "@/components/tournament/team-settings-form";

const FORMAT_OPTIONS = [
  { value: "single_elimination", label: "싱글 엘리미네이션" },
  { value: "double_elimination", label: "더블 엘리미네이션" },
  { value: "round_robin", label: "라운드 로빈" },
  { value: "group_stage", label: "그룹 스테이지" },
  { value: "swiss", label: "스위스" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "초안" },
  { value: "registration", label: "참가 접수 중" },
  { value: "active", label: "진행 중" },
  { value: "completed", label: "종료" },
];

type TournamentData = {
  name: string;
  format: string;
  status: string;
  startDate: string;
  endDate: string;
  registration_start_at: string;
  registration_end_at: string;
  venue_name: string;
  venue_address: string;
  city: string;
  maxTeams: string;
  team_size: string;
  roster_min: string;
  roster_max: string;
  entry_fee: string;
  auto_approve_teams: boolean;
  is_public: boolean;
  description: string;
  rules: string;
  prize_info: string;
  primary_color: string;
  secondary_color: string;
  // 접수 설정
  categories: Record<string, string[]>;
  div_caps: Record<string, number>;
  div_fees: Record<string, number>;
  allow_waiting_list: boolean;
  waiting_list_cap: string;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  fee_notes: string;
};

const STEPS = [
  { id: "basic", label: "기본 정보", icon: "📝" },
  { id: "schedule", label: "일정 / 장소", icon: "📅" },
  { id: "team", label: "팀 설정", icon: "🏀" },
  { id: "registration", label: "접수 설정", icon: "📋" },
  { id: "rules", label: "규칙 / 상금", icon: "📜" },
  { id: "design", label: "디자인", icon: "🎨" },
];

export default function TournamentWizardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<TournamentData>({
    name: "",
    format: "single_elimination",
    status: "draft",
    startDate: "",
    endDate: "",
    registration_start_at: "",
    registration_end_at: "",
    venue_name: "",
    venue_address: "",
    city: "",
    maxTeams: "16",
    team_size: "5",
    roster_min: "5",
    roster_max: "12",
    entry_fee: "0",
    auto_approve_teams: false,
    is_public: true,
    description: "",
    rules: "",
    prize_info: "",
    primary_color: "#E31B23",
    secondary_color: "#E76F51",
    categories: {},
    div_caps: {},
    div_fees: {},
    allow_waiting_list: false,
    waiting_list_cap: "",
    bank_name: "",
    bank_account: "",
    bank_holder: "",
    fee_notes: "",
  });

  const set = (key: keyof TournamentData, value: string | number | boolean) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const toDateInput = (iso: string | null | undefined) => {
    if (!iso) return "";
    return new Date(iso).toISOString().split("T")[0];
  };

  // 기존 대회 데이터 로드
  const loadTournament = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}`);
      if (!res.ok) throw new Error("로드 실패");
      const t = await res.json();
      setData({
        name: t.name ?? "",
        format: t.format ?? "single_elimination",
        status: t.status ?? "draft",
        startDate: toDateInput(t.startDate),
        endDate: toDateInput(t.endDate),
        registration_start_at: toDateInput(t.registration_start_at),
        registration_end_at: toDateInput(t.registration_end_at),
        venue_name: t.venue_name ?? "",
        venue_address: t.venue_address ?? "",
        city: t.city ?? "",
        maxTeams: String(t.maxTeams ?? 16),
        team_size: String(t.team_size ?? 5),
        roster_min: String(t.roster_min ?? 5),
        roster_max: String(t.roster_max ?? 12),
        entry_fee: String(Number(t.entry_fee ?? 0)),
        auto_approve_teams: t.auto_approve_teams ?? false,
        is_public: t.is_public ?? true,
        description: t.description ?? "",
        rules: t.rules ?? "",
        prize_info: t.prize_info ?? "",
        primary_color: t.primary_color ?? "#E31B23",
        secondary_color: t.secondary_color ?? "#E76F51",
        categories: t.categories ?? {},
        div_caps: t.div_caps ?? {},
        div_fees: t.div_fees ?? {},
        allow_waiting_list: t.allow_waiting_list ?? false,
        waiting_list_cap: String(t.waiting_list_cap ?? ""),
        bank_name: t.bank_name ?? "",
        bank_account: t.bank_account ?? "",
        bank_holder: t.bank_holder ?? "",
        fee_notes: t.fee_notes ?? "",
      });
    } catch {
      setError("대회 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadTournament(); }, [loadTournament]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          maxTeams: Number(data.maxTeams) || 0,
          team_size: Number(data.team_size) || 0,
          roster_min: Number(data.roster_min) || 0,
          roster_max: Number(data.roster_max) || 0,
          entry_fee: Number(data.entry_fee) || 0,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          registration_start_at: data.registration_start_at || null,
          registration_end_at: data.registration_end_at || null,
          waiting_list_cap: data.waiting_list_cap ? Number(data.waiting_list_cap) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "저장 실패");
      }
      router.push(`/tournament-admin/tournaments/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50";
  const labelCls = "mb-1 block text-sm text-[var(--color-text-muted)]";

  if (loading)
    return (
      <div className="flex h-40 items-center justify-center text-[var(--color-text-muted)]">불러오는 중...</div>
    );

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => router.push(`/tournament-admin/tournaments/${id}`)}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ← 대회 관리
        </button>
      </div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">대회 설정</h1>

      {/* 스텝 인디케이터 */}
      <div className="mb-6 flex gap-1 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              i === step
                ? "bg-[var(--color-accent)] font-semibold text-white"
                : i < step
                ? "bg-[rgba(74,222,128,0.2)] text-[var(--color-success)]"
                : "bg-[var(--color-elevated)] text-[var(--color-text-muted)]"
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card className="min-h-[320px]">
        {/* STEP 0: 기본 정보 */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">기본 정보</h2>
            <div>
              <label className={labelCls}>대회 이름 *</label>
              <input
                className={inputCls}
                value={data.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="대회 이름 입력"
              />
            </div>
            <div>
              <label className={labelCls}>대회 방식</label>
              <select
                className={inputCls}
                value={data.format}
                onChange={(e) => set("format", e.target.value)}
              >
                {FORMAT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>상태</label>
              <select
                className={inputCls}
                value={data.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>대회 소개</label>
              <textarea
                className={inputCls}
                rows={4}
                value={data.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="대회 소개 입력"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_public"
                checked={data.is_public}
                onChange={(e) => set("is_public", e.target.checked)}
                className="accent-[var(--color-primary)]"
              />
              <label htmlFor="is_public" className="text-sm">공개 대회</label>
            </div>
          </div>
        )}

        {/* STEP 1: 일정 / 장소 — 공유 컴포넌트 사용 */}
        {step === 1 && (
          <ScheduleForm
            data={{
              startDate: data.startDate,
              endDate: data.endDate,
              registrationStartAt: data.registration_start_at,
              registrationEndAt: data.registration_end_at,
              venueName: data.venue_name,
              venueAddress: data.venue_address,
              city: data.city,
            }}
            onChange={(field, value) => {
              // camelCase → snake_case 매핑
              const map: Record<keyof ScheduleFormData, keyof TournamentData> = {
                startDate: "startDate",
                endDate: "endDate",
                registrationStartAt: "registration_start_at",
                registrationEndAt: "registration_end_at",
                venueName: "venue_name",
                venueAddress: "venue_address",
                city: "city",
              };
              set(map[field], value);
            }}
          />
        )}

        {/* STEP 2: 팀 설정 — 공유 컴포넌트 사용 */}
        {step === 2 && (
          <TeamSettingsForm
            data={{
              maxTeams: data.maxTeams,
              teamSize: data.team_size,
              rosterMin: data.roster_min,
              rosterMax: data.roster_max,
              autoApproveTeams: data.auto_approve_teams,
              autoCalcMaxTeams: false,
            }}
            totalDivCaps={Object.values(data.div_caps).reduce((s, v) => s + v, 0)}
            onChange={(field, value) => {
              // camelCase → snake_case 매핑
              const map: Record<keyof TeamSettingsData, keyof TournamentData> = {
                maxTeams: "maxTeams",
                teamSize: "team_size",
                rosterMin: "roster_min",
                rosterMax: "roster_max",
                autoApproveTeams: "auto_approve_teams",
                autoCalcMaxTeams: "auto_approve_teams", // autoCalcMaxTeams는 편집에서 미사용
              };
              set(map[field], value);
            }}
          />
        )}

        {/* STEP 3: 접수 설정 — 공유 컴포넌트 사용 */}
        {step === 3 && (
          <RegistrationSettingsForm
            data={{
              categories: data.categories,
              divCaps: data.div_caps,
              divFees: data.div_fees,
              allowWaitingList: data.allow_waiting_list,
              waitingListCap: data.waiting_list_cap,
              entryFee: data.entry_fee,
              bankName: data.bank_name,
              bankAccount: data.bank_account,
              bankHolder: data.bank_holder,
              feeNotes: data.fee_notes,
            }}
            onChange={(updates) => {
              // camelCase → snake_case 매핑
              setData((prev) => ({
                ...prev,
                ...(updates.categories !== undefined && { categories: updates.categories }),
                ...(updates.divCaps !== undefined && { div_caps: updates.divCaps }),
                ...(updates.divFees !== undefined && { div_fees: updates.divFees }),
                ...(updates.allowWaitingList !== undefined && { allow_waiting_list: updates.allowWaitingList }),
                ...(updates.waitingListCap !== undefined && { waiting_list_cap: updates.waitingListCap }),
                ...(updates.entryFee !== undefined && { entry_fee: updates.entryFee }),
                ...(updates.bankName !== undefined && { bank_name: updates.bankName }),
                ...(updates.bankAccount !== undefined && { bank_account: updates.bankAccount }),
                ...(updates.bankHolder !== undefined && { bank_holder: updates.bankHolder }),
                ...(updates.feeNotes !== undefined && { fee_notes: updates.feeNotes }),
              }));
            }}
          />
        )}

        {/* STEP 4: 규칙 / 상금 */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">규칙 / 상금</h2>
            <div>
              <label className={labelCls}>대회 규칙</label>
              <textarea className={inputCls} rows={6} value={data.rules} onChange={(e) => set("rules", e.target.value)} placeholder="대회 규칙 입력" />
            </div>
            <div>
              <label className={labelCls}>상금 정보</label>
              <textarea className={inputCls} rows={4} value={data.prize_info} onChange={(e) => set("prize_info", e.target.value)} placeholder="상금 정보 입력" />
            </div>
          </div>
        )}

        {/* STEP 5: 디자인 */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">디자인</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>대표 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={data.primary_color}
                    onChange={(e) => set("primary_color", e.target.value)}
                    className="h-12 w-16 cursor-pointer rounded-[12px] border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">{data.primary_color}</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>보조 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={data.secondary_color}
                    onChange={(e) => set("secondary_color", e.target.value)}
                    className="h-12 w-16 cursor-pointer rounded-[12px] border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">{data.secondary_color}</span>
                </div>
              </div>
            </div>
            {/* 미리보기 */}
            <div
              className="mt-4 rounded-[16px] p-6 text-center"
              style={{ background: `linear-gradient(135deg, ${data.primary_color}, ${data.secondary_color})` }}
            >
              <p className="font-bold text-[var(--color-text-primary)] drop-shadow">{data.name || "대회 이름"}</p>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 flex justify-between">
        <Button
          variant="secondary"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          이전
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>다음</Button>
        ) : (
          <Button onClick={save} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        )}
      </div>
    </div>
  );
}
