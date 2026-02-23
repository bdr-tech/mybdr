"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  maxTeams: number;
  team_size: number;
  roster_min: number;
  roster_max: number;
  entry_fee: number;
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
    maxTeams: 16,
    team_size: 5,
    roster_min: 5,
    roster_max: 12,
    entry_fee: 0,
    auto_approve_teams: false,
    is_public: true,
    description: "",
    rules: "",
    prize_info: "",
    primary_color: "#F4A261",
    secondary_color: "#E76F51",
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
        maxTeams: t.maxTeams ?? 16,
        team_size: t.team_size ?? 5,
        roster_min: t.roster_min ?? 5,
        roster_max: t.roster_max ?? 12,
        entry_fee: Number(t.entry_fee ?? 0),
        auto_approve_teams: t.auto_approve_teams ?? false,
        is_public: t.is_public ?? true,
        description: t.description ?? "",
        rules: t.rules ?? "",
        prize_info: t.prize_info ?? "",
        primary_color: t.primary_color ?? "#F4A261",
        secondary_color: t.secondary_color ?? "#E76F51",
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
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          registration_start_at: data.registration_start_at || null,
          registration_end_at: data.registration_end_at || null,
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
    "w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50";
  const labelCls = "mb-1 block text-sm text-[#6B7280]";

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
      <h1 className="mb-6 text-2xl font-bold">대회 설정</h1>

      {/* 스텝 인디케이터 */}
      <div className="mb-6 flex gap-1 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              i === step
                ? "bg-[#0066FF] font-semibold text-white"
                : i < step
                ? "bg-[rgba(74,222,128,0.2)] text-[#4ADE80]"
                : "bg-[#EEF2FF] text-[#6B7280]"
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
                className="accent-[#F4A261]"
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
                <input type="number" className={inputCls} value={data.maxTeams} min={2} onChange={(e) => set("maxTeams", Number(e.target.value))} />
              </div>
              <div>
                <label className={labelCls}>팀당 선수 수</label>
                <input type="number" className={inputCls} value={data.team_size} min={1} onChange={(e) => set("team_size", Number(e.target.value))} />
              </div>
              <div>
                <label className={labelCls}>최소 로스터</label>
                <input type="number" className={inputCls} value={data.roster_min} min={1} onChange={(e) => set("roster_min", Number(e.target.value))} />
              </div>
              <div>
                <label className={labelCls}>최대 로스터</label>
                <input type="number" className={inputCls} value={data.roster_max} min={1} onChange={(e) => set("roster_max", Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>참가비 (원)</label>
              <input type="number" className={inputCls} value={data.entry_fee} min={0} step={1000} onChange={(e) => set("entry_fee", Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="auto_approve"
                checked={data.auto_approve_teams}
                onChange={(e) => set("auto_approve_teams", e.target.checked)}
                className="accent-[#F4A261]"
              />
              <label htmlFor="auto_approve" className="text-sm">팀 자동 승인</label>
            </div>
          </div>
        )}

        {/* STEP 3: 규칙 / 상금 */}
        {step === 3 && (
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

        {/* STEP 4: 디자인 */}
        {step === 4 && (
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
