"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Script from "next/script";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createGameAction } from "@/app/actions/games";
import { UpgradeModal } from "./_modals/upgrade-modal";

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

interface RecentVenue {
  city: string | null;
  district: string | null;
  venue_name: string | null;
  venue_address: string | null;
}

interface Permissions {
  canCreatePickup: boolean;
  canCreateTeamMatch: boolean;
}

type UpgradeReason = "pickup_hosting" | "team_creation";

const inputCls =
  "w-full rounded-[16px] border-none bg-[#E8ECF0] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50";
const labelCls = "mb-1 block text-sm text-[#6B7280]";

const GAME_TYPES = [
  { value: "0", label: "픽업", emoji: "🏀", desc: "자유로운 픽업 게임" },
  { value: "1", label: "게스트 모집", emoji: "🤝", desc: "팀에 합류할 게스트 모집" },
  { value: "2", label: "팀 대결", emoji: "⚔️", desc: "팀 간의 정식 대결" },
];

const SKILL_LEVELS = [
  { value: "all", label: "전체" },
  { value: "beginner", label: "초급" },
  { value: "intermediate", label: "중급" },
  { value: "intermediate_advanced", label: "중고급" },
  { value: "advanced", label: "고급" },
];

const RECURRENCE_RULES = [
  { value: "weekly", label: "매주" },
  { value: "biweekly", label: "2주마다" },
  { value: "monthly", label: "매월" },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative h-6 w-12 flex-shrink-0 rounded-full transition-colors ${
        enabled ? "bg-[#0066FF]" : "bg-[#94A3B8]"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
          enabled ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}

export function NewGameForm({ permissions }: { permissions: Permissions }) {
  const [state, formAction, pending] = useActionState(createGameAction, null);

  const [gameType, setGameType] = useState("0");
  const [upgradeModal, setUpgradeModal] = useState<UpgradeReason | null>(null);
  const [allowGuests, setAllowGuests] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);

  // 장소 필드 상태
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  // 최근 장소
  const [recentVenues, setRecentVenues] = useState<RecentVenue[]>([]);
  const [showPostcode, setShowPostcode] = useState(false);
  const cityRef = useRef<HTMLInputElement>(null);
  const postcodeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/web/games/recent-venues")
      .then((r) => r.json())
      .then((d) => setRecentVenues((d as { venues?: RecentVenue[] }).venues ?? []))
      .catch(() => {});
  }, []);

  function handleTypeSelect(value: string) {
    if (value === "0" && !permissions.canCreatePickup) {
      setUpgradeModal("pickup_hosting");
      return;
    }
    if (value === "2" && !permissions.canCreateTeamMatch) {
      setUpgradeModal("team_creation");
      return;
    }
    setGameType(value);
  }

  function applyVenue(v: RecentVenue) {
    setCity(v.city ?? "");
    setDistrict(v.district ?? "");
    setVenueName(v.venue_name ?? "");
    setVenueAddress(v.venue_address ?? "");
    cityRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function openKakaoPostcode() {
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
        oncomplete(data: KakaoAddressData) {
          const newCity = data.sido;
          const newDistrict = [data.sigungu, data.bname].filter(Boolean).join(" ");
          const newAddress = data.roadAddress || data.jibunAddress;
          setCity(newCity);
          setDistrict(newDistrict);
          setVenueAddress(newAddress);
          setShowPostcode(false);
        },
      }).embed(postcodeContainerRef.current);
    }, 50);
  }

  const isPickup = gameType === "0";

  return (
    <>
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />

      {/* 업그레이드 모달 */}
      {upgradeModal && (
        <UpgradeModal reason={upgradeModal} onClose={() => setUpgradeModal(null)} />
      )}

      {/* 카카오 주소검색 오버레이 */}
      {showPostcode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPostcode(false); }}
        >
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-[20px] bg-white shadow-xl">
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

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">경기 만들기</h1>

        {state?.error && (
          <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-8">
          {/* Hidden inputs */}
          <input type="hidden" name="game_type" value={gameType} />
          <input type="hidden" name="allow_guests" value={allowGuests.toString()} />
          <input type="hidden" name="is_recurring" value={isRecurring.toString()} />

          {/* ── Section 1: 경기 유형 ── */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold">
              경기 유형 <span className="text-[#F4A261]">*</span>
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {GAME_TYPES.map((type) => {
                const locked =
                  (type.value === "0" && !permissions.canCreatePickup) ||
                  (type.value === "2" && !permissions.canCreateTeamMatch);
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    className={`relative flex flex-col items-center gap-2 rounded-[16px] border-2 p-4 transition-all ${
                      gameType === type.value
                        ? "border-[#0066FF] bg-[#0066FF]/10"
                        : "border-[#CBD5E1] bg-[#FAFAFA] hover:border-[#0066FF]/50"
                    }`}
                  >
                    {locked && (
                      <span className="absolute right-2 top-2 text-xs text-[#F4A261]">🔒</span>
                    )}
                    <span className="text-3xl">{type.emoji}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                    <span className="text-center text-xs text-[#6B7280]">{type.desc}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* ── Section 2: 기본 정보 ── */}
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">기본 정보</h2>
            <div>
              <label className={labelCls}>
                경기 제목 <span className="text-[#F4A261]">*</span>
              </label>
              <input
                name="title"
                type="text"
                required
                className={inputCls}
                placeholder="예: 토요일 오후 픽업 경기"
              />
            </div>
            <div>
              <label className={labelCls}>설명</label>
              <textarea
                name="description"
                rows={3}
                className={inputCls}
                placeholder="경기 상세 설명"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  일시 <span className="text-[#F4A261]">*</span>
                </label>
                <input
                  name="scheduled_at"
                  type="datetime-local"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>경기 시간</label>
                <select name="duration_hours" className={inputCls} defaultValue="2">
                  {[1, 2, 3, 4, 5].map((h) => (
                    <option key={h} value={h}>
                      {h}시간
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* ── Section 3: 장소 ── */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">장소</h2>
              <button
                type="button"
                onClick={openKakaoPostcode}
                className="flex items-center gap-1.5 rounded-[12px] bg-[#FEE500] px-3 py-1.5 text-sm font-medium text-[#3C1E1E] transition-opacity hover:opacity-90"
              >
                🔍 주소 검색
              </button>
            </div>

            {/* 최근 장소 추천 */}
            {recentVenues.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-[#6B7280]">최근 사용한 장소</p>
                <div className="flex flex-wrap gap-2">
                  {recentVenues.map((v, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyVenue(v)}
                      className="rounded-[10px] border border-[#E8ECF0] bg-white px-3 py-1.5 text-left text-xs text-[#111827] shadow-sm transition-colors hover:border-[#0066FF] hover:bg-[#EEF2FF]"
                    >
                      <span className="font-medium">{v.venue_name || v.district || v.city}</span>
                      {v.city && (
                        <span className="ml-1 text-[#6B7280]">
                          {v.city} {v.district}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>시/도</label>
                <input
                  ref={cityRef}
                  name="city"
                  type="text"
                  className={inputCls}
                  placeholder="예: 서울"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>구/동</label>
                <input
                  name="district"
                  type="text"
                  className={inputCls}
                  placeholder="예: 강남구"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>장소명</label>
              <input
                name="venue_name"
                type="text"
                className={inputCls}
                placeholder="예: 잠실 실내 체육관"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>상세 주소</label>
              <input
                name="venue_address"
                type="text"
                className={inputCls}
                placeholder="예: 서울시 강남구 역삼로 123"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
              />
            </div>
          </Card>

          {/* ── Section 4: 참가 설정 ── */}
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">참가 설정</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>최대 인원</label>
                <input
                  name="max_participants"
                  type="number"
                  defaultValue={10}
                  min={2}
                  max={100}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>최소 인원</label>
                <input
                  name="min_participants"
                  type="number"
                  defaultValue={4}
                  min={2}
                  max={100}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>참가비 (원)</label>
                <input
                  name="fee_per_person"
                  type="number"
                  defaultValue={0}
                  min={0}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>기술 수준</label>
                <select name="skill_level" className={inputCls} defaultValue="all">
                  {SKILL_LEVELS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-[#E8ECF0] px-4 py-3">
              <div>
                <p className="font-medium">게스트 허용</p>
                <p className="text-xs text-[#6B7280]">팀에 속하지 않은 개인 참가 허용</p>
              </div>
              <Toggle enabled={allowGuests} onToggle={() => setAllowGuests(!allowGuests)} />
            </div>
            <div>
              <label className={labelCls}>참가 조건</label>
              <textarea
                name="requirements"
                rows={3}
                className={inputCls}
                placeholder="예: 남성만, 3점슈터 우대 등"
              />
            </div>
          </Card>

          {/* ── Section 5: 픽업 전용 설정 (game_type === "0"일 때만 표시) ── */}
          {isPickup && (
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold">픽업 설정</h2>
              <div>
                <label className={labelCls}>
                  담당자 연락처 <span className="text-[#F4A261]">*</span>
                </label>
                <input
                  name="contact_phone"
                  type="tel"
                  required
                  className={inputCls}
                  placeholder="예: 010-1234-5678"
                />
              </div>
              <div>
                <label className={labelCls}>
                  참가비 안내 <span className="text-[#F4A261]">*</span>
                </label>
                <input
                  name="entry_fee_note"
                  type="text"
                  required
                  className={inputCls}
                  placeholder="예: 음료 지참, 5,000원 현장 납부 등"
                />
              </div>
            </Card>
          )}

          {/* ── Section 6: 유니폼 & 추가 설정 ── */}
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">유니폼 & 추가 설정</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>홈 유니폼 색상</label>
                <div className="flex items-center gap-3 rounded-[16px] bg-[#E8ECF0] px-4 py-3">
                  <input
                    name="uniform_home_color"
                    type="color"
                    defaultValue="#FF0000"
                    className="h-8 w-8 cursor-pointer rounded-full border-none bg-transparent"
                  />
                  <span className="text-sm text-[#6B7280]">홈팀 색상</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>어웨이 유니폼 색상</label>
                <div className="flex items-center gap-3 rounded-[16px] bg-[#E8ECF0] px-4 py-3">
                  <input
                    name="uniform_away_color"
                    type="color"
                    defaultValue="#0000FF"
                    className="h-8 w-8 cursor-pointer rounded-full border-none bg-transparent"
                  />
                  <span className="text-sm text-[#6B7280]">어웨이팀 색상</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-[#E8ECF0] px-4 py-3">
              <div>
                <p className="font-medium">반복 경기</p>
                <p className="text-xs text-[#6B7280]">정기적으로 반복되는 경기</p>
              </div>
              <Toggle enabled={isRecurring} onToggle={() => setIsRecurring(!isRecurring)} />
            </div>
            {isRecurring && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>반복 주기</label>
                  <select name="recurrence_rule" className={inputCls} defaultValue="weekly">
                    {RECURRENCE_RULES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>총 횟수</label>
                  <input
                    name="recurring_count"
                    type="number"
                    defaultValue={4}
                    min={2}
                    max={52}
                    className={inputCls}
                  />
                </div>
              </div>
            )}
            <div>
              <label className={labelCls}>비고</label>
              <textarea
                name="notes"
                rows={3}
                className={inputCls}
                placeholder="기타 알아두어야 할 사항"
              />
            </div>
          </Card>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "생성 중..." : "경기 만들기"}
          </Button>
        </form>
      </div>
    </>
  );
}
