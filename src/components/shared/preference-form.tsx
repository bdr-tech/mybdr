"use client";

/* ============================================================
 * PreferenceForm — 선호 설정 폼 (토스 스타일)
 *
 * 3개 섹션: 관심 종별/디비전, 경기 유형, 게시판 카테고리
 * + "원하는 정보만 보기" 토글 스위치
 *
 * 토스 공통 컴포넌트 활용: TossCard, TossSectionHeader, TossButton
 * pill 버튼(rounded-full), primary 색상 선택 상태
 * ============================================================ */

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES, getDivisionsForCategory, DIVISIONS } from "@/lib/constants/divisions";
import type { CategoryCode, GenderCode } from "@/lib/constants/divisions";
import { usePreferFilter } from "@/contexts/prefer-filter-context";
import { TossCard } from "@/components/toss/toss-card";
import { TossSectionHeader } from "@/components/toss/toss-section-header";
import { TossButton } from "@/components/toss/toss-button";

// 경기 유형 목록 (game_type 숫자값과 매핑)
const GAME_TYPES = [
  { code: 0, label: "PICKUP", description: "픽업 경기" },
  { code: 1, label: "GUEST", description: "게스트 경기" },
  { code: 2, label: "PRACTICE", description: "연습 경기" },
] as const;

// 게시판 카테고리 목록 (커뮤니티에서 사용하는 카테고리)
const BOARD_CATEGORIES = [
  { code: "general", label: "자유게시판" },
  { code: "recruit", label: "팀원모집" },
  { code: "review", label: "대회후기" },
  { code: "info", label: "정보공유" },
  { code: "qna", label: "질문답변" },
  { code: "notice", label: "공지사항" },
  { code: "marketplace", label: "농구장터" },
] as const;

// 선호 지역 목록 (17개 광역시/도)
const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

// 선호 요일 (월~일)
const DAYS = [
  { code: "mon", label: "월" }, { code: "tue", label: "화" },
  { code: "wed", label: "수" }, { code: "thu", label: "목" },
  { code: "fri", label: "금" }, { code: "sat", label: "토" },
  { code: "sun", label: "일" },
] as const;

// 선호 시간대 (4구간)
const TIME_SLOTS = [
  { code: "morning", label: "오전 (6~12시)" },
  { code: "afternoon", label: "오후 (12~18시)" },
  { code: "evening", label: "저녁 (18~22시)" },
  { code: "night", label: "심야 (22~6시)" },
] as const;

// 실력 수준 (4단계)
const SKILL_LEVELS = [
  { code: "beginner", label: "초급" },
  { code: "intermediate", label: "중급" },
  { code: "intermediate_advanced", label: "중상" },
  { code: "advanced", label: "상급" },
] as const;

// --- Props 타입 정의 ---
// mode: "onboarding"은 온보딩 흐름 (스킵 가능), "settings"는 프로필 설정 페이지용
export interface PreferenceFormProps {
  mode: "onboarding" | "settings";
  onComplete?: () => void;  // 저장 완료 후 호출되는 콜백
  onSkip?: () => void;      // 스킵 버튼 클릭 시 호출 (onboarding 모드에서만 사용)
}

/* ============================================================
 * 토스 스타일 pill 버튼 — 선택/미선택 상태에 따라 스타일 변경
 * 선택됨: primary 배경 + 흰색 글씨 (토스의 강조 패턴)
 * 미선택: surface 배경 + muted 글씨
 * ============================================================ */
function PillButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
        selected
          ? "bg-[var(--color-primary)] text-white shadow-sm"
          : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)]"
      }`}
    >
      {children}
    </button>
  );
}

export function PreferenceForm({ mode, onComplete, onSkip }: PreferenceFormProps) {
  // 전역 선호 필터 상태 (헤더의 "원하는 정보만 보기" 토글과 동기화)
  const { preferFilter, togglePreferFilter, updatePreferDefault } = usePreferFilter();

  // 선호 디비전 선택 상태
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  // 선호 게시판 카테고리 선택 상태
  const [selectedBoardCategories, setSelectedBoardCategories] = useState<string[]>([]);
  // 선호 경기 유형 선택 상태 (숫자 배열: 0=PICKUP, 1=GUEST, 2=PRACTICE)
  const [selectedGameTypes, setSelectedGameTypes] = useState<number[]>([]);
  // 선호 지역/요일/시간대/실력 선택 상태
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // 현재 선택된 종별 탭
  const [activeCategory, setActiveCategory] = useState<CategoryCode>("general");
  // 성별 필터 (남성부/여성부)
  const [activeGender, setActiveGender] = useState<GenderCode>("male");

  // 로딩/저장 상태
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 기존 선호 설정 불러오기 (API에서 현재 유저의 선호 데이터 조회)
  const loadPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/web/preferences");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      // API 응답은 snake_case이므로 그대로 사용
      setSelectedDivisions(data.preferred_divisions ?? []);
      setSelectedBoardCategories(data.preferred_board_categories ?? []);
      setSelectedGameTypes(data.preferred_game_types ?? []);
      setSelectedRegions(data.preferred_regions ?? []);
      setSelectedDays(data.preferred_days ?? []);
      setSelectedTimeSlots(data.preferred_time_slots ?? []);
      setSelectedSkills(data.preferred_skill_levels ?? []);
    } catch {
      // 로드 실패 시 빈 상태로 시작 (신규 유저이거나 네트워크 문제)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // --- 토글 핸들러들 ---
  // 디비전 토글 (선택/해제)
  const toggleDivision = (code: string) => {
    setSelectedDivisions((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    );
  };

  // 게시판 카테고리 토글
  const toggleBoardCategory = (code: string) => {
    setSelectedBoardCategories((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // 경기 유형 토글 (숫자값 기반)
  const toggleGameType = (code: number) => {
    setSelectedGameTypes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // 지역 토글
  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  // 요일 토글
  const toggleDay = (code: string) => {
    setSelectedDays((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code]
    );
  };

  // 시간대 토글
  const toggleTimeSlot = (code: string) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(code) ? prev.filter((t) => t !== code) : [...prev, code]
    );
  };

  // 실력 수준 토글
  const toggleSkill = (code: string) => {
    setSelectedSkills((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    );
  };

  // 저장 처리 - API에 선호 설정을 PATCH로 전송
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/web/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_divisions: selectedDivisions,
          preferred_board_categories: selectedBoardCategories,
          preferred_game_types: selectedGameTypes,
          preferred_regions: selectedRegions,
          preferred_days: selectedDays,
          preferred_time_slots: selectedTimeSlots,
          preferred_skill_levels: selectedSkills,
          // 토글 ON/OFF 상태를 API에 전달 (맞춤 보기 활성화 여부)
          prefer_filter_enabled: preferFilter,
        }),
      });

      if (!res.ok) throw new Error("저장 실패");

      // 저장 후 현재 토글 상태를 기본값으로 갱신
      // preferFilter가 false(OFF)면 페이지 이동 시에도 OFF 유지
      updatePreferDefault(preferFilter);

      setMessage({ type: "success", text: "맞춤 설정이 저장되었습니다." });
      // 3초 후 메시지 자동 제거
      setTimeout(() => setMessage(null), 3000);

      // 저장 성공 후 onComplete 콜백 호출 (온보딩에서 다음 페이지 이동 등)
      onComplete?.();
    } catch {
      setMessage({ type: "error", text: "저장에 실패했습니다. 다시 시도해주세요." });
    } finally {
      setSaving(false);
    }
  };

  // 현재 탭의 디비전 목록 가져오기
  const currentDivisions = getDivisionsForCategory(activeCategory, activeGender);

  // 로딩 중 스피너 표시
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    /* 섹션 간 넉넉한 간격 (토스 스타일 space-y-8) */
    <div className="space-y-8">

      {/* 온보딩 모드일 때만 안내 문구 표시 */}
      {mode === "onboarding" && (
        <p className="text-[var(--color-text-secondary)] text-sm">
          이 설정을 바탕으로 맞춤 경기와 게시글을 보여드릴게요!
        </p>
      )}

      {/* ========================================
       * "원하는 정보만 보기" 토글 — TossCard 사용
       * 토스 스타일 둥근 토글 스위치 (primary 색상)
       * ======================================== */}
      <TossCard className="!p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {/* 토글 라벨 */}
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              원하는 정보만 보기
            </h3>
            {/* 토글 설명 - 모드에 따라 다른 안내 문구 */}
            {mode === "onboarding" ? (
              <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                켜면 경기, 대회, 게시판에서 내가 원하는 정보만 표시됩니다. 나중에 프로필에서 변경할 수 있습니다.
              </p>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                켜면 경기, 대회, 게시판에서 원하는 정보만 표시됩니다.
                <br />
                <span className="text-xs opacity-70">
                  상단 tune 아이콘으로도 언제든 전환할 수 있습니다.
                </span>
              </p>
            )}
          </div>
          {/* 토스 스타일 토글 스위치: 둥근 pill, primary 색상 */}
          <button
            type="button"
            onClick={togglePreferFilter}
            className={`relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ${
              preferFilter
                ? "bg-[var(--color-primary)]"
                : "bg-[var(--color-surface-bright)]"
            }`}
            role="switch"
            aria-checked={preferFilter}
            aria-label="원하는 정보만 보기"
          >
            {/* 토글 원형 노브: ON=오른쪽, OFF=왼쪽 */}
            <span
              className={`inline-block h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                preferFilter ? "translate-x-[26px]" : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>
      </TossCard>

      {/* ========================================
       * 섹션 1: 관심 종별/디비전
       * TossCard 내부에 성별 + 종별 탭 + 디비전 pill 배치
       * ======================================== */}
      <div>
        <TossSectionHeader title="관심 종별 / 디비전" />
        <TossCard>
          {/* 성별 토글 (남성부/여성부) — pill 스타일 */}
          <div className="flex gap-2 mb-5">
            {(["male", "female"] as GenderCode[]).map((gender) => (
              <PillButton
                key={gender}
                selected={activeGender === gender}
                onClick={() => setActiveGender(gender)}
              >
                {gender === "male" ? "남성부" : "여성부"}
              </PillButton>
            ))}
          </div>

          {/* 종별 탭 (일반부/유청소년/대학부/시니어) — pill 스타일 */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {Object.entries(CATEGORIES).map(([code, cat]) => (
              <PillButton
                key={code}
                selected={activeCategory === code}
                onClick={() => setActiveCategory(code as CategoryCode)}
              >
                {cat.label}
              </PillButton>
            ))}
          </div>

          {/* 디비전 pill 목록 — 선택/미선택 토글 */}
          <div className="flex flex-wrap gap-2">
            {currentDivisions.map((code) => {
              const info = DIVISIONS[code];
              const isSelected = selectedDivisions.includes(code);
              return (
                <PillButton
                  key={code}
                  selected={isSelected}
                  onClick={() => toggleDivision(code)}
                >
                  <span>{info?.label ?? code}</span>
                  {info?.leagueName && (
                    <span className="block text-xs opacity-60 mt-0.5">{info.leagueName}</span>
                  )}
                </PillButton>
              );
            })}
          </div>

          {/* 선택된 디비전 요약 */}
          {selectedDivisions.length > 0 && (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-primary)]">{selectedDivisions.length}개</span> 선택됨
            </p>
          )}
        </TossCard>
      </div>

      {/* ========================================
       * 섹션 2: 관심 경기 유형
       * PICKUP / GUEST / PRACTICE pill 버튼
       * ======================================== */}
      <div>
        <TossSectionHeader title="관심 경기 유형" />
        <TossCard>
          <div className="flex flex-wrap gap-2">
            {GAME_TYPES.map(({ code, label, description }) => {
              const isSelected = selectedGameTypes.includes(code);
              return (
                <PillButton
                  key={code}
                  selected={isSelected}
                  onClick={() => toggleGameType(code)}
                >
                  <span>{label}</span>
                  <span className="block text-xs opacity-60 mt-0.5">{description}</span>
                </PillButton>
              );
            })}
          </div>
          {selectedGameTypes.length > 0 && (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-primary)]">{selectedGameTypes.length}개</span> 선택됨
            </p>
          )}

          {/* --- 서브섹션: 선호 실력 수준 --- */}
          <div className="mt-6">
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>선호 실력</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_LEVELS.map(({ code, label }) => (
                <PillButton key={code} selected={selectedSkills.includes(code)} onClick={() => toggleSkill(code)}>
                  {label}
                </PillButton>
              ))}
            </div>
          </div>
        </TossCard>
      </div>

      {/* ========================================
       * 섹션 3: 경기 일정 선호
       * 지역 / 요일 / 시간대 pill 버튼
       * ======================================== */}
      <div>
        <TossSectionHeader title="경기 일정 선호" />
        <TossCard>
          {/* 선호 지역 */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>선호 지역</p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => (
                <PillButton key={region} selected={selectedRegions.includes(region)} onClick={() => toggleRegion(region)}>
                  {region}
                </PillButton>
              ))}
            </div>
            {selectedRegions.length > 0 && (
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                <span className="font-medium text-[var(--color-primary)]">{selectedRegions.length}개</span> 선택됨
              </p>
            )}
          </div>

          {/* 선호 요일 */}
          <div className="mt-6">
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>선호 요일</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(({ code, label }) => (
                <PillButton key={code} selected={selectedDays.includes(code)} onClick={() => toggleDay(code)}>
                  {label}
                </PillButton>
              ))}
            </div>
          </div>

          {/* 선호 시간대 */}
          <div className="mt-6">
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>선호 시간대</p>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map(({ code, label }) => (
                <PillButton key={code} selected={selectedTimeSlots.includes(code)} onClick={() => toggleTimeSlot(code)}>
                  {label}
                </PillButton>
              ))}
            </div>
          </div>
        </TossCard>
      </div>

      {/* ========================================
       * 섹션 4: 관심 게시판 카테고리
       * 자유게시판 / 정보게시판 / 후기게시판 / 장터게시판 pill 버튼
       * ======================================== */}
      <div>
        <TossSectionHeader title="관심 게시판" />
        <TossCard>
          <div className="flex flex-wrap gap-2">
            {BOARD_CATEGORIES.map(({ code, label }) => {
              const isSelected = selectedBoardCategories.includes(code);
              return (
                <PillButton
                  key={code}
                  selected={isSelected}
                  onClick={() => toggleBoardCategory(code)}
                >
                  {label}
                </PillButton>
              );
            })}
          </div>
          {selectedBoardCategories.length > 0 && (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-primary)]">{selectedBoardCategories.length}개</span> 선택됨
            </p>
          )}
        </TossCard>
      </div>

      {/* ========================================
       * 저장 버튼 영역 — TossButton (풀와이드 CTA)
       * 메시지 표시 + primary CTA + 온보딩 스킵 버튼
       * ======================================== */}
      <div className="sticky bottom-4 space-y-3">
        {/* 성공/실패 메시지 — 토스 스타일 라운드 카드 */}
        {message && (
          <div
            className={`px-4 py-3 rounded-2xl text-sm font-medium ${
              message.type === "success"
                ? "bg-[var(--color-surface)] text-[var(--color-primary)]"
                : "bg-[var(--color-surface)] text-[var(--color-error,#E31B23)]"
            }`}
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {message.text}
          </div>
        )}

        {/* 메인 CTA — TossButton primary (풀와이드) */}
        <TossButton
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "저장 중..." : "설정 저장"}
        </TossButton>

        {/* 온보딩 모드에서만 스킵 버튼 — TossButton secondary */}
        {mode === "onboarding" && onSkip && (
          <TossButton
            variant="secondary"
            fullWidth
            onClick={onSkip}
          >
            기본 설정으로 시작
          </TossButton>
        )}
      </div>
    </div>
  );
}
