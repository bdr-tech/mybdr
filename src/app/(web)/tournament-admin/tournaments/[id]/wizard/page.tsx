"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { TossCard } from "@/components/toss/toss-card";
import { ScheduleForm, type ScheduleFormData, type PlaceInfo } from "@/components/tournament/schedule-form";
import {
  RegistrationSettingsForm,
  type RegistrationSettingsData,
} from "@/components/tournament/registration-settings-form";
import { TeamSettingsForm, type TeamSettingsData } from "@/components/tournament/team-settings-form";
import { GameTimeInput } from "@/components/tournament/game-time-input";
import { GameBallInput } from "@/components/tournament/game-ball-input";
import { DivisionGeneratorModal } from "@/components/tournament/division-generator-modal";
import { ImageUploader } from "@/components/shared/image-uploader";

// --- 3단계 구성 (생성 위자드와 동일) ---
const STEPS = [
  { key: "info", label: "대회 정보", icon: "emoji_events" },
  { key: "registration", label: "참가 설정", icon: "group_add" },
  { key: "confirm", label: "확인 및 저장", icon: "check_circle" },
];

// 대회 방식 옵션 (4종 — 생성 위자드와 동일)
const FORMAT_OPTIONS = [
  { value: "group_stage_knockout", label: "조별리그+토너먼트" },
  { value: "dual_tournament", label: "듀얼토너먼트" },
  { value: "single_elimination", label: "토너먼트" },
  { value: "full_league_knockout", label: "풀리그+토너먼트" },
];

// 레거시 format → 새 format 매핑 (기존 DB 값을 새 4종으로 변환)
const LEGACY_FORMAT_MAP: Record<string, string> = {
  single_elimination: "single_elimination",
  double_elimination: "dual_tournament",
  round_robin: "full_league_knockout",
  group_stage: "group_stage_knockout",
  group_stage_knockout: "group_stage_knockout",
  swiss: "group_stage_knockout",
  dual_tournament: "dual_tournament",
  full_league_knockout: "full_league_knockout",
};

// 성별 옵션 — BDR은 남성부/여성부만 운영 (혼성 없음)
const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

// 대회 상태 4종 통일 (draft/registration/in_progress/completed)
const STATUS_OPTIONS = [
  { value: "draft", label: "준비중" },
  { value: "registration", label: "접수중" },
  { value: "in_progress", label: "진행중" },
  { value: "completed", label: "종료" },
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

// 미리보기에서 라벨-값 한 줄 표시
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default function TournamentEditWizardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDivisionGenerator, setShowDivisionGenerator] = useState(false);

  // --- Step 1: 기본정보 + 일정/장소 + 경기설정 ---
  const [name, setName] = useState("");
  const [format, setFormat] = useState("group_stage_knockout");
  const [status, setStatus] = useState("draft");
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [host, setHost] = useState("");
  const [sponsors, setSponsors] = useState("");
  const [gender, setGender] = useState("male");
  const [rules, setRules] = useState("");
  const [prizeInfo, setPrizeInfo] = useState("");
  const [isPublic, setIsPublic] = useState(true);

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

  // --- Step 2: 접수설정 + 팀설정 ---
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

  // --- Step 3: 디자인 ---
  const [designTemplate, setDesignTemplate] = useState("basic");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#E31B23");
  const [secondaryColor, setSecondaryColor] = useState("#E76F51");

  // 디비전 정원 합산 — 자동 계산에 사용
  const totalDivCaps = Object.values(registration.divCaps).reduce((s, v) => s + v, 0);

  // ISO 날짜 → input[type=date] 형식 변환
  const toDateInput = (iso: string | null | undefined) => {
    if (!iso) return "";
    return new Date(iso).toISOString().split("T")[0];
  };

  // 기존 대회 데이터 로드 — DB에서 가져와서 각 state에 분배
  const loadTournament = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}`);
      if (!res.ok) throw new Error("로드 실패");
      const json = await res.json();
      // apiSuccess 래퍼가 있으면 data 꺼내기, 없으면 그대로
      const t = json.data ?? json;

      // 기본 정보
      setName(t.name ?? "");
      // 레거시 format 매핑: DB 값이 새 4종에 없으면 변환
      const dbFormat = t.format ?? "group_stage_knockout";
      setFormat(LEGACY_FORMAT_MAP[dbFormat] ?? dbFormat);
      setStatus(t.status ?? "draft");
      setDescription(t.description ?? "");
      setOrganizer(t.organizer ?? "");
      setHost(t.host ?? "");
      setSponsors(t.sponsors ?? "");
      setGender(t.gender ?? "male");
      setRules(t.rules ?? "");
      setPrizeInfo(t.prize_info ?? t.prizeInfo ?? "");
      setIsPublic(t.is_public ?? t.isPublic ?? true);

      // 일정/장소
      setSchedule({
        startDate: toDateInput(t.startDate ?? t.start_date),
        endDate: toDateInput(t.endDate ?? t.end_date),
        registrationStartAt: toDateInput(t.registration_start_at ?? t.registrationStartAt),
        registrationEndAt: toDateInput(t.registration_end_at ?? t.registrationEndAt),
        venueName: t.venue_name ?? t.venueName ?? "",
        venueAddress: t.venue_address ?? t.venueAddress ?? "",
        city: t.city ?? "",
        places: (t.places as PlaceInfo[]) ?? [],
      });

      // 경기 설정
      setGameTime(t.game_time ?? t.gameTime ?? "");
      setGameBall(t.game_ball ?? t.gameBall ?? "");
      setGameMethod(t.game_method ?? t.gameMethod ?? "");

      // 접수 설정
      setRegistration({
        categories: t.categories ?? {},
        divCaps: t.div_caps ?? t.divCaps ?? {},
        divFees: t.div_fees ?? t.divFees ?? {},
        allowWaitingList: t.allow_waiting_list ?? t.allowWaitingList ?? false,
        waitingListCap: String(t.waiting_list_cap ?? t.waitingListCap ?? ""),
        entryFee: String(Number(t.entry_fee ?? t.entryFee ?? 0)),
        bankName: t.bank_name ?? t.bankName ?? "",
        bankAccount: t.bank_account ?? t.bankAccount ?? "",
        bankHolder: t.bank_holder ?? t.bankHolder ?? "",
        feeNotes: t.fee_notes ?? t.feeNotes ?? "",
      });

      // 팀 설정
      setTeamSettings({
        maxTeams: String(t.maxTeams ?? t.max_teams ?? 16),
        teamSize: String(t.team_size ?? t.teamSize ?? 5),
        rosterMin: String(t.roster_min ?? t.rosterMin ?? 5),
        rosterMax: String(t.roster_max ?? t.rosterMax ?? 12),
        autoApproveTeams: t.auto_approve_teams ?? t.autoApproveTeams ?? false,
        autoCalcMaxTeams: false,
      });

      // 디자인
      setDesignTemplate(t.design_template ?? t.designTemplate ?? "basic");
      setLogoUrl(t.logo_url ?? t.logoUrl ?? "");
      setBannerUrl(t.banner_url ?? t.bannerUrl ?? "");
      setPrimaryColor(t.primary_color ?? t.primaryColor ?? "#E31B23");
      setSecondaryColor(t.secondary_color ?? t.secondaryColor ?? "#E76F51");
    } catch {
      setError("대회 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTournament();
  }, [loadTournament]);

  // 다음 단계 이동 — Step 0에서 대회명 필수 검증
  function goNext() {
    if (currentStep === 0 && !name.trim()) {
      setError("대회 이름을 입력하세요.");
      return;
    }
    setError(null);
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 대회 저장 API 호출 — PATCH
  async function handleSave() {
    setSaving(true);
    setError(null);

    const effectiveMaxTeams =
      teamSettings.autoCalcMaxTeams && totalDivCaps > 0
        ? totalDivCaps
        : Number(teamSettings.maxTeams) || 16;

    try {
      const res = await fetch(`/api/web/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          format,
          status,
          description: description || null,
          organizer: organizer || null,
          host: host || null,
          sponsors: sponsors || null,
          gender: gender || null,
          rules: rules || null,
          prize_info: prizeInfo || null,
          is_public: isPublic,
          // 일정
          startDate: schedule.startDate || null,
          endDate: schedule.endDate || null,
          registration_start_at: schedule.registrationStartAt || null,
          registration_end_at: schedule.registrationEndAt || null,
          // 장소
          venue_name: schedule.venueName || null,
          venue_address: schedule.venueAddress || null,
          city: schedule.city || null,
          places: schedule.places.length > 0 ? schedule.places : null,
          // 경기 설정
          game_time: gameTime || null,
          game_ball: gameBall || null,
          game_method: gameMethod || null,
          // 접수 설정
          categories: registration.categories,
          div_caps: registration.divCaps,
          div_fees: registration.divFees,
          allow_waiting_list: registration.allowWaitingList,
          waiting_list_cap: registration.waitingListCap ? Number(registration.waitingListCap) : null,
          entry_fee: Number(registration.entryFee) || 0,
          bank_name: registration.bankName || null,
          bank_account: registration.bankAccount || null,
          bank_holder: registration.bankHolder || null,
          fee_notes: registration.feeNotes || null,
          // 팀 설정
          maxTeams: effectiveMaxTeams,
          team_size: Number(teamSettings.teamSize) || 5,
          roster_min: Number(teamSettings.rosterMin) || 5,
          roster_max: Number(teamSettings.rosterMax) || 12,
          auto_approve_teams: teamSettings.autoApproveTeams,
          // 디자인
          design_template: designTemplate || null,
          logo_url: logoUrl || null,
          banner_url: bannerUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        }),
      });

      if (res.ok) {
        router.push(`/tournament-admin/tournaments/${id}`);
      } else {
        const err = await res.json();
        setError(err.error ?? "저장에 실패했습니다.");
        setSaving(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setSaving(false);
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[var(--color-text-muted)]">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* === 헤더: 뒤로가기 + 타이틀 === */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push(`/tournament-admin/tournaments/${id}`)}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <span className="material-symbols-outlined text-base align-middle">arrow_back</span>
          대회 관리
        </button>
      </div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">대회 설정</h1>

      {/* === 3단계 탭 인디케이터 (생성 위자드와 동일) === */}
      <div className="mb-6 flex gap-2">
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => {
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

            {/* 상태 — 편집에서만 있는 필드 */}
            <div>
              <label className={labelCls}>상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputCls}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
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

            {/* 공개 여부 */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-[var(--color-primary)]"
              />
              <label htmlFor="is_public" className="text-sm">공개 대회</label>
            </div>
          </TossCard>

          {/* --- 섹션 2: 일정 및 장소 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="calendar_month">일정 및 장소</SectionTitle>
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

            {/* 대회 방식 (FORMAT 4종) */}
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
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="category">종별 / 디비전</SectionTitle>
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
            <div>
              <RegistrationSettingsForm
                data={registration}
                onChange={(updates) => setRegistration((prev) => ({ ...prev, ...updates }))}
              />
            </div>
          </TossCard>

          {/* --- 섹션 2: 팀 설정 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="groups">팀 설정</SectionTitle>
            <div className="mt-4">
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
       * Step 3: 확인 및 저장 (디자인 + 미리보기)
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

            {/* 대회 로고 업로드 (1:1 비율) */}
            <ImageUploader
              value={logoUrl}
              onChange={setLogoUrl}
              bucket="tournament-images"
              path={`tournaments/${id}/logo`}
              label="대회 로고"
              aspectRatio="1/1"
              maxSizeMB={5}
            />

            {/* 대회 포스터/배너 업로드 (16:9 비율) */}
            <ImageUploader
              value={bannerUrl}
              onChange={setBannerUrl}
              bucket="tournament-images"
              path={`tournaments/${id}/banner`}
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
                {/* basic: 그라디언트 배경 + 제목 */}
                {designTemplate === "basic" && (
                  <div
                    className="flex h-full items-end p-6"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <p className="text-lg font-bold text-white drop-shadow">{name || "대회 이름"}</p>
                  </div>
                )}
                {/* poster: 배너 이미지 전체 배경 + 제목 오버레이 */}
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
                {/* logo: 색상 배경 + 중앙 로고 */}
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
                {/* photo: 배너 사진 + 어두운 오버레이 + 제목 */}
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
          </TossCard>

          {/* --- 전체 요약 미리보기 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="fact_check">입력 내용 확인</SectionTitle>

            <div className="mt-4 space-y-3 text-sm">
              {/* 기본 정보 */}
              <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">대회 정보</p>
                <Row label="대회명" value={name || "미입력"} />
                <Row label="상태" value={STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status} />
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
            </div>
          </TossCard>

          {/* === 저장 버튼 (풀와이드 CTA) === */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-[4px] bg-[var(--color-accent)] py-4 text-base font-bold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {saving ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>
      )}

      {/* === 하단 네비게이션: 이전/다음 (마지막 단계 제외) === */}
      {currentStep < 2 && (
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => {
              setCurrentStep(Math.max(0, currentStep - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={currentStep === 0}
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

      {/* 종별 자동생성기 모달 */}
      <DivisionGeneratorModal
        open={showDivisionGenerator}
        onClose={() => setShowDivisionGenerator(false)}
        onApply={(newCategories) => {
          setRegistration((prev) => {
            const merged = { ...prev.categories };
            for (const [cat, divs] of Object.entries(newCategories)) {
              merged[cat] = [...(merged[cat] ?? []), ...divs.filter((d) => !(merged[cat] ?? []).includes(d))];
            }
            return { ...prev, categories: merged };
          });
        }}
      />
    </div>
  );
}
