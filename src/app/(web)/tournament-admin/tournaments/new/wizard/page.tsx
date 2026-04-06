"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TossCard } from "@/components/toss/toss-card";
import { ScheduleForm, type ScheduleFormData, type PlaceInfo } from "@/components/tournament/schedule-form";
import {
  RegistrationSettingsForm,
  type RegistrationSettingsData,
} from "@/components/tournament/registration-settings-form";
import { TeamSettingsForm, type TeamSettingsData } from "@/components/tournament/team-settings-form";
import { GameTimeInput } from "@/components/tournament/game-time-input";
import { GameBallInput } from "@/components/tournament/game-ball-input";
// GameMethodInput 제거 — 대회 방식은 FORMAT_OPTIONS 4종으로 통합
import { DivisionGeneratorModal } from "@/components/tournament/division-generator-modal";
import { ImageUploader } from "@/components/shared/image-uploader";
import { TournamentCopyModal, type CopyData } from "@/components/tournament/tournament-copy-modal";

// --- 3단계 구성 (기존 8탭 → 3단계로 간소화) ---
const STEPS = [
  { key: "info", label: "대회 정보", icon: "emoji_events" },
  { key: "registration", label: "참가 설정", icon: "group_add" },
  { key: "confirm", label: "확인 및 생성", icon: "check_circle" },
];

// 대회 방식 옵션 (4종만)
const FORMAT_OPTIONS = [
  { value: "group_stage_knockout", label: "조별리그+토너먼트" },
  { value: "dual_tournament", label: "듀얼토너먼트" },
  { value: "single_elimination", label: "토너먼트" },
  { value: "full_league_knockout", label: "풀리그+토너먼트" },
];

// 성별 옵션 — BDR은 남성부/여성부만 운영 (혼성 없음)
const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

// 토스 스타일 인풋 — surface 배경, border 없음, rounded-md
const inputCls =
  "w-full rounded-md border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50";
const labelCls = "mb-1 block text-sm text-[var(--color-text-muted)]";

// pill 버튼 — 선택 상태에 따라 accent/border 배경
const pillCls = (active: boolean) =>
  `rounded-[4px] px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
    active
      ? "bg-[var(--color-accent)] text-white"
      : "bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-active)]"
  }`;

// 섹션 제목 컴포넌트 — Material Symbols 아이콘 + bold
function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
      <span className="material-symbols-outlined text-lg text-[var(--color-accent)]">{icon}</span>
      {children}
    </h3>
  );
}

type AuthStatus = "loading" | "unauthenticated" | "unauthorized" | "authorized";

export default function NewTournamentWizardPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [showDivisionGenerator, setShowDivisionGenerator] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  // --- Step 1에서 사용하는 state (기본정보 + 일정/장소 + 경기설정) ---
  const [name, setName] = useState("");
  const [format, setFormat] = useState("group_stage_knockout");
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState("");   // 주최
  const [host, setHost] = useState("");             // 주관
  const [sponsors, setSponsors] = useState("");     // 후원사
  const [gender, setGender] = useState("male");     // 성별 (기본: 남성)
  const [rules, setRules] = useState("");           // 규칙
  const [prizeInfo, setPrizeInfo] = useState("");   // 상금 정보

  // 일정/장소 (places 배열 포함)
  const [schedule, setSchedule] = useState<ScheduleFormData>({
    startDate: "",
    endDate: "",
    registrationStartAt: "",
    registrationEndAt: "",
    venueName: "",
    venueAddress: "",
    city: "",
    places: [],
  });

  // 경기 설정
  const [gameTime, setGameTime] = useState("");
  const [gameBall, setGameBall] = useState("");
  const [gameMethod, setGameMethod] = useState("");

  // --- Step 2에서 사용하는 state (접수설정 + 팀설정) ---
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

  const [teamSettings, setTeamSettings] = useState<TeamSettingsData>({
    maxTeams: "16",
    teamSize: "5",
    rosterMin: "5",
    rosterMax: "12",
    autoApproveTeams: false,
    autoCalcMaxTeams: false,
  });

  // --- Step 3에서 사용하는 state (디자인) ---
  const [designTemplate, setDesignTemplate] = useState("basic");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#E31B23");
  const [secondaryColor, setSecondaryColor] = useState("#E76F51");
  const [subdomain, setSubdomain] = useState("");

  // 디비전 정원 합산 — 자동 계산에 사용
  const totalDivCaps = Object.values(registration.divCaps).reduce((s, v) => s + v, 0);

  // 이전 대회 복사 적용 — 모든 필드를 한 번에 덮어씌움
  const handleCopyApply = useCallback((data: CopyData) => {
    if (data.format) setFormat(data.format);
    if (data.description) setDescription(data.description);
    if (data.organizer) setOrganizer(data.organizer);
    if (data.host) setHost(data.host);
    if (data.sponsors) setSponsors(data.sponsors);
    if (data.gender) setGender(data.gender);
    if (data.rules) setRules(data.rules);
    if (data.prizeInfo) setPrizeInfo(data.prizeInfo);
    if (data.venueName || data.venueAddress || data.city || data.places) {
      setSchedule((prev) => ({
        ...prev,
        venueName: data.venueName ?? prev.venueName,
        venueAddress: data.venueAddress ?? prev.venueAddress,
        city: data.city ?? prev.city,
        places: data.places ?? prev.places,
      }));
    }
    if (data.gameTime) setGameTime(data.gameTime);
    if (data.gameBall) setGameBall(data.gameBall);
    if (data.gameMethod) setGameMethod(data.gameMethod);
    if (data.categories || data.divCaps || data.divFees || data.entryFee || data.bankName) {
      setRegistration((prev) => ({
        ...prev,
        categories: data.categories ?? prev.categories,
        divCaps: data.divCaps ?? prev.divCaps,
        divFees: data.divFees ?? prev.divFees,
        entryFee: data.entryFee ?? prev.entryFee,
        bankName: data.bankName ?? prev.bankName,
        bankAccount: data.bankAccount ?? prev.bankAccount,
        bankHolder: data.bankHolder ?? prev.bankHolder,
        feeNotes: data.feeNotes ?? prev.feeNotes,
      }));
    }
    if (data.maxTeams || data.teamSize || data.rosterMin || data.rosterMax) {
      setTeamSettings((prev) => ({
        ...prev,
        maxTeams: data.maxTeams ?? prev.maxTeams,
        teamSize: data.teamSize ?? prev.teamSize,
        rosterMin: data.rosterMin ?? prev.rosterMin,
        rosterMax: data.rosterMax ?? prev.rosterMax,
      }));
    }
    if (data.primaryColor) setPrimaryColor(data.primaryColor);
    if (data.secondaryColor) setSecondaryColor(data.secondaryColor);
  }, []);

  // 종별 자동생성기 적용
  const handleDivisionApply = useCallback((categories: Record<string, string[]>) => {
    setRegistration((prev) => ({
      ...prev,
      categories: { ...prev.categories, ...categories },
    }));
  }, []);

  // 인증 체크 — 관리자 이상만 접근 가능
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

  // 로딩/미인증 상태
  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[var(--color-text-muted)]">로딩 중...</div>
      </div>
    );
  }

  // 권한 없음
  if (authStatus === "unauthorized") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <span className="material-symbols-outlined text-5xl text-[var(--color-text-muted)]">lock</span>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">권한이 필요합니다</h1>
        <p className="max-w-md text-sm text-[var(--color-text-muted)]">
          대회를 만들려면 <strong>대회 관리자</strong> 이상의 권한이 필요합니다.
          <br />
          운영자에게 문의해주세요.
        </p>
        <Link
          href="/tournaments"
          className="mt-2 rounded-[4px] bg-[var(--color-accent)] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          대회 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // 다음 단계 이동 — Step 0에서 대회명 필수 검증
  function goNext() {
    if (currentStep === 0 && !name.trim()) {
      setError("대회 이름을 입력하세요.");
      return;
    }
    setError(null);
    setCurrentStep(currentStep + 1);
    // 스크롤 최상단으로 이동 (긴 폼이므로)
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 대회 생성 API 호출 — 기존 로직 100% 유지
  async function handleCreate() {
    setLoading(true);
    setError(null);

    // 디비전 정원 합산이 있으면 자동 계산, 없으면 수동 입력값
    const effectiveMaxTeams =
      teamSettings.autoCalcMaxTeams && totalDivCaps > 0
        ? totalDivCaps
        : Number(teamSettings.maxTeams) || 16;

    try {
      const res = await fetch("/api/web/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          format,
          description: description || undefined,
          organizer: organizer || undefined,
          host: host || undefined,
          sponsors: sponsors || undefined,
          gender: gender || undefined,
          rules: rules || undefined,
          prizeInfo: prizeInfo || undefined,
          startDate: schedule.startDate || undefined,
          endDate: schedule.endDate || undefined,
          registrationStartAt: schedule.registrationStartAt || undefined,
          registrationEndAt: schedule.registrationEndAt || undefined,
          venueName: schedule.venueName || undefined,
          venueAddress: schedule.venueAddress || undefined,
          city: schedule.city || undefined,
          places: schedule.places.length > 0 ? schedule.places : undefined,
          gameTime: gameTime || undefined,
          gameBall: gameBall || undefined,
          gameMethod: gameMethod || undefined,
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
          maxTeams: effectiveMaxTeams,
          teamSize: Number(teamSettings.teamSize) || 5,
          rosterMin: Number(teamSettings.rosterMin) || 5,
          rosterMax: Number(teamSettings.rosterMax) || 12,
          autoApproveTeams: teamSettings.autoApproveTeams || undefined,
          designTemplate: designTemplate || undefined,
          logoUrl: logoUrl || undefined,
          bannerUrl: bannerUrl || undefined,
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
    <div className="mx-auto max-w-3xl">
      {/* === 헤더: 타이틀 + 이전 대회 복사 버튼 === */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">새 대회 만들기</h1>
        <button
          onClick={() => setShowCopyModal(true)}
          className="flex items-center gap-1 rounded-[4px] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
        >
          <span className="material-symbols-outlined text-base">content_copy</span>
          이전 대회에서 복사
        </button>
      </div>

      {/* === 3단계 탭 인디케이터 === */}
      <div className="mb-6 flex gap-2">
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => {
              // 이전 단계로만 이동 가능 (클릭으로 되돌아가기)
              if (i < currentStep) {
                setCurrentStep(i);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[4px] py-3 text-sm font-semibold transition-colors ${
              i === currentStep
                ? "bg-[var(--color-accent)] text-white"
                : i < currentStep
                  ? "cursor-pointer bg-[rgba(74,222,128,0.15)] text-[var(--color-success)]"
                  : "cursor-not-allowed bg-[var(--color-elevated)] text-[var(--color-text-muted)]"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {/* 완료된 단계는 체크 아이콘 */}
              {i < currentStep ? "check_circle" : step.icon}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* ================================================================
       * Step 1: 대회 정보 (기본정보 + 일정/장소 + 경기설정)
       * 하나의 긴 폼을 TossCard 섹션으로 구분
       * ================================================================ */}
      {currentStep === 0 && (
        <div className="space-y-4">
          {/* --- 섹션 1: 기본 정보 --- */}
          <TossCard className="space-y-4 hover:scale-100">
            <SectionTitle icon="edit_note">기본 정보</SectionTitle>

            {/* 대회명 (필수) */}
            <div>
              <label className={labelCls}>대회 이름 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="대회 이름 입력"
              />
            </div>

            {/* 주최 / 주관 / 후원사 */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>주최</label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className={inputCls}
                  placeholder="주최 단체/기관"
                />
              </div>
              <div>
                <label className={labelCls}>주관</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className={inputCls}
                  placeholder="주관 단체/기관"
                />
              </div>
              <div>
                <label className={labelCls}>후원</label>
                <input
                  type="text"
                  value={sponsors}
                  onChange={(e) => setSponsors(e.target.value)}
                  className={inputCls}
                  placeholder="후원사 (쉼표 구분)"
                />
              </div>
            </div>

            {/* 성별 pill */}
            <div>
              <label className={labelCls}>성별</label>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={pillCls(gender === g.value)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 대회 설명 */}
            <div>
              <label className={labelCls}>대회 소개</label>
              <textarea
                className={inputCls}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="대회 소개 입력"
              />
            </div>

            {/* 규칙 */}
            <div>
              <label className={labelCls}>규칙</label>
              <textarea
                className={inputCls}
                rows={3}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="대회 규칙 (예: KBL 규칙 준용, 파울 5개 퇴장 등)"
              />
            </div>

            {/* 상금 정보 */}
            <div>
              <label className={labelCls}>상금 / 시상 정보</label>
              <textarea
                className={inputCls}
                rows={2}
                value={prizeInfo}
                onChange={(e) => setPrizeInfo(e.target.value)}
                placeholder="우승 100만원, 준우승 50만원 등"
              />
            </div>
          </TossCard>

          {/* --- 섹션 2: 일정 및 장소 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="calendar_month">일정 및 장소</SectionTitle>
            {/* ScheduleForm 서브 컴포넌트 재사용 (기존 그대로) */}
            <div className="mt-4">
              <ScheduleForm
                data={schedule}
                onChange={(field, value) =>
                  setSchedule((prev) => ({ ...prev, [field]: value }))
                }
              />
            </div>
          </TossCard>

          {/* --- 섹션 3: 경기 설정 --- */}
          <TossCard className="space-y-6 hover:scale-100">
            <SectionTitle icon="sports_basketball">경기 설정</SectionTitle>

            {/* 대회 방식 (FORMAT은 select → GameMethodInput 4종 pill) */}
            <div>
              <label className={labelCls}>대회 방식</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className={inputCls}
              >
                {FORMAT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* 경기시간 프리셋 */}
            <GameTimeInput value={gameTime} onChange={setGameTime} />

            {/* 경기구 선택 */}
            <GameBallInput value={gameBall} onChange={setGameBall} />
          </TossCard>
        </div>
      )}

      {/* ================================================================
       * Step 2: 참가 설정 (종별/디비전 + 팀설정 + 참가비/입금)
       * ================================================================ */}
      {currentStep === 1 && (
        <div className="space-y-4">
          {/* --- 섹션 1: 종별/디비전 --- */}
          <TossCard className="hover:scale-100">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle icon="category">종별 / 디비전</SectionTitle>
              {/* BDR 종별 자동생성기 버튼 */}
              <button
                type="button"
                onClick={() => setShowDivisionGenerator(true)}
                className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                종별 추가
              </button>
            </div>
            {/* RegistrationSettingsForm 재사용 — 접수 관련 전체 폼 */}
            <RegistrationSettingsForm
              data={registration}
              onChange={(updates) => setRegistration((prev) => ({ ...prev, ...updates }))}
            />
          </TossCard>

          {/* --- 섹션 2: 팀 설정 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="groups">팀 설정</SectionTitle>
            <div className="mt-4">
              {/* TeamSettingsForm 재사용 */}
              <TeamSettingsForm
                data={teamSettings}
                totalDivCaps={totalDivCaps}
                onChange={(field, value) =>
                  setTeamSettings((prev) => ({ ...prev, [field]: value }))
                }
              />
            </div>
          </TossCard>
        </div>
      )}

      {/* ================================================================
       * Step 3: 확인 및 생성 (디자인 + 미리보기)
       * ================================================================ */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {/* --- 디자인 설정 --- */}
          <TossCard className="space-y-5 hover:scale-100">
            <SectionTitle icon="palette">디자인</SectionTitle>

            {/* 템플릿 선택 — 4종 pill 버튼 */}
            <div>
              <label className={labelCls}>템플릿</label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "basic", label: "기본형", icon: "gradient" },
                    { value: "poster", label: "포스터형", icon: "image" },
                    { value: "logo", label: "로고형", icon: "badge" },
                    { value: "photo", label: "사진형", icon: "photo_camera" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setDesignTemplate(t.value)}
                    className={pillCls(designTemplate === t.value)}
                  >
                    <span className="material-symbols-outlined text-sm align-middle mr-1">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 대회 로고 업로드 (1:1 비율) — 생성 시에는 아직 ID가 없으므로 임시 경로 */}
            <ImageUploader
              value={logoUrl}
              onChange={setLogoUrl}
              bucket="tournament-images"
              path="tournaments/new/logo"
              label="대회 로고"
              aspectRatio="1/1"
              maxSizeMB={5}
            />

            {/* 대회 포스터/배너 업로드 (16:9 비율) */}
            <ImageUploader
              value={bannerUrl}
              onChange={setBannerUrl}
              bucket="tournament-images"
              path="tournaments/new/banner"
              label="대회 포스터"
              aspectRatio="16/9"
              maxSizeMB={5}
            />

            {/* 색상 설정 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>대표 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-16 cursor-pointer rounded-md border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">{primaryColor}</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>보조 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-12 w-16 cursor-pointer rounded-md border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">{secondaryColor}</span>
                </div>
              </div>
            </div>

            {/* 실시간 미리보기 — 선택한 템플릿에 따라 다르게 표시 */}
            <div>
              <label className={labelCls}>미리보기</label>
              <div className="overflow-hidden rounded-md" style={{ aspectRatio: "16/9" }}>
                {designTemplate === "basic" && (
                  <div
                    className="flex h-full items-end p-6"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <p className="text-lg font-bold text-white drop-shadow">{name || "대회 이름"}</p>
                  </div>
                )}
                {designTemplate === "poster" && (
                  <div className="relative flex h-full items-end">
                    {bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bannerUrl} alt="포스터" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="relative p-6 text-lg font-bold text-white drop-shadow">{name || "대회 이름"}</p>
                  </div>
                )}
                {designTemplate === "logo" && (
                  <div
                    className="flex h-full flex-col items-center justify-center gap-3"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="로고" className="h-16 w-16 rounded-md object-cover shadow-lg" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-white/20 text-white">
                        <span className="material-symbols-outlined text-3xl">emoji_events</span>
                      </div>
                    )}
                    <p className="text-lg font-bold text-white drop-shadow">{name || "대회 이름"}</p>
                  </div>
                )}
                {designTemplate === "photo" && (
                  <div className="relative flex h-full items-end">
                    {bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bannerUrl} alt="사진" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-[var(--color-surface)]" />
                    )}
                    <div className="absolute inset-0 bg-black/50" />
                    <p className="relative p-6 text-lg font-bold text-white drop-shadow">{name || "대회 이름"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 서브도메인 URL */}
            <div>
              <label className={labelCls}>서브도메인 (선택)</label>
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
          </TossCard>

          {/* --- 전체 요약 미리보기 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="fact_check">입력 내용 확인</SectionTitle>

            <div className="mt-4 space-y-3 text-sm">
              {/* 기본 정보 */}
              <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">대회 정보</p>
                <Row label="대회명" value={name || "미입력"} />
                <Row label="형식" value={FORMAT_OPTIONS.find((f) => f.value === format)?.label ?? format} />
                <Row label="성별" value={GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? gender} />
                {organizer && <Row label="주최" value={organizer} />}
                {host && <Row label="주관" value={host} />}
                {sponsors && <Row label="후원" value={sponsors} />}
              </div>

              {/* 일정/장소 */}
              <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">일정 및 장소</p>
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
                    schedule.places.length > 0
                      ? schedule.places.map((p) => p.name).join(", ")
                      : [schedule.city, schedule.venueName].filter(Boolean).join(" ") || "미설정"
                  }
                />
              </div>

              {/* 경기 설정 */}
              {(gameTime || gameBall || gameMethod) && (
                <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">경기 설정</p>
                  {gameTime && <Row label="경기시간" value={gameTime} />}
                  {gameBall && <Row label="경기구" value={gameBall} />}
                  {gameMethod && <Row label="비고" value={gameMethod} />}
                </div>
              )}

              {/* 참가 설정 */}
              <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">참가 설정</p>

                {/* 부문/디비전 */}
                {Object.keys(registration.categories).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(registration.categories).map(([cat, divs]) => (
                      <div key={cat} className="flex gap-2">
                        <span className="text-[var(--color-text-muted)]">{cat}:</span>
                        <span className="font-medium">
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
              </div>

              {/* 기타 */}
              {(rules || prizeInfo) && (
                <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">기타</p>
                  {rules && <Row label="규칙" value={rules.slice(0, 80) + (rules.length > 80 ? "..." : "")} />}
                  {prizeInfo && <Row label="상금" value={prizeInfo.slice(0, 80) + (prizeInfo.length > 80 ? "..." : "")} />}
                </div>
              )}

              <Row
                label="URL"
                value={subdomain ? `${subdomain}.mybdr.kr` : "자동 생성"}
              />
            </div>
          </TossCard>

          {/* === 생성 버튼 (풀와이드 CTA) === */}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full rounded-[4px] bg-[var(--color-accent)] py-4 text-base font-bold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {loading ? "생성 중..." : "대회 생성하기"}
          </button>
        </div>
      )}

      {/* === 하단 네비게이션: 이전/다음 (마지막 단계 제외 — CTA가 있으므로) === */}
      {currentStep < 2 && (
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => {
              setCurrentStep(Math.max(0, currentStep - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={currentStep === 0 || loading}
            className="rounded-[4px] border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-30"
          >
            이전
          </button>
          <button
            onClick={goNext}
            className="rounded-[4px] bg-[var(--color-accent)] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            다음
          </button>
        </div>
      )}

      {/* 마지막 단계에서 이전 버튼만 표시 */}
      {currentStep === 2 && (
        <div className="mt-4">
          <button
            onClick={() => {
              setCurrentStep(1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="rounded-[4px] border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
          >
            이전 단계로
          </button>
        </div>
      )}

      {/* === 모달들 === */}
      <DivisionGeneratorModal
        open={showDivisionGenerator}
        onClose={() => setShowDivisionGenerator(false)}
        onApply={handleDivisionApply}
      />
      <TournamentCopyModal
        open={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onApply={handleCopyApply}
      />
    </div>
  );
}

// 미리보기에서 라벨-값 한 줄 표시
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
