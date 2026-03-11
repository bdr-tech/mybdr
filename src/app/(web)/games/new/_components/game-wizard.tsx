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

const STEPS = [
  { label: "유형", shortLabel: "유형" },
  { label: "일시/장소", shortLabel: "장소" },
  { label: "설정", shortLabel: "설정" },
  { label: "확인", shortLabel: "확인" },
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
        if (data.gameType === "2") {
          // 팀 대결: title 필수
          if (!data.title.trim()) {
            errs.title = "경기 제목을 입력해주세요";
          }
        }
        if (data.gameType === "0") {
          // 픽업: contact_phone 필수
          if (!data.contactPhone.trim()) {
            errs.contactPhone = "담당자 연락처를 입력해주세요";
          } else if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(data.contactPhone.trim())) {
            errs.contactPhone = "올바른 전화번호 형식이 아닙니다";
          }
        }
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
      // Jump to step 4
      setStep(3);
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
          setData((prev) => ({
            ...prev,
            city: newCity,
            district: newDistrict,
            venueAddress: newAddress,
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
      // redirect() throws a special error in Next.js — this is expected behavior
      // The redirect will happen automatically
    }
  }, [data, validateStep, generateTitle]);

  // --- Cancel ---
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // Check if "Next" button should be enabled
  const isNextEnabled = (() => {
    if (step === 0) return true; // game_type always has a value
    if (step === 1) return !!(data.scheduledDate && data.scheduledTime);
    if (step === 2) return true;
    return true;
  })();

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
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-[20px] bg-white shadow-xl mx-4">
            <div className="flex items-center justify-between border-b border-[#E8ECF0] px-4 py-3">
              <span className="font-semibold text-[#111827]">주소 검색</span>
              <button
                type="button"
                onClick={() => setShowPostcode(false)}
                className="text-lg leading-none text-[#6B7280] hover:text-[#111827]"
              >
                ✕
              </button>
            </div>
            <div ref={postcodeContainerRef} className="h-[450px] w-full" />
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {showSuccess && <SuccessOverlay gameId={createdGameId} />}

      {/* --- Wizard Layout --- */}
      <div className="fixed inset-0 z-40 flex flex-col bg-[#F5F7FA] xl:static xl:min-h-[calc(100vh-80px)]">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[#E8ECF0] bg-white px-4">
          <button
            type="button"
            onClick={step === 0 ? handleCancel : goPrev}
            className="text-sm text-[#6B7280] hover:text-[#111827]"
          >
            {step === 0 ? "← 취소" : "← 이전"}
          </button>
          <span className="text-sm font-medium text-[#6B7280]">
            단계 {step + 1} / {STEPS.length}
          </span>
        </header>

        {/* Progress Bar */}
        <WizardProgress
          steps={STEPS}
          currentStep={step}
          onStepClick={goToStep}
        />

        {/* Content Area — xl: two-column */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 pb-24 pt-4 xl:mx-auto xl:grid xl:max-w-[1120px] xl:grid-cols-[1fr_480px] xl:gap-8 xl:pb-6"
        >
          {/* Form Column */}
          <div
            className={`transition-transform duration-200 ease-in-out motion-reduce:transition-none ${
              animating
                ? direction === "forward"
                  ? "-translate-x-full opacity-0"
                  : "translate-x-full opacity-0"
                : "translate-x-0 opacity-100"
            }`}
          >
            {step === 0 && (
              <StepType
                data={data}
                updateData={updateData}
                permissions={permissions}
                onUpgrade={setUpgradeModal}
                recentGames={recentGames}
                gamesLoading={gamesLoading}
                onCopyGame={copyGame}
              />
            )}
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
            {step === 2 && (
              <StepSettings
                data={data}
                updateData={updateData}
                errors={errors}
                generateTitle={generateTitle}
              />
            )}
            {step === 3 && (
              <StepConfirm
                data={data}
                updateData={updateData}
                generateTitle={generateTitle}
                submitError={submitError}
              />
            )}
          </div>

          {/* Desktop Preview Column */}
          <div className="hidden xl:block">
            <div className="sticky top-8">
              <PreviewPanel data={data} generateTitle={generateTitle} step={step} />
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t border-[#E8ECF0] bg-white px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] xl:static xl:border-t xl:pb-3">
          <div>
            {step > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="rounded-full border border-[#E8ECF0] px-5 py-2.5 text-sm font-medium text-[#6B7280] hover:bg-[#F5F7FA] min-h-[44px]"
              >
                ← 이전
              </button>
            )}
          </div>
          <div>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!isNextEnabled}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold min-h-[44px] transition-colors ${
                  isNextEnabled
                    ? "bg-[#F4A261] text-[#0A0A0A] hover:bg-[#E8934E]"
                    : "bg-[#E8ECF0] text-[#9CA3AF] cursor-not-allowed"
                }`}
              >
                다음 →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold min-h-[44px] transition-colors ${
                  submitting
                    ? "bg-[#F4A261]/50 text-[#0A0A0A]"
                    : "bg-[#F4A261] text-[#0A0A0A] hover:bg-[#E8934E]"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0A] border-t-transparent" />
                    생성 중...
                  </span>
                ) : (
                  "경기 만들기"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// --- Desktop Preview Panel ---

function PreviewPanel({
  data,
  generateTitle,
  step,
}: {
  data: WizardFormData;
  generateTitle: () => string;
  step: number;
}) {
  if (step === 0 && !data.gameType) {
    return (
      <div className="rounded-[16px] border border-[#E8ECF0] bg-white p-8 text-center">
        <p className="text-sm text-[#9CA3AF]">유형을 선택하면 미리보기가 나타나요</p>
      </div>
    );
  }

  const typeEmoji = data.gameType === "0" ? "🏀" : data.gameType === "1" ? "🤝" : "⚔️";
  const typeLabel = data.gameType === "0" ? "픽업" : data.gameType === "1" ? "게스트 모집" : "팀 대결";
  const title = data.title.trim() || generateTitle() || "경기 제목";
  const location = [data.city, data.district, data.venueName].filter(Boolean).join(" · ");
  const feeDisplay =
    data.feePerPerson > 0 ? `${data.feePerPerson.toLocaleString()}원` : "무료";

  let dateDisplay = "";
  if (data.scheduledDate && data.scheduledTime) {
    const dt = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
    dateDisplay = `${dt.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })} ${dt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}`;
    if (data.durationHours) dateDisplay += ` · ${data.durationHours}시간`;
  }

  const skillLabel: Record<string, string> = {
    all: "전체",
    beginner: "초급",
    intermediate: "중급",
    intermediate_advanced: "중고급",
    advanced: "고급",
  };

  return (
    <div
      className="overflow-hidden rounded-[16px] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
      style={{ borderLeft: "3px solid #F4A261" }}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-base">{typeEmoji}</span>
        <span className="text-xs font-medium text-[#F4A261]">{typeLabel}</span>
      </div>

      <h3 className="mb-3 font-semibold leading-snug text-[#111827]">{title}</h3>

      <div className="mb-3 space-y-1">
        {dateDisplay && (
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span>📅</span>
            <span>{dateDisplay}</span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span>📍</span>
            <span>{location}</span>
          </div>
        )}
      </div>

      <div className="mb-3 h-px bg-[#E8ECF0]" />

      <div className="flex flex-wrap gap-2 text-xs text-[#9CA3AF]">
        <span>최대 {data.maxParticipants}명</span>
        <span>·</span>
        <span>{feeDisplay}</span>
        <span>·</span>
        <span>{skillLabel[data.skillLevel] || "전체"} 수준</span>
        {data.allowGuests && data.gameType !== "1" && (
          <>
            <span>·</span>
            <span>게스트 허용</span>
          </>
        )}
      </div>
    </div>
  );
}
