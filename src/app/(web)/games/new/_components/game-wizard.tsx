"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { createGameAction } from "@/app/actions/games";
import { UpgradeModal } from "../_modals/upgrade-modal";
import { WizardProgress } from "./wizard-progress";
import { StepType } from "./step-type";
import { StepWhenWhere } from "./step-when-where";
import { StepSettings } from "./step-settings";
import { StepConfirm } from "./step-confirm";
import { SuccessOverlay } from "./success-overlay";

// --- Types ---

export type GameType = "0" | "1" | "2"; // 0=픽업, 1=게스트모집, 2=팀대결
export type UpgradeReason = "pickup_hosting" | "team_creation";

export interface Permissions {
  canCreatePickup: boolean;
  canCreateTeamMatch: boolean;
}

export interface RecentVenue {
  city: string | null;
  district: string | null;
  venue_name: string | null;
  venue_address: string | null;
}

export interface RecentGame {
  game_type: number;
  title: string | null;
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
  district: string | null;
  max_participants: number;
  fee_per_person: number;
  skill_level: string | null;
  duration_hours: number;
  scheduled_at: string;
  allow_guests: boolean;
  contact_phone: string | null;
}

export interface WizardFormData {
  gameType: GameType;
  // STEP 2
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  venueName: string;
  venueAddress: string;
  city: string;
  district: string;
  // STEP 3
  title: string;
  maxParticipants: number;
  minParticipants: number;
  feePerPerson: number;
  skillLevel: string;
  allowGuests: boolean;
  contactPhone: string;
  // STEP 3B (팀 대결)
  uniformHomeColor: string;
  uniformAwayColor: string;
  // STEP 4 (고급 설정)
  description: string;
  requirements: string;
  entryFeeNote: string;
  isRecurring: boolean;
  recurrenceRule: string;
  recurringCount: number;
  notes: string;
}

const INITIAL_DATA: WizardFormData = {
  gameType: "1",
  scheduledDate: "",
  scheduledTime: "",
  endTime: "",
  durationHours: 2,
  venueName: "",
  venueAddress: "",
  city: "",
  district: "",
  title: "",
  maxParticipants: 10,
  minParticipants: 4,
  feePerPerson: 0,
  skillLevel: "all",
  allowGuests: true,
  contactPhone: "",
  uniformHomeColor: "#FF0000",
  uniformAwayColor: "#0000FF",
  description: "",
  requirements: "",
  entryFeeNote: "",
  isRecurring: false,
  recurrenceRule: "weekly",
  recurringCount: 4,
  notes: "",
};

// 3단계 스텝 정의 (디자인 시안 기준)
const STEPS = [
  { label: "기본 정보", shortLabel: "정보" },
  { label: "일정 및 장소", shortLabel: "일정" },
  { label: "최종 확인", shortLabel: "확인" },
];

// --- Kakao Postcode type declarations ---
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: KakaoAddressData) => void;
        width?: string | number;
        height?: string | number;
      }) => { open: () => void; embed: (el: HTMLElement) => void };
    };
  }
}

interface KakaoAddressData {
  sido: string;
  sigungu: string;
  bname: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string; // 카카오 주소 검색 결과에 포함되는 건물명
}

// --- Main Wizard Component ---

export function GameWizard({ permissions }: { permissions: Permissions }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardFormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdGameId, setCreatedGameId] = useState("");
  const [upgradeModal, setUpgradeModal] = useState<UpgradeReason | null>(null);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animating, setAnimating] = useState(false);

  // Recent venues & games
  const [recentVenues, setRecentVenues] = useState<RecentVenue[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [gamesLoading, setGamesLoading] = useState(true);

  // Kakao postcode
  const [showPostcode, setShowPostcode] = useState(false);
  const postcodeContainerRef = useRef<HTMLDivElement>(null);

  // Content area ref for scroll-to-top on step change
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch recent venues and games on mount
  useEffect(() => {
    fetch("/api/web/games/recent-venues")
      .then((r) => r.json())
      .then((d) => setRecentVenues((d as { venues?: RecentVenue[] }).venues ?? []))
      .catch(() => {})
      .finally(() => setVenuesLoading(false));

    fetch("/api/web/games/my-last-game?limit=3")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setRecentGames((d as { games?: RecentGame[] }).games ?? []))
      .catch(() => {})
      .finally(() => setGamesLoading(false));
  }, []);

  // --- Updater ---
  const updateData = useCallback(
    <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
      // Clear error for that field
      setErrors((prev) => {
        if (prev[key]) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return prev;
      });
    },
    []
  );

  // --- Validation ---
  const validateStep = useCallback(
    (stepIndex: number): Record<string, string> => {
      const errs: Record<string, string> = {};

      if (stepIndex === 0) {
        // game_type is always set, no validation needed
      }

      if (stepIndex === 1) {
        if (!data.scheduledDate || !data.scheduledTime) {
          errs.scheduledAt = "경기 일시를 선택해주세요";
        } else {
          const dt = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
          if (dt <= new Date()) {
            errs.scheduledAt = "현재 이후 일시를 선택해주세요";
          }
        }
      }

      if (stepIndex === 2) {
        // 제목 길이 제한만 체크 (제목은 step 1에서 입력, 비어있으면 자동 생성)
        if (data.title.trim() && data.title.trim().length > 50) {
          errs.title = "제목은 50자 이내여야 합니다";
        }
      }

      return errs;
    },
    [data]
  );

  // --- Navigation ---
  const goNext = useCallback(() => {
    if (animating) return;
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setDirection("forward");
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      setAnimating(false);
      contentRef.current?.scrollTo({ top: 0 });
    }, 200);
  }, [step, validateStep, animating]);

  const goPrev = useCallback(() => {
    if (animating || step === 0) return;
    setDirection("backward");
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => Math.max(s - 1, 0));
      setAnimating(false);
      contentRef.current?.scrollTo({ top: 0 });
    }, 200);
  }, [step, animating]);

  const goToStep = useCallback(
    (target: number) => {
      if (animating || target >= step) return; // Only allow jumping to previous steps
      setDirection(target < step ? "backward" : "forward");
      setAnimating(true);
      setTimeout(() => {
        setStep(target);
        setAnimating(false);
        contentRef.current?.scrollTo({ top: 0 });
      }, 200);
    },
    [step, animating]
  );

  // --- Smart title generation ---
  const generateTitle = useCallback(() => {
    if (!data.scheduledDate || !data.scheduledTime) return "";
    const dt = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
    const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    const day = days[dt.getDay()];
    const hour = dt.getHours();
    const timeOfDay =
      hour >= 6 && hour < 12 ? "오전" : hour >= 12 && hour < 18 ? "오후" : hour >= 18 && hour < 22 ? "저녁" : "야간";
    const typeLabel = data.gameType === "0" ? "픽업 경기" : data.gameType === "1" ? "게스트 모집" : "팀 대결";
    return `${day} ${timeOfDay} ${typeLabel}`;
  }, [data.scheduledDate, data.scheduledTime, data.gameType]);

  // --- Copy last game ---
  const copyGame = useCallback(
    (game: RecentGame) => {
      // Calculate next week same day/time
      const originalDate = new Date(game.scheduled_at);
      const nextDate = new Date(originalDate);
      nextDate.setDate(nextDate.getDate() + 7);
      // If next date is in the past, keep adding 7 days
      while (nextDate <= new Date()) {
        nextDate.setDate(nextDate.getDate() + 7);
      }

      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
      const timeStr = `${String(originalDate.getHours()).padStart(2, "0")}:${String(originalDate.getMinutes()).padStart(2, "0")}`;

      setData((prev) => ({
        ...prev,
        gameType: String(game.game_type) as GameType,
        scheduledDate: dateStr,
        scheduledTime: timeStr,
        durationHours: game.duration_hours || 2,
        venueName: game.venue_name || "",
        venueAddress: game.venue_address || "",
        city: game.city || "",
        district: game.district || "",
        title: game.title || "",
        maxParticipants: game.max_participants || 10,
        feePerPerson: game.fee_per_person || 0,
        skillLevel: game.skill_level || "all",
        allowGuests: game.allow_guests ?? true,
        contactPhone: game.contact_phone || "",
      }));
      // Jump to step 3 (최종 확인)
      setStep(2);
    },
    []
  );

  // --- Kakao Postcode ---
  const openKakaoPostcode = useCallback(() => {
    if (!window.daum?.Postcode) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setShowPostcode(true);
    setTimeout(() => {
      if (!postcodeContainerRef.current) return;
      postcodeContainerRef.current.innerHTML = "";
      new window.daum.Postcode({
        width: "100%",
        height: "100%",
        oncomplete(addrData: KakaoAddressData) {
          const newCity = addrData.sido;
          const newDistrict = [addrData.sigungu, addrData.bname].filter(Boolean).join(" ");
          const newAddress = addrData.roadAddress || addrData.jibunAddress;
          const buildingName = addrData.buildingName || "";
          setData((prev) => ({
            ...prev,
            city: newCity,
            district: newDistrict,
            venueAddress: newAddress,
            venueName: buildingName || prev.venueName,
          }));
          setShowPostcode(false);
        },
      }).embed(postcodeContainerRef.current);
    }, 50);
  }, []);

  // --- Apply venue from recent ---
  const applyVenue = useCallback((v: RecentVenue) => {
    setData((prev) => ({
      ...prev,
      city: v.city ?? "",
      district: v.district ?? "",
      venueName: v.venue_name ?? "",
      venueAddress: v.venue_address ?? "",
    }));
  }, []);

  // --- Submit ---
  const handleSubmit = useCallback(async () => {
    // Final validation of all steps
    for (let i = 0; i <= 2; i++) {
      const errs = validateStep(i);
      if (Object.keys(errs).length > 0) {
        setStep(i);
        setErrors(errs);
        return;
      }
    }

    setSubmitting(true);
    setSubmitError("");

    // Build FormData to match createGameAction
    const fd = new FormData();
    const titleVal = data.title.trim() || generateTitle();
    fd.set("title", titleVal);
    fd.set("game_type", data.gameType);

    // Build scheduled_at ISO string
    const scheduledAt = `${data.scheduledDate}T${data.scheduledTime}`;
    fd.set("scheduled_at", scheduledAt);

    fd.set("duration_hours", String(data.durationHours));
    fd.set("venue_name", data.venueName);
    fd.set("venue_address", data.venueAddress);
    fd.set("city", data.city);
    fd.set("district", data.district);
    fd.set("max_participants", String(data.maxParticipants));
    fd.set("min_participants", String(data.minParticipants));
    fd.set("fee_per_person", String(data.feePerPerson));
    fd.set("skill_level", data.skillLevel);
    fd.set("allow_guests", String(data.allowGuests));
    fd.set("requirements", data.requirements);
    fd.set("description", data.description);
    fd.set("notes", data.notes);
    fd.set("contact_phone", data.contactPhone);
    fd.set("entry_fee_note", data.entryFeeNote);
    fd.set("uniform_home_color", data.uniformHomeColor);
    fd.set("uniform_away_color", data.uniformAwayColor);
    fd.set("is_recurring", String(data.isRecurring));
    fd.set("recurrence_rule", data.recurrenceRule);
    fd.set("recurring_count", String(data.recurringCount));

    try {
      const result = await createGameAction(null, fd);
      if (result?.error) {
        setSubmitError(result.error);
        setSubmitting(false);
        return;
      }
      // createGameAction does redirect on success, but in case it doesn't:
      // This code may not be reached due to redirect, but handle it gracefully
      setShowSuccess(true);
    } catch {
      // redirect() throws a special error in Next.js -- this is expected behavior
      // The redirect will happen automatically
    }
  }, [data, validateStep, generateTitle]);

  // --- Cancel ---
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // 게임 타입 라벨 (Summary에 사용)
  const typeLabel = data.gameType === "0" ? "Pickup" : data.gameType === "1" ? "Guest Recruit" : "Team Match";
  const feeDisplay = data.feePerPerson > 0 ? `₩ ${data.feePerPerson.toLocaleString()}` : "Free";

  return (
    <>
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />

      {/* Upgrade Modal */}
      {upgradeModal && (
        <UpgradeModal reason={upgradeModal} onClose={() => setUpgradeModal(null)} />
      )}

      {/* Kakao Postcode Overlay */}
      {showPostcode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPostcode(false);
          }}
        >
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-[var(--color-card)] shadow-xl mx-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <span className="font-semibold text-[var(--color-text-primary)]">주소 검색</span>
              <button
                type="button"
                onClick={() => setShowPostcode(false)}
                className="text-lg leading-none text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div ref={postcodeContainerRef} className="h-[450px] w-full" />
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {showSuccess && <SuccessOverlay gameId={createdGameId} />}

      {/* === 새 디자인: 일반 페이지 레이아웃 === */}
      <div ref={contentRef} className="max-w-4xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Create New Game
          </h1>
          <p className="text-[var(--color-text-muted)]">
            엘리트 매치를 위한 새로운 게임 세션을 생성합니다.
          </p>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="mb-12">
          <WizardProgress
            steps={STEPS}
            currentStep={step}
            onStepClick={goToStep}
          />
        </div>

        {/* 2열 레이아웃: 좌측 폼 + 우측 Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 메인 폼 영역 */}
          <div className="lg:col-span-2">
            {/* 스텝 전환 애니메이션 래퍼 */}
            <div
              className={`transition-transform duration-200 ease-in-out motion-reduce:transition-none ${
                animating
                  ? direction === "forward"
                    ? "-translate-x-full opacity-0"
                    : "translate-x-full opacity-0"
                  : "translate-x-0 opacity-100"
              }`}
            >
              {/* Step 1: 기본 정보 (유형 선택 + 제목/인원/참가비) */}
              {step === 0 && (
                <StepType
                  data={data}
                  updateData={updateData}
                  permissions={permissions}
                  onUpgrade={setUpgradeModal}
                  recentGames={recentGames}
                  gamesLoading={gamesLoading}
                  onCopyGame={copyGame}
                  onNext={goNext}
                />
              )}
              {/* Step 2: 일정 및 장소 */}
              {step === 1 && (
                <StepWhenWhere
                  data={data}
                  updateData={updateData}
                  errors={errors}
                  recentVenues={recentVenues}
                  venuesLoading={venuesLoading}
                  onApplyVenue={applyVenue}
                  onOpenPostcode={openKakaoPostcode}
                />
              )}
              {/* Step 3: 최종 확인 */}
              {step === 2 && (
                <StepConfirm
                  data={data}
                  updateData={updateData}
                  generateTitle={generateTitle}
                  submitError={submitError}
                />
              )}
            </div>
          </div>

          {/* 우측: Summary 카드 (sticky) */}
          <div className="lg:col-span-1">
            <SummaryCard data={data} feeDisplay={feeDisplay} typeLabel={typeLabel} />
          </div>
        </div>

        {/* 하단 버튼 3개: Cancel / Save Draft / Create Game (또는 Next) */}
        <div className="mt-12 flex items-center justify-between pb-12">
          {/* Cancel 버튼 (텍스트만) */}
          <button
            type="button"
            onClick={handleCancel}
            className="px-8 py-3 rounded text-[var(--color-text-muted)] font-bold text-sm hover:bg-[var(--color-surface-high)] transition-colors"
          >
            Cancel
          </button>

          <div className="flex gap-4">
            {/* Save Draft 버튼 (아웃라인) */}
            {step > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="px-8 py-3 rounded border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-sm hover:bg-[var(--color-surface)] transition-colors"
              >
                <span className="material-symbols-outlined text-sm align-middle mr-1">arrow_back</span>
                이전
              </button>
            )}

            {/* Next 또는 Create Game 버튼 */}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="px-10 py-3 rounded bg-[var(--color-primary)] text-white font-bold text-sm hover:bg-[var(--color-primary-hover)] transition-all active:scale-95 shadow-lg shadow-[var(--color-primary)]/20"
              >
                다음
                <span className="material-symbols-outlined text-sm align-middle ml-1">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className={`px-10 py-3 rounded font-bold text-sm transition-all active:scale-95 shadow-lg shadow-[var(--color-primary)]/20 ${
                  submitting
                    ? "bg-[var(--color-primary)]/50 text-white cursor-not-allowed"
                    : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    생성 중...
                  </span>
                ) : (
                  "Create Game"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// --- Summary 카드 (우측 sticky) ---

function SummaryCard({
  data,
  feeDisplay,
  typeLabel,
}: {
  data: WizardFormData;
  feeDisplay: string;
  typeLabel: string;
}) {
  return (
    // sticky로 스크롤 시에도 고정, 네이비 배경
    <div className="sticky top-24 bg-[var(--color-accent)] text-white p-6 rounded-xl shadow-lg">
      <h3 className="font-bold text-xl mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Summary
      </h3>

      {/* Summary 항목들 */}
      <ul className="space-y-4">
        {/* 게임 타입 */}
        <li className="flex justify-between items-center border-b border-white/10 pb-3">
          <span className="text-xs text-white/60">Selected Type</span>
          <span className="text-sm font-bold">{typeLabel}</span>
        </li>

        {/* 총 인원 */}
        <li className="flex justify-between items-center border-b border-white/10 pb-3">
          <span className="text-xs text-white/60">Total Capacity</span>
          <span className="text-sm font-bold">{data.maxParticipants} Players</span>
        </li>

        {/* 참가비 */}
        <li className="flex justify-between items-center border-b border-white/10 pb-3">
          <span className="text-xs text-white/60">Entry Fee</span>
          <span className="text-sm font-bold">{feeDisplay}</span>
        </li>

        {/* 일정 (입력된 경우만 표시) */}
        {data.scheduledDate && (
          <li className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-xs text-white/60">Date</span>
            <span className="text-sm font-bold">{data.scheduledDate}</span>
          </li>
        )}

        {/* 장소 (입력된 경우만 표시) */}
        {data.venueName && (
          <li className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-xs text-white/60">Location</span>
            <span className="text-sm font-bold truncate max-w-[150px]">{data.venueName}</span>
          </li>
        )}
      </ul>

      {/* 환불 정책 안내 */}
      <div className="mt-8 p-4 bg-white/5 rounded border border-white/10">
        <p className="text-xs text-white/50 leading-relaxed">
          매치 생성 시 서비스 이용 약관에 동의하게 됩니다. 매치 시작 24시간 전까지 취소 시 100% 환불이 가능합니다.
        </p>
      </div>
    </div>
  );
}
