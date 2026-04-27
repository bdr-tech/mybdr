"use client";

/* ============================================================
 * GameFormV2 — BDR v2 경기 만들기 단일 폼
 *
 * 왜 이 구조를 택했는가:
 * 기존 4스텝 위자드(type → when/where → confirm)는
 * 시안(CreateGame.jsx — 3카드 단일 폼)과 맞지 않고, 모바일에서도
 * 스텝 전환 애니메이션이 비효율적. 시안 그대로 **단일 페이지 3카드**
 * (종류 / 정보 / 조건) + **고급 설정 아코디언**(DB 필드 보존) +
 * **액션 버튼 3개**(취소 / 임시저장 / 경기 개설)로 재구성.
 *
 * 규칙:
 *   - 서버 액션 createGameAction FormData 키는 **기존과 동일**
 *   - validation/API/Prisma 0 변경
 *   - 카카오 postcode, 지난 경기 복사, 프리셋 저장 기능 전부 유지
 *   - "use client" — react state + 카카오 SDK + localStorage 사용
 * ============================================================ */

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { createGameAction } from "@/app/actions/games";
import { UpgradeModal } from "../_modals/upgrade-modal";
import { SuccessOverlay } from "../_components/success-overlay";
import { KindSelector } from "./kind-selector";
import { BasicInfoSection } from "./basic-info-section";
import { ConditionsSection } from "./conditions-section";
import { AdvancedSection } from "./advanced-section";

// --- Types ---

export type GameType = "0" | "1" | "2"; // 0=픽업, 1=게스트모집, 2=팀대결(스크림)
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

export interface GameFormData {
  gameType: GameType;
  // 기본 정보
  title: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  venueName: string;
  venueAddress: string;
  city: string;
  district: string;
  maxParticipants: number;
  minParticipants: number;
  feePerPerson: number;
  skillLevel: string;
  description: string;
  // 신청 조건 (체크박스 + 기타 → JOIN된 문자열)
  requirements: string;
  // 고급 설정
  allowGuests: boolean;
  contactPhone: string;
  entryFeeNote: string;
  uniformHomeColor: string;
  uniformAwayColor: string;
  isRecurring: boolean;
  recurrenceRule: string;
  recurringCount: number;
  notes: string;
}

const INITIAL_DATA: GameFormData = {
  gameType: "0", // 시안 기본값은 픽업
  title: "",
  scheduledDate: "",
  scheduledTime: "",
  endTime: "",
  durationHours: 2,
  venueName: "",
  venueAddress: "",
  city: "",
  district: "",
  maxParticipants: 10,
  minParticipants: 4,
  feePerPerson: 0,
  skillLevel: "all",
  description: "",
  requirements: "",
  allowGuests: true,
  contactPhone: "",
  entryFeeNote: "",
  uniformHomeColor: "#FF0000",
  uniformAwayColor: "#0000FF",
  isRecurring: false,
  recurrenceRule: "weekly",
  recurringCount: 4,
  notes: "",
};

// --- Kakao Postcode 전역 타입 선언 ---
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
  buildingName: string;
}

// --- localStorage 프리셋 (기존 키 유지) ---
const PRESETS_KEY = "bdr_game_presets";

interface GamePreset {
  name: string;
  data: Partial<GameFormData>;
  savedAt: string;
}

function loadPresets(): GamePreset[] {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || "[]");
  } catch { return []; }
}

function savePreset(name: string, data: GameFormData) {
  const presets = loadPresets();
  // 일시는 프리셋에 안 담음(매번 달라지므로)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { scheduledDate, scheduledTime, endTime, ...saveable } = data;
  presets.unshift({ name, data: saveable, savedAt: new Date().toISOString() });
  // 최대 10개
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.slice(0, 10)));
}

// --- Main Component ---

export function GameFormV2({ permissions }: { permissions: Permissions }) {
  const router = useRouter();
  const [data, setData] = useState<GameFormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdGameId] = useState("");
  const [upgradeModal, setUpgradeModal] = useState<UpgradeReason | null>(null);

  // Recent 데이터
  const [recentVenues, setRecentVenues] = useState<RecentVenue[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [gamesLoading, setGamesLoading] = useState(true);

  // 카카오 postcode 오버레이
  const [showPostcode, setShowPostcode] = useState(false);
  const postcodeContainerRef = useRef<HTMLDivElement>(null);

  // 임시저장 / 불러오기 모달
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<GamePreset[]>([]);

  // 최초 mount — 최근 장소 + 지난 경기 fetch (기존 API 그대로)
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

  // --- updater (에러는 해당 필드 수정 시 자동 clear) ---
  const updateData = useCallback(
    <K extends keyof GameFormData>(key: K, value: GameFormData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (prev[key as string]) {
          const next = { ...prev };
          delete next[key as string];
          return next;
        }
        return prev;
      });
    },
    []
  );

  // --- 유형 변경 시 기본 인원 조정 (기존 step-type.tsx 로직 유지) ---
  const handleKindChange = useCallback(
    (v: GameType) => {
      setData((prev) => {
        // 유형에 따른 기본 인원
        const nextMax =
          v === "1" ? 5 : v === "2" ? 5 : 10;
        return { ...prev, gameType: v, maxParticipants: nextMax };
      });
    },
    []
  );

  // --- Validation (기존 위자드 통합: 제목·일정) ---
  const validate = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    // 일정
    if (!data.scheduledDate || !data.scheduledTime) {
      errs.scheduledAt = "경기 일시를 선택해주세요";
    } else {
      const dt = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
      if (dt <= new Date()) {
        errs.scheduledAt = "현재 이후 일시를 선택해주세요";
      }
    }
    // 제목은 선택 — 비어있으면 submit 시 generateTitle 호출
    if (data.title.trim() && data.title.trim().length > 50) {
      errs.title = "제목은 50자 이내여야 합니다";
    }
    return errs;
  }, [data]);

  // --- 자동 제목 생성 (기존 로직 그대로) ---
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

  // --- 지난 경기 복사 (기존 로직 그대로) ---
  const copyGame = useCallback((game: RecentGame) => {
    const originalDate = new Date(game.scheduled_at);
    const nextDate = new Date(originalDate);
    nextDate.setDate(nextDate.getDate() + 7);
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
  }, []);

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

  // --- 최근 장소 적용 ---
  const applyVenue = useCallback((v: RecentVenue) => {
    setData((prev) => ({
      ...prev,
      city: v.city ?? "",
      district: v.district ?? "",
      venueName: v.venue_name ?? "",
      venueAddress: v.venue_address ?? "",
    }));
  }, []);

  // --- 임시저장 ---
  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    savePreset(presetName.trim(), data);
    setShowSaveModal(false);
    setPresetName("");
  };

  // --- 불러오기 ---
  const handleLoadPreset = (preset: GamePreset) => {
    Object.entries(preset.data).forEach(([k, v]) => {
      if (v !== undefined) updateData(k as keyof GameFormData, v as never);
    });
    setShowLoadModal(false);
  };

  const handleDeletePreset = (idx: number) => {
    const all = loadPresets();
    all.splice(idx, 1);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(all));
    setPresets(all);
  };

  // --- Submit ---
  const handleSubmit = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // 에러가 있는 필드 쪽으로 스크롤
      window.scrollTo({ top: 200, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    // FormData 빌드 — createGameAction이 읽는 snake_case 키 그대로
    const fd = new FormData();
    const titleVal = data.title.trim() || generateTitle();
    fd.set("title", titleVal);
    fd.set("game_type", data.gameType);

    // scheduled_at ISO 조합 (기존 형식 그대로, 서버에서 +09:00 붙임)
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
      // createGameAction은 성공 시 redirect() 호출 → 아래 코드 도달 X (fallback)
      setShowSuccess(true);
    } catch {
      // redirect는 Next.js 내부적으로 특수 에러를 throw함 → 정상 동작
    }
  }, [data, validate, generateTitle]);

  // --- Cancel ---
  const handleCancel = () => router.back();

  // 지난 경기 유형 라벨 & 경과 시간 (copy 버튼 UI용)
  const typeLabel = (gt: number) => (gt === 0 ? "픽업" : gt === 1 ? "게스트" : "스크림");
  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  };

  return (
    <>
      {/* 카카오 postcode 스크립트 */}
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />

      {/* 권한 업그레이드 모달 */}
      {upgradeModal && (
        <UpgradeModal reason={upgradeModal} onClose={() => setUpgradeModal(null)} />
      )}

      {/* 카카오 postcode 오버레이 */}
      {showPostcode && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPostcode(false);
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              maxWidth: 440,
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: 8,
              background: "var(--bg-elev)",
              border: "1px solid var(--border-strong)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
              margin: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--border)",
                padding: "12px 16px",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>주소 검색</span>
              <button
                type="button"
                onClick={() => setShowPostcode(false)}
                style={{ fontSize: 20, lineHeight: 1, color: "var(--ink-mute)", background: "transparent", border: "none", cursor: "pointer" }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div ref={postcodeContainerRef} style={{ height: 450, width: "100%" }} />
          </div>
        </div>
      )}

      {/* 성공 오버레이 */}
      {showSuccess && <SuccessOverlay gameId={createdGameId} />}

      {/* === v2 시안 레이아웃: page + maxWidth 760 중앙 정렬 === */}
      <div className="page">
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              gap: 6,
              fontSize: 12,
              color: "var(--ink-mute)",
              marginBottom: 12,
            }}
          >
            <a
              onClick={() => router.push("/games")}
              style={{ cursor: "pointer" }}
            >
              경기
            </a>
            <span>›</span>
            <span style={{ color: "var(--ink)" }}>경기 개설</span>
          </div>

          {/* 헤더 */}
          <div style={{ marginBottom: 20 }}>
            <div className="eyebrow">새 경기 · NEW GAME</div>
            <h1
              style={{
                margin: "6px 0 4px",
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: "-0.015em",
                color: "var(--ink)",
              }}
            >
              경기 개설
            </h1>
            <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
              픽업·게스트·스크림 중 하나를 열고 참가자를 모집하세요
            </div>
          </div>

          {/* 지난 경기 복사 (기존 기능, 상단에 유지) */}
          {!gamesLoading && recentGames.length > 0 && (
            <div
              className="card"
              style={{ padding: "14px 18px", marginBottom: 14, background: "var(--bg-alt)" }}
            >
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-mute)", margin: "0 0 8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 4 }}>
                  content_copy
                </span>
                지난 경기 복사 (클릭하면 빠르게 채워져요)
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {recentGames.map((game, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => copyGame(game)}
                    className="btn btn--sm"
                    style={{ fontSize: 12 }}
                  >
                    {typeLabel(game.game_type)} · {timeSince(game.scheduled_at)}
                    {game.venue_name ? ` · ${game.venue_name}` : game.city ? ` · ${game.city}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 에러 메시지 (submit 실패) */}
          {submitError && (
            <div
              role="alert"
              style={{
                padding: "12px 16px",
                marginBottom: 14,
                borderRadius: 6,
                background: "color-mix(in oklab, var(--bdr-red) 8%, transparent)",
                border: "1px solid var(--bdr-red)",
                color: "var(--bdr-red)",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined">error</span>
              {submitError}
            </div>
          )}

          {/* 시안 1번 카드 — 경기 종류 */}
          <KindSelector
            value={data.gameType}
            onChange={handleKindChange}
            permissions={permissions}
            onUpgrade={setUpgradeModal}
          />

          {/* 시안 2번 카드 — 경기 정보 */}
          <BasicInfoSection
            data={data}
            updateData={updateData}
            errors={errors}
            recentVenues={recentVenues}
            venuesLoading={venuesLoading}
            onApplyVenue={applyVenue}
            onOpenPostcode={openKakaoPostcode}
          />

          {/* 시안 3번 카드 — 신청 조건 */}
          <ConditionsSection
            value={data.requirements}
            onChange={(v) => updateData("requirements", v)}
          />

          {/* 시안 외 — 고급 설정 아코디언(DB 필드 보존) */}
          <AdvancedSection data={data} updateData={updateData} />

          {/* 액션 버튼 3개 — 시안 우측 정렬 */}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginBottom: 40,
            }}
          >
            <button type="button" className="btn" onClick={handleCancel}>
              취소
            </button>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => setShowSaveModal(true)}
            >
              임시저장
            </button>
            <button
              type="button"
              className="btn btn--accent"
              onClick={handleSubmit}
              disabled={submitting}
              style={submitting ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            >
              {submitting ? "생성 중..." : "경기 개설 →"}
            </button>
          </div>

          {/* 불러오기 링크 (임시저장된 설정이 있을 때만) */}
          <div style={{ textAlign: "right", marginTop: -24, marginBottom: 40 }}>
            <button
              type="button"
              onClick={() => { setPresets(loadPresets()); setShowLoadModal(true); }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--ink-dim)",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              저장된 설정 불러오기
            </button>
          </div>
        </div>
      </div>

      {/* 임시저장 모달 */}
      {showSaveModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSaveModal(false); }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 320,
              borderRadius: 8,
              background: "var(--bg-elev)",
              border: "1px solid var(--border-strong)",
              padding: 20,
              boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              경기 설정 저장
            </h3>
            <input
              className="input"
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="저장 이름 (예: 주말 픽업)"
              style={{ marginBottom: 12 }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowSaveModal(false)}>
                취소
              </button>
              <button type="button" className="btn btn--accent" style={{ flex: 1 }} onClick={handleSavePreset}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 불러오기 모달 */}
      {showLoadModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowLoadModal(false); }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              borderRadius: 8,
              background: "var(--bg-elev)",
              border: "1px solid var(--border-strong)",
              padding: 20,
              boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              자주 쓰는 경기
            </h3>
            {presets.length === 0 ? (
              <p style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "var(--ink-mute)" }}>
                저장된 설정이 없습니다.
              </p>
            ) : (
              <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {presets.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      padding: 12,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadPreset(p)}
                      style={{ flex: 1, textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{p.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>
                        {p.data.venueName && `${p.data.venueName} · `}
                        {p.data.maxParticipants}명 · {p.data.feePerPerson ? `${(p.data.feePerPerson / 1000).toFixed(0)}천원` : "무료"}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(i)}
                      style={{ fontSize: 11, color: "var(--ink-mute)", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              className="btn"
              style={{ marginTop: 12, width: "100%" }}
              onClick={() => setShowLoadModal(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
