"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScheduleForm, type ScheduleFormData } from "@/components/tournament/schedule-form";
import {
  RegistrationSettingsForm,
  type RegistrationSettingsData,
} from "@/components/tournament/registration-settings-form";
import { TeamSettingsForm, type TeamSettingsData } from "@/components/tournament/team-settings-form";

const STEPS = [
  { id: "template", label: "템플릿", icon: "🎨" },
  { id: "info", label: "기본 정보", icon: "📝" },
  { id: "schedule", label: "일정/장소", icon: "📅" },
  { id: "registration", label: "접수 설정", icon: "📋" },
  { id: "team", label: "팀 설정", icon: "🏀" },
  { id: "design", label: "디자인", icon: "🎨" },
  { id: "preview", label: "미리보기", icon: "👁" },
];

const FORMAT_OPTIONS = [
  "싱글 엘리미네이션",
  "라운드 로빈",
  "그룹 스테이지",
  "더블 엘리미네이션",
  "스위스",
];

const inputCls =
  "w-full rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50";

type AuthStatus = "loading" | "unauthenticated" | "unauthorized" | "authorized";

export default function NewTournamentWizardPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 0: 템플릿
  const [template, setTemplate] = useState("기본형");

  // Step 1: 기본 정보
  const [name, setName] = useState("");
  const [format, setFormat] = useState("싱글 엘리미네이션");
  const [description, setDescription] = useState("");

  // Step 2: 일정/장소
  const [schedule, setSchedule] = useState<ScheduleFormData>({
    startDate: "",
    endDate: "",
    registrationStartAt: "",
    registrationEndAt: "",
    venueName: "",
    venueAddress: "",
    city: "",
  });

  // Step 3: 접수 설정
  const [registration, setRegistration] = useState<RegistrationSettingsData>({
    categories: {},
    divCaps: {},
    divFees: {},
    allowWaitingList: false,
    waitingListCap: "",
    entryFee: "0",
    bankName: "",
    bankAccount: "",
    bankHolder: "",
    feeNotes: "",
  });

  // Step 4: 팀 설정
  const [teamSettings, setTeamSettings] = useState<TeamSettingsData>({
    maxTeams: "16",
    teamSize: "5",
    rosterMin: "5",
    rosterMax: "12",
    autoApproveTeams: false,
    autoCalcMaxTeams: false,
  });

  // Step 5: 디자인
  const [primaryColor, setPrimaryColor] = useState("#E31B23");
  const [secondaryColor, setSecondaryColor] = useState("#E76F51");
  const [subdomain, setSubdomain] = useState("");

  // 디비전 정원 합산
  const totalDivCaps = Object.values(registration.divCaps).reduce((s, v) => s + v, 0);

  // 인증 체크
  useEffect(() => {
    fetch("/api/web/me")
      .then((res) => {
        if (!res.ok) {
          setAuthStatus("unauthenticated");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const role = (data.role ?? data.data?.role ?? "") as string;
        if (["super_admin", "organizer", "admin", "tournament_admin"].includes(role)) {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
        }
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?redirect=/tournament-admin/tournaments/new/wizard");
    }
  }, [authStatus, router]);

  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[var(--color-text-muted)]">로딩 중...</div>
      </div>
    );
  }

  if (authStatus === "unauthorized") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">권한이 필요합니다</h1>
        <p className="max-w-md text-sm text-[var(--color-text-muted)]">
          대회를 만들려면 <strong>대회 관리자</strong> 이상의 권한이 필요합니다.
          <br />
          운영자에게 문의해주세요.
        </p>
        <Link
          href="/tournaments"
          className="mt-2 rounded-full bg-[var(--color-accent)] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          대회 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // 다음 스텝 이동 (유효성 검사)
  function goNext() {
    if (currentStep === 1 && !name.trim()) {
      setError("대회 이름을 입력하세요.");
      return;
    }
    setError(null);
    setCurrentStep(currentStep + 1);
  }

  // 생성 요청
  async function handleCreate() {
    setLoading(true);
    setError(null);

    const effectiveMaxTeams =
      teamSettings.autoCalcMaxTeams && totalDivCaps > 0
        ? totalDivCaps
        : Number(teamSettings.maxTeams) || 16;

    try {
      const res = await fetch("/api/web/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          name,
          format,
          description: description || undefined,
          // 일정
          startDate: schedule.startDate || undefined,
          endDate: schedule.endDate || undefined,
          registrationStartAt: schedule.registrationStartAt || undefined,
          registrationEndAt: schedule.registrationEndAt || undefined,
          venueName: schedule.venueName || undefined,
          venueAddress: schedule.venueAddress || undefined,
          city: schedule.city || undefined,
          // 접수
          categories: Object.keys(registration.categories).length > 0 ? registration.categories : undefined,
          divCaps: Object.keys(registration.divCaps).length > 0 ? registration.divCaps : undefined,
          divFees: Object.keys(registration.divFees).length > 0 ? registration.divFees : undefined,
          allowWaitingList: registration.allowWaitingList || undefined,
          waitingListCap: registration.waitingListCap ? Number(registration.waitingListCap) : undefined,
          entryFee: Number(registration.entryFee) || undefined,
          bankName: registration.bankName || undefined,
          bankAccount: registration.bankAccount || undefined,
          bankHolder: registration.bankHolder || undefined,
          feeNotes: registration.feeNotes || undefined,
          // 팀 설정
          maxTeams: effectiveMaxTeams,
          teamSize: Number(teamSettings.teamSize) || 5,
          rosterMin: Number(teamSettings.rosterMin) || 5,
          rosterMax: Number(teamSettings.rosterMax) || 12,
          autoApproveTeams: teamSettings.autoApproveTeams || undefined,
          // 디자인
          primaryColor,
          secondaryColor,
          subdomain: subdomain || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(data.redirect_url ?? data.redirectUrl ?? "/tournament-admin/tournaments");
      } else {
        setError(data.error ?? "오류가 발생했습니다.");
        setLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">새 대회 만들기</h1>

      {/* Step Indicator */}
      <div className="mb-8 flex gap-1 overflow-x-auto">
        {STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => i < currentStep && setCurrentStep(i)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              i === currentStep
                ? "bg-[var(--color-accent)] font-semibold text-white"
                : i < currentStep
                  ? "cursor-pointer bg-[rgba(74,222,128,0.2)] text-[var(--color-success)]"
                  : "cursor-not-allowed bg-[var(--color-elevated)] text-[var(--color-text-muted)]"
            }`}
          >
            <span>{step.icon}</span>
            {step.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <Card className="min-h-[300px]">
        {/* Step 0: 템플릿 */}
        {currentStep === 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold">템플릿 선택</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {["기본형", "리그형", "토너먼트형"].map((t) => (
                <div
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`cursor-pointer rounded-[16px] border p-6 text-center transition-colors ${
                    template === t
                      ? "border-[var(--color-accent)] bg-[rgba(27,60,135,0.08)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  <div className="mb-2 text-2xl">🏆</div>
                  <p className="font-medium">{t}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: 기본 정보 */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">기본 정보</h2>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]">대회 이름 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="대회 이름 입력"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]">대회 방식</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className={inputCls}
              >
                {FORMAT_OPTIONS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]">대회 소개</label>
              <textarea
                className={inputCls}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="대회 소개 입력"
              />
            </div>
          </div>
        )}

        {/* Step 2: 일정/장소 */}
        {currentStep === 2 && (
          <ScheduleForm
            data={schedule}
            onChange={(field, value) => setSchedule((prev) => ({ ...prev, [field]: value }))}
          />
        )}

        {/* Step 3: 접수 설정 */}
        {currentStep === 3 && (
          <RegistrationSettingsForm
            data={registration}
            onChange={(updates) => setRegistration((prev) => ({ ...prev, ...updates }))}
          />
        )}

        {/* Step 4: 팀 설정 */}
        {currentStep === 4 && (
          <TeamSettingsForm
            data={teamSettings}
            totalDivCaps={totalDivCaps}
            onChange={(field, value) =>
              setTeamSettings((prev) => ({ ...prev, [field]: value }))
            }
          />
        )}

        {/* Step 5: 디자인 */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">디자인 / URL</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-[var(--color-text-muted)]">대표 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-16 cursor-pointer rounded-[12px] border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">{primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--color-text-muted)]">보조 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-12 w-16 cursor-pointer rounded-[12px] border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">{secondaryColor}</span>
                </div>
              </div>
            </div>

            {/* 미리보기 */}
            <div
              className="rounded-[16px] p-6 text-center"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              <p className="font-bold text-white drop-shadow">{name || "대회 이름"}</p>
            </div>

            {/* URL */}
            <div>
              <label className="mb-1 block text-sm text-[var(--color-text-muted)]">서브도메인 (선택)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) =>
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  className={`flex-1 ${inputCls}`}
                  placeholder="my-tournament"
                />
                <span className="text-sm text-[var(--color-text-muted)]">.mybdr.kr</span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">비워두면 대회 ID로 접근합니다.</p>
            </div>
          </div>
        )}

        {/* Step 6: 미리보기 */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="mb-2 text-center text-4xl">🎉</div>
            <h2 className="text-center text-lg font-semibold">대회 생성 미리보기</h2>

            <div className="space-y-3 rounded-[16px] bg-[var(--color-elevated)] p-4 text-sm">
              <Row label="대회명" value={name || "미입력"} />
              <Row label="형식" value={format} />
              <Row
                label="대회 기간"
                value={
                  schedule.startDate
                    ? `${schedule.startDate} ~ ${schedule.endDate || "미정"}`
                    : "미정"
                }
              />
              <Row
                label="접수 기간"
                value={
                  schedule.registrationStartAt
                    ? `${schedule.registrationStartAt} ~ ${schedule.registrationEndAt || "미정"}`
                    : "미설정"
                }
              />
              <Row
                label="장소"
                value={
                  [schedule.city, schedule.venueName].filter(Boolean).join(" ") || "미설정"
                }
              />

              {/* 부문/디비전 */}
              {Object.keys(registration.categories).length > 0 && (
                <div className="border-t border-[var(--color-accent)]/10 pt-2">
                  <span className="text-[var(--color-text-muted)]">부문/디비전</span>
                  <div className="mt-1 space-y-1">
                    {Object.entries(registration.categories).map(([cat, divs]) => (
                      <div key={cat} className="flex gap-2">
                        <span className="font-medium">{cat}:</span>
                        <span>
                          {divs
                            .map((d) => {
                              const cap = registration.divCaps[d];
                              const fee = registration.divFees[d];
                              let label = d;
                              if (cap) label += ` (${cap}팀)`;
                              if (fee) label += ` ${fee.toLocaleString()}원`;
                              return label;
                            })
                            .join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Row
                label="참가비"
                value={
                  Number(registration.entryFee) > 0
                    ? `${Number(registration.entryFee).toLocaleString()}원`
                    : "무료"
                }
              />
              <Row
                label="최대 팀"
                value={`${teamSettings.autoCalcMaxTeams && totalDivCaps > 0 ? totalDivCaps : teamSettings.maxTeams}팀`}
              />
              <Row
                label="로스터"
                value={`${teamSettings.rosterMin} ~ ${teamSettings.rosterMax}명`}
              />

              {registration.bankName && (
                <Row
                  label="입금계좌"
                  value={`${registration.bankName} ${registration.bankAccount} (${registration.bankHolder})`}
                />
              )}

              <Row
                label="URL"
                value={subdomain ? `${subdomain}.mybdr.kr` : "자동 생성"}
              />
            </div>
          </div>
        )}
      </Card>

      {/* 네비게이션 */}
      <div className="mt-4 flex justify-between">
        <Button
          variant="secondary"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0 || loading}
        >
          이전
        </Button>
        {currentStep < STEPS.length - 1 ? (
          <Button onClick={goNext}>다음</Button>
        ) : (
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "생성 중..." : "대회 생성"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
