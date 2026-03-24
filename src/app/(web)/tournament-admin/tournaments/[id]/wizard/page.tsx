"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FIBA_TIMING_DEFAULTS,
  FIBA_SHOT_CLOCK_DEFAULTS,
  FIBA_FOULS_DEFAULTS,
  FIBA_TIMEOUTS_DEFAULTS,
  FIBA_SCORING_DEFAULTS,
} from "@/lib/constants/game-rules-defaults";

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

type GameRulesData = {
  // timing
  quarter_minutes: number;
  overtime_minutes: number;
  halftime_seconds: number;
  quarter_break_seconds: number;
  before_overtime_seconds: number;
  // shot_clock (FR-006)
  shot_clock_full_seconds: number;
  shot_clock_after_offensive_rebound_seconds: number;
  shot_clock_decimal_threshold_seconds: number;
  shot_clock_decimal_precision: number;
  // fouls
  foul_out_limit: number;
  team_bonus_threshold: number;
  team_double_bonus_threshold: number;
  technical_foul_ejection_limit: number;
  // timeouts (FR-010)
  timeout_full_duration_seconds: number;
  timeout_twenty_second_duration_seconds: number;
  timeouts_first_half: number;
  timeouts_second_half: number;
  timeouts_overtime: number;
  bonus_timeout_last2min_enabled: boolean;
  bonus_timeout_last2min_count: number;
  // scoring
  three_point_line_enabled: boolean;
  goaltending_violation_enabled: boolean;
};

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
};

const STEPS = [
  { id: "basic", label: "기본 정보", icon: "📝" },
  { id: "schedule", label: "일정 / 장소", icon: "📅" },
  { id: "team", label: "팀 설정", icon: "🏀" },
  { id: "game_rules", label: "경기 규칙", icon: "⏱" },
  { id: "rules", label: "규칙 / 상금", icon: "📜" },
  { id: "design", label: "디자인", icon: "🎨" },
];

const DEFAULT_GAME_RULES: GameRulesData = {
  quarter_minutes: FIBA_TIMING_DEFAULTS.quarter_minutes,
  overtime_minutes: FIBA_TIMING_DEFAULTS.overtime_minutes,
  halftime_seconds: FIBA_TIMING_DEFAULTS.halftime_seconds,
  quarter_break_seconds: FIBA_TIMING_DEFAULTS.quarter_break_seconds,
  before_overtime_seconds: FIBA_TIMING_DEFAULTS.before_overtime_seconds,
  shot_clock_full_seconds: FIBA_SHOT_CLOCK_DEFAULTS.full_seconds,
  shot_clock_after_offensive_rebound_seconds: FIBA_SHOT_CLOCK_DEFAULTS.after_offensive_rebound_seconds,
  shot_clock_decimal_threshold_seconds: FIBA_SHOT_CLOCK_DEFAULTS.decimal_threshold_seconds,
  shot_clock_decimal_precision: FIBA_SHOT_CLOCK_DEFAULTS.decimal_precision,
  foul_out_limit: FIBA_FOULS_DEFAULTS.foul_out_limit,
  team_bonus_threshold: FIBA_FOULS_DEFAULTS.team_bonus_threshold,
  team_double_bonus_threshold: FIBA_FOULS_DEFAULTS.team_double_bonus_threshold,
  technical_foul_ejection_limit: FIBA_FOULS_DEFAULTS.technical_foul_ejection_limit,
  timeout_full_duration_seconds: FIBA_TIMEOUTS_DEFAULTS.full_duration_seconds,
  timeout_twenty_second_duration_seconds: FIBA_TIMEOUTS_DEFAULTS.twenty_second_duration_seconds,
  timeouts_first_half: FIBA_TIMEOUTS_DEFAULTS.timeouts_first_half,
  timeouts_second_half: FIBA_TIMEOUTS_DEFAULTS.timeouts_second_half,
  timeouts_overtime: FIBA_TIMEOUTS_DEFAULTS.timeouts_overtime,
  bonus_timeout_last2min_enabled: FIBA_TIMEOUTS_DEFAULTS.bonus_timeout_last2min_enabled,
  bonus_timeout_last2min_count: FIBA_TIMEOUTS_DEFAULTS.bonus_timeout_last2min_count,
  three_point_line_enabled: FIBA_SCORING_DEFAULTS.three_point_line_enabled,
  goaltending_violation_enabled: FIBA_SCORING_DEFAULTS.goaltending_violation_enabled,
};

/** 서버 game_rules JSON -> flat GameRulesData 변환 */
function parseGameRules(json: Record<string, unknown> | null | undefined): GameRulesData {
  if (!json) return { ...DEFAULT_GAME_RULES };
  const t = (json.timing ?? {}) as Record<string, unknown>;
  const sc = (json.shot_clock ?? {}) as Record<string, unknown>;
  const f = (json.fouls ?? {}) as Record<string, unknown>;
  const to = (json.timeouts ?? {}) as Record<string, unknown>;
  const s = (json.scoring ?? {}) as Record<string, unknown>;
  return {
    quarter_minutes: (t.quarter_minutes as number) ?? DEFAULT_GAME_RULES.quarter_minutes,
    overtime_minutes: (t.overtime_minutes as number) ?? DEFAULT_GAME_RULES.overtime_minutes,
    halftime_seconds: (t.halftime_seconds as number) ?? DEFAULT_GAME_RULES.halftime_seconds,
    quarter_break_seconds: (t.quarter_break_seconds as number) ?? DEFAULT_GAME_RULES.quarter_break_seconds,
    before_overtime_seconds: (t.before_overtime_seconds as number) ?? DEFAULT_GAME_RULES.before_overtime_seconds,
    shot_clock_full_seconds: (sc.full_seconds as number) ?? DEFAULT_GAME_RULES.shot_clock_full_seconds,
    shot_clock_after_offensive_rebound_seconds: (sc.after_offensive_rebound_seconds as number) ?? DEFAULT_GAME_RULES.shot_clock_after_offensive_rebound_seconds,
    shot_clock_decimal_threshold_seconds: (sc.decimal_threshold_seconds as number) ?? DEFAULT_GAME_RULES.shot_clock_decimal_threshold_seconds,
    shot_clock_decimal_precision: (sc.decimal_precision as number) ?? DEFAULT_GAME_RULES.shot_clock_decimal_precision,
    foul_out_limit: (f.foul_out_limit as number) ?? DEFAULT_GAME_RULES.foul_out_limit,
    team_bonus_threshold: (f.team_bonus_threshold as number) ?? DEFAULT_GAME_RULES.team_bonus_threshold,
    team_double_bonus_threshold: (f.team_double_bonus_threshold as number) ?? DEFAULT_GAME_RULES.team_double_bonus_threshold,
    technical_foul_ejection_limit: (f.technical_foul_ejection_limit as number) ?? DEFAULT_GAME_RULES.technical_foul_ejection_limit,
    timeout_full_duration_seconds: (to.full_duration_seconds as number) ?? DEFAULT_GAME_RULES.timeout_full_duration_seconds,
    timeout_twenty_second_duration_seconds: (to.twenty_second_duration_seconds as number) ?? DEFAULT_GAME_RULES.timeout_twenty_second_duration_seconds,
    timeouts_first_half: (to.timeouts_first_half as number) ?? DEFAULT_GAME_RULES.timeouts_first_half,
    timeouts_second_half: (to.timeouts_second_half as number) ?? DEFAULT_GAME_RULES.timeouts_second_half,
    timeouts_overtime: (to.timeouts_overtime as number) ?? DEFAULT_GAME_RULES.timeouts_overtime,
    bonus_timeout_last2min_enabled: (to.bonus_timeout_last2min_enabled as boolean) ?? DEFAULT_GAME_RULES.bonus_timeout_last2min_enabled,
    bonus_timeout_last2min_count: (to.bonus_timeout_last2min_count as number) ?? DEFAULT_GAME_RULES.bonus_timeout_last2min_count,
    three_point_line_enabled: (s.three_point_line_enabled as boolean) ?? DEFAULT_GAME_RULES.three_point_line_enabled,
    goaltending_violation_enabled: (s.goaltending_violation_enabled as boolean) ?? DEFAULT_GAME_RULES.goaltending_violation_enabled,
  };
}

/** flat GameRulesData -> 섹션별 중첩 JSON (API 저장용) */
function toGameRulesJson(gr: GameRulesData) {
  return {
    timing: {
      quarter_minutes: gr.quarter_minutes,
      overtime_minutes: gr.overtime_minutes,
      halftime_seconds: gr.halftime_seconds,
      quarter_break_seconds: gr.quarter_break_seconds,
      before_overtime_seconds: gr.before_overtime_seconds,
    },
    shot_clock: {
      full_seconds: gr.shot_clock_full_seconds,
      after_offensive_rebound_seconds: gr.shot_clock_after_offensive_rebound_seconds,
      decimal_threshold_seconds: gr.shot_clock_decimal_threshold_seconds,
      decimal_precision: gr.shot_clock_decimal_precision,
    },
    fouls: {
      foul_out_limit: gr.foul_out_limit,
      team_bonus_threshold: gr.team_bonus_threshold,
      team_double_bonus_threshold: gr.team_double_bonus_threshold,
      technical_foul_ejection_limit: gr.technical_foul_ejection_limit,
    },
    timeouts: {
      full_duration_seconds: gr.timeout_full_duration_seconds,
      twenty_second_duration_seconds: gr.timeout_twenty_second_duration_seconds,
      timeouts_first_half: gr.timeouts_first_half,
      timeouts_second_half: gr.timeouts_second_half,
      timeouts_overtime: gr.timeouts_overtime,
      bonus_timeout_last2min_enabled: gr.bonus_timeout_last2min_enabled,
      bonus_timeout_last2min_count: gr.bonus_timeout_last2min_count,
    },
    scoring: {
      three_point_line_enabled: gr.three_point_line_enabled,
      goaltending_violation_enabled: gr.goaltending_violation_enabled,
    },
  };
}

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
  });
  const [gameRules, setGameRules] = useState<GameRulesData>({ ...DEFAULT_GAME_RULES });

  const set = (key: keyof TournamentData, value: string | number | boolean) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const setGR = (key: keyof GameRulesData, value: number | boolean) =>
    setGameRules((prev) => ({ ...prev, [key]: value }));

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
        startDate: toDateInput(t.startDate ?? t.start_date),
        endDate: toDateInput(t.endDate ?? t.end_date),
        registration_start_at: toDateInput(t.registration_start_at),
        registration_end_at: toDateInput(t.registration_end_at),
        venue_name: t.venue_name ?? "",
        venue_address: t.venue_address ?? "",
        city: t.city ?? "",
        maxTeams: String(t.maxTeams ?? t.max_teams ?? 16),
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
      });
      // game_rules 로드
      setGameRules(parseGameRules(t.game_rules));
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
          game_rules: toGameRulesJson(gameRules),
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

  const resetGameRulesToFiba = () => {
    setGameRules({ ...DEFAULT_GAME_RULES });
  };

  const inputCls =
    "w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B3C87]/50";
  const labelCls = "mb-1 block text-sm text-[#6B7280]";
  const sectionTitleCls = "mt-4 mb-2 text-sm font-semibold text-[#374151]";

  if (loading)
    return (
      <div className="flex h-40 items-center justify-center text-[#6B7280]">불러오는 중...</div>
    );

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => router.push(`/tournament-admin/tournaments/${id}`)}
          className="text-sm text-[#6B7280] hover:text-[#111827]"
        >
          ← 대회 관리
        </button>
      </div>
      <h1 className="mb-6 text-xl sm:text-2xl font-bold">대회 설정</h1>

      {/* 스텝 인디케이터 */}
      <div className="mb-6 flex gap-1 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              i === step
                ? "bg-[#1B3C87] font-semibold text-white"
                : i < step
                ? "bg-[rgba(74,222,128,0.2)] text-[#16A34A]"
                : "bg-[#EDF0F8] text-[#6B7280]"
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
                className="accent-[#E31B23]"
              />
              <label htmlFor="is_public" className="text-sm">공개 대회</label>
            </div>
          </div>
        )}

        {/* STEP 1: 일정 / 장소 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">일정 / 장소</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>대회 시작일</label>
                <input type="date" className={inputCls} value={data.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>대회 종료일</label>
                <input type="date" className={inputCls} value={data.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>참가 접수 시작</label>
                <input type="date" className={inputCls} value={data.registration_start_at} onChange={(e) => set("registration_start_at", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>참가 접수 마감</label>
                <input type="date" className={inputCls} value={data.registration_end_at} onChange={(e) => set("registration_end_at", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>경기장 이름</label>
              <input className={inputCls} value={data.venue_name} onChange={(e) => set("venue_name", e.target.value)} placeholder="경기장 이름" />
            </div>
            <div>
              <label className={labelCls}>주소</label>
              <input className={inputCls} value={data.venue_address} onChange={(e) => set("venue_address", e.target.value)} placeholder="상세 주소" />
            </div>
            <div>
              <label className={labelCls}>도시</label>
              <input className={inputCls} value={data.city} onChange={(e) => set("city", e.target.value)} placeholder="서울, 부산 등" />
            </div>
          </div>
        )}

        {/* STEP 2: 팀 설정 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">팀 설정</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>최대 팀 수</label>
                <input type="number" className={inputCls} value={data.maxTeams} min={2} onChange={(e) => set("maxTeams", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>팀당 선수 수</label>
                <input type="number" className={inputCls} value={data.team_size} min={1} onChange={(e) => set("team_size", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>최소 로스터</label>
                <input type="number" className={inputCls} value={data.roster_min} min={1} onChange={(e) => set("roster_min", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>최대 로스터</label>
                <input type="number" className={inputCls} value={data.roster_max} min={1} onChange={(e) => set("roster_max", e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>참가비 (원)</label>
              <input type="number" className={inputCls} value={data.entry_fee} min={0} step={1000} onChange={(e) => set("entry_fee", e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="auto_approve"
                checked={data.auto_approve_teams}
                onChange={(e) => set("auto_approve_teams", e.target.checked)}
                className="accent-[#E31B23]"
              />
              <label htmlFor="auto_approve" className="text-sm">팀 자동 승인</label>
            </div>
          </div>
        )}

        {/* STEP 3: 경기 규칙 (FR-006, FR-010) */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">경기 규칙</h2>
              <Button variant="ghost" onClick={resetGameRulesToFiba} className="text-xs">
                FIBA 기본값으로 초기화
              </Button>
            </div>
            <p className="text-xs text-[#6B7280]">
              bdr_stat 앱에서 이 설정을 자동으로 읽습니다. 비어있으면 FIBA 기본값이 적용됩니다.
            </p>

            {/* 시간 설정 */}
            <h3 className={sectionTitleCls}>시간 설정</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>쿼터 시간 (분)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.quarter_minutes}
                  min={1}
                  max={20}
                  onChange={(e) => setGR("quarter_minutes", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>연장전 시간 (분)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.overtime_minutes}
                  min={1}
                  max={10}
                  onChange={(e) => setGR("overtime_minutes", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>하프타임 휴식 (초)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.halftime_seconds}
                  min={0}
                  max={1800}
                  step={30}
                  onChange={(e) => setGR("halftime_seconds", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>쿼터 간 휴식 (초)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.quarter_break_seconds}
                  min={0}
                  max={600}
                  step={30}
                  onChange={(e) => setGR("quarter_break_seconds", Number(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* 샷클락 (FR-006) */}
            <h3 className={sectionTitleCls}>샷클락</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>샷클락 (초)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.shot_clock_full_seconds}
                  min={10}
                  max={60}
                  onChange={(e) => setGR("shot_clock_full_seconds", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>공격 리바운드 후 샷클락 (초)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.shot_clock_after_offensive_rebound_seconds}
                  min={5}
                  max={30}
                  onChange={(e) => setGR("shot_clock_after_offensive_rebound_seconds", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>소수점 표시 기준 (초 미만)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.shot_clock_decimal_threshold_seconds}
                  min={0}
                  max={24}
                  onChange={(e) => setGR("shot_clock_decimal_threshold_seconds", Number(e.target.value) || 0)}
                />
                <p className="mt-1 text-xs text-[#9CA3AF]">이 시간 미만부터 소수점 표시 (FIBA: 5초)</p>
              </div>
              <div>
                <label className={labelCls}>소수점 자릿수</label>
                <select
                  className={inputCls}
                  value={gameRules.shot_clock_decimal_precision}
                  onChange={(e) => setGR("shot_clock_decimal_precision", Number(e.target.value))}
                >
                  <option value={0}>없음 (정수만)</option>
                  <option value={1}>1/10초 (4.7)</option>
                  <option value={2}>1/100초 (4.72)</option>
                </select>
              </div>
            </div>

            {/* 파울 */}
            <h3 className={sectionTitleCls}>파울</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>파울아웃 한도</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.foul_out_limit}
                  min={3}
                  max={10}
                  onChange={(e) => setGR("foul_out_limit", Number(e.target.value) || 0)}
                />
                <p className="mt-1 text-xs text-[#9CA3AF]">FIBA: 5, NBA: 6</p>
              </div>
              <div>
                <label className={labelCls}>팀 보너스 기준 (파울 수)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.team_bonus_threshold}
                  min={1}
                  max={10}
                  onChange={(e) => setGR("team_bonus_threshold", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>테크니컬 파울 퇴장 한도</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.technical_foul_ejection_limit}
                  min={1}
                  max={5}
                  onChange={(e) => setGR("technical_foul_ejection_limit", Number(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* 타임아웃 (FR-010) */}
            <h3 className={sectionTitleCls}>타임아웃</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelCls}>전반 타임아웃 횟수</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.timeouts_first_half}
                  min={0}
                  max={10}
                  onChange={(e) => setGR("timeouts_first_half", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>후반 타임아웃 횟수</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.timeouts_second_half}
                  min={0}
                  max={10}
                  onChange={(e) => setGR("timeouts_second_half", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>연장전 타임아웃 횟수</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.timeouts_overtime}
                  min={0}
                  max={5}
                  onChange={(e) => setGR("timeouts_overtime", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>일반 타임아웃 시간 (초)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.timeout_full_duration_seconds}
                  min={10}
                  max={120}
                  onChange={(e) => setGR("timeout_full_duration_seconds", Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>20초 타임아웃 시간 (초)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={gameRules.timeout_twenty_second_duration_seconds}
                  min={10}
                  max={60}
                  onChange={(e) => setGR("timeout_twenty_second_duration_seconds", Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="mt-2 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="bonus_timeout"
                  checked={gameRules.bonus_timeout_last2min_enabled}
                  onChange={(e) => setGR("bonus_timeout_last2min_enabled", e.target.checked)}
                  className="accent-[#E31B23]"
                />
                <label htmlFor="bonus_timeout" className="text-sm">마지막 2분 보너스 타임아웃</label>
              </div>
              {gameRules.bonus_timeout_last2min_enabled && (
                <div className="ml-8">
                  <label className={labelCls}>보너스 타임아웃 횟수</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={gameRules.bonus_timeout_last2min_count}
                    min={0}
                    max={3}
                    onChange={(e) => setGR("bonus_timeout_last2min_count", Number(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>

            {/* 기타 */}
            <h3 className={sectionTitleCls}>기타</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="three_point"
                  checked={gameRules.three_point_line_enabled}
                  onChange={(e) => setGR("three_point_line_enabled", e.target.checked)}
                  className="accent-[#E31B23]"
                />
                <label htmlFor="three_point" className="text-sm">3점 라인 사용</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="goaltending"
                  checked={gameRules.goaltending_violation_enabled}
                  onChange={(e) => setGR("goaltending_violation_enabled", e.target.checked)}
                  className="accent-[#E31B23]"
                />
                <label htmlFor="goaltending" className="text-sm">골텐딩 바이올레이션 적용</label>
              </div>
            </div>
          </div>
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
                  <span className="text-sm text-[#6B7280]">{data.primary_color}</span>
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
                  <span className="text-sm text-[#6B7280]">{data.secondary_color}</span>
                </div>
              </div>
            </div>
            {/* 미리보기 */}
            <div
              className="mt-4 rounded-[16px] p-6 text-center"
              style={{ background: `linear-gradient(135deg, ${data.primary_color}, ${data.secondary_color})` }}
            >
              <p className="font-bold text-[#111827] drop-shadow">{data.name || "대회 이름"}</p>
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
