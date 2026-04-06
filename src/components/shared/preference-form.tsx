"use client";

/* ============================================================
 * PreferenceForm — 맞춤 설정 폼 (토스 스타일)
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

/* ============================================================
 * 메뉴 항목 정의 — 사이드/슬라이드 메뉴와 동일한 slug(href) 사용
 * 보호 메뉴: 홈(/), 경기찾기(/games) — 숨길 수 없음
 * 토글 가능 메뉴: 대회, 단체, 팀, 코트, 랭킹, 커뮤니티
 * ============================================================ */
const MENU_ITEMS = [
  { href: "/", label: "홈", icon: "home", protected: true },
  { href: "/games", label: "경기찾기", icon: "sports_basketball", protected: true },
  { href: "/tournaments", label: "대회", icon: "emoji_events", protected: false },
  { href: "/organizations", label: "단체", icon: "corporate_fare", protected: false },
  { href: "/teams", label: "팀", icon: "groups", protected: false },
  { href: "/courts", label: "코트", icon: "location_on", protected: false },
  { href: "/rankings", label: "랭킹", icon: "leaderboard", protected: false },
  { href: "/community", label: "커뮤니티", icon: "forum", protected: false },
] as const;

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

// 맞춤 지역 목록 (17개 광역시/도)
const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

// 맞춤 요일 (월~일)
const DAYS = [
  { code: "mon", label: "월" }, { code: "tue", label: "화" },
  { code: "wed", label: "수" }, { code: "thu", label: "목" },
  { code: "fri", label: "금" }, { code: "sat", label: "토" },
  { code: "sun", label: "일" },
] as const;

// 맞춤 시간대 (4구간)
const TIME_SLOTS = [
  { code: "morning", label: "오전 (6~12시)" },
  { code: "afternoon", label: "오후 (12~18시)" },
  { code: "evening", label: "저녁 (18~22시)" },
  { code: "night", label: "심야 (22~6시)" },
] as const;

// 실력 수준 (7단계)
const SKILL_LEVELS = [
  { code: "lowest", label: "최하" },
  { code: "low", label: "하" },
  { code: "mid_low", label: "중하" },
  { code: "mid", label: "중" },
  { code: "mid_high", label: "중상" },
  { code: "high", label: "상" },
  { code: "highest", label: "최상" },
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
      className={`rounded-sm px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
        selected
          ? "bg-[var(--color-primary)] text-white shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]"
          : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)]"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================================================
 * ThemeSelector — 테마 3가지 선택 (다크/라이트/시스템)
 * localStorage에 저장하고 즉시 반영 (DB 저장 불필요)
 * 기존 ThemeToggle의 dark/light 클래스 토글 로직을 재사용
 * ============================================================ */
function ThemeSelector() {
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as "dark" | "light" | "system" | null;
    setTheme(saved ?? "dark");
  }, []);

  // 테마를 실제로 적용하는 함수
  const applyTheme = (value: "dark" | "light" | "system") => {
    setTheme(value);
    localStorage.setItem("theme", value);

    if (value === "system") {
      // 시스템 설정에 따라 다크/라이트 결정
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      document.documentElement.classList.toggle("light", !prefersDark);
    } else {
      document.documentElement.classList.toggle("dark", value === "dark");
      document.documentElement.classList.toggle("light", value === "light");
    }
  };

  if (!mounted) return null;

  const options = [
    { value: "dark" as const, label: "다크 모드", icon: "dark_mode" },
    { value: "light" as const, label: "라이트 모드", icon: "light_mode" },
    { value: "system" as const, label: "시스템 설정", icon: "devices" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => applyTheme(opt.value)}
          className={`flex items-center gap-2 rounded-sm px-4 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
            theme === opt.value
              ? "bg-[var(--color-primary)] text-white shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]"
              : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)]"
          }`}
        >
          <span className="material-symbols-outlined text-lg">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
 * TextSizeSelector — 텍스트 크기 2가지 선택 (기본/크게)
 * localStorage에 저장하고 즉시 반영 (DB 저장 불필요)
 * 기존 TextSizeToggle의 large-text 클래스 토글 로직을 재사용
 * ============================================================ */
function TextSizeSelector() {
  const [large, setLarge] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isLarge = document.documentElement.classList.contains("large-text");
    setLarge(isLarge);
  }, []);

  const applySize = (isLarge: boolean) => {
    setLarge(isLarge);
    document.documentElement.classList.toggle("large-text", isLarge);
    localStorage.setItem("textSize", isLarge ? "large" : "normal");
  };

  if (!mounted) return null;

  const options = [
    { value: false, label: "기본 크기", icon: "text_fields", sample: "가나다 ABC 123" },
    { value: true, label: "큰 글씨", icon: "text_increase", sample: "가나다 ABC 123" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => applySize(opt.value)}
            className={`flex items-center gap-2 rounded-sm px-4 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
              large === opt.value
                ? "bg-[var(--color-primary)] text-white shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-bright)]"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
      {/* 미리보기 텍스트 — 현재 크기 설정이 즉시 반영됨 */}
      <p className="text-sm text-[var(--color-text-muted)] mt-2">
        설정 변경 시 모든 페이지에 즉시 적용됩니다.
      </p>
    </div>
  );
}

export function PreferenceForm({ mode, onComplete, onSkip }: PreferenceFormProps) {
  // 전역 맞춤 필터 상태 (헤더의 "원하는 정보만 보기" 토글과 동기화)
  const { preferFilter, togglePreferFilter, updatePreferDefault } = usePreferFilter();

  // 맞춤 디비전 선택 상태
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  // 맞춤 게시판 카테고리 선택 상태
  const [selectedBoardCategories, setSelectedBoardCategories] = useState<string[]>([]);
  // 맞춤 경기 유형 선택 상태 (숫자 배열: 0=PICKUP, 1=GUEST, 2=PRACTICE)
  const [selectedGameTypes, setSelectedGameTypes] = useState<number[]>([]);
  // 맞춤 지역/요일/시간대/실력 선택 상태
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  // 숨긴 메뉴 slug 배열 (예: ["/rankings", "/organizations"])
  const [hiddenMenus, setHiddenMenus] = useState<string[]>([]);

  // 종별/성별 단일 선택 탭 (디비전 표시 필터용)
  const [activeGender, setActiveGender] = useState<GenderCode>("male");
  const [activeCategory, setActiveCategory] = useState<CategoryCode>("general");

  // 로딩/저장 상태
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 기존 맞춤 설정 불러오기 (API에서 현재 유저의 맞춤 데이터 조회)
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
      setHiddenMenus(data.hidden_menus ?? []);
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

  // 메뉴 숨기기/보이기 토글 (hidden_menus에 추가/제거)
  const toggleMenuVisibility = (href: string) => {
    setHiddenMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  // 저장 처리 - API에 맞춤 설정을 PATCH로 전송
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
          // 숨긴 메뉴 목록
          hidden_menus: hiddenMenus,
          // 토글 ON/OFF 상태를 API에 전달 (맞춤 보기 활성화 여부)
          prefer_filter_enabled: preferFilter,
        }),
      });

      if (!res.ok) throw new Error("저장 실패");

      // 저장 후 현재 토글 상태를 기본값으로 갱신
      // preferFilter가 false(OFF)면 페이지 이동 시에도 OFF 유지
      updatePreferDefault(preferFilter);

      // settings 모드: 페이지 새로고침으로 사이드바(layout)에 변경사항 즉시 반영
      // layout.tsx는 최초 마운트 시에만 /api/web/me를 fetch하므로,
      // hidden_menus 등 변경 후 reload 해야 사이드바에 반영됨
      if (mode === "settings") {
        window.location.reload();
        return; // reload 후에는 아래 코드 실행 불필요
      }

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

  // 선택된 성별+종별 단일 탭 조합의 디비전 목록 계산
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
            <h3 className="text-lg font-black uppercase tracking-widest text-[var(--color-text-primary)] pr-1">
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
            className={`relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center rounded-sm transition-colors duration-300 ${
              preferFilter
                ? "bg-[var(--color-primary)] shadow-[0_0_15px_var(--color-primary)]"
                : "bg-[var(--color-surface-bright)] shadow-inner"
            }`}
            role="switch"
            aria-checked={preferFilter}
            aria-label="원하는 정보만 보기"
          >
            {/* 토글 원형 노브: ON=오른쪽, OFF=왼쪽 */}
            <span
              className={`inline-block h-6 w-6 rounded-sm bg-white shadow-md transition-transform duration-300 ${
                preferFilter ? "translate-x-[26px]" : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>
      </TossCard>

      {/* ========================================
       * 섹션 1: 관심 종별/디비전
       * 성별 단일 탭 + 종별 단일 탭 → 디비전 복수 선택 pill
       * ======================================== */}
      <div>
        <TossSectionHeader title="관심 종별 / 디비전" />
        <TossCard>
          {/* 성별 단일 선택 탭 (남성부/여성부) */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>성별</p>
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
          </div>

          {/* 종별 단일 선택 탭 (일반부/유청소년/대학부/시니어) */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>종별</p>
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
          </div>

          {/* 디비전 복수 선택 pill 목록 + 전체선택 버튼 */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>디비전</p>
            <button
              type="button"
              onClick={() => {
                // 현재 표시된 디비전이 모두 선택 상태인지 확인
                const allSelected = currentDivisions.every((d) => selectedDivisions.includes(d));
                if (allSelected) {
                  // 전체해제: 현재 표시된 디비전만 해제
                  setSelectedDivisions((prev) => prev.filter((d) => !currentDivisions.includes(d)));
                } else {
                  // 전체선택: 현재 표시된 디비전 모두 추가 (중복 방지)
                  setSelectedDivisions((prev) => [...new Set([...prev, ...currentDivisions])]);
                }
              }}
              className="text-[11px] font-black uppercase pr-1"
              style={{ color: "var(--color-primary)" }}
            >
              {currentDivisions.every((d) => selectedDivisions.includes(d)) ? "전체해제" : "전체선택"}
            </button>
          </div>
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
          {/* 경기 유형 + 전체선택 버튼 */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>경기 유형</p>
            <button
              type="button"
              onClick={() => {
                const allCodes = GAME_TYPES.map((g) => g.code);
                const allSelected = allCodes.every((c) => selectedGameTypes.includes(c));
                setSelectedGameTypes(allSelected ? [] : allCodes);
              }}
              className="text-sm font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              {GAME_TYPES.every((g) => selectedGameTypes.includes(g.code)) ? "전체해제" : "전체선택"}
            </button>
          </div>
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
          {/* 경기 유형 선택 요약 */}
          {selectedGameTypes.length > 0 && (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-primary)]">{selectedGameTypes.length}개</span> 선택됨
            </p>
          )}

          {/* --- 서브섹션: 맞춤 실력 수준 + 전체선택 버튼 --- */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>맞춤 실력</p>
              <button
                type="button"
                onClick={() => {
                  const allCodes = SKILL_LEVELS.map((s) => s.code);
                  const allSelected = allCodes.every((c) => selectedSkills.includes(c));
                  setSelectedSkills(allSelected ? [] : [...allCodes]);
                }}
                className="text-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                {SKILL_LEVELS.every((s) => selectedSkills.includes(s.code)) ? "전체해제" : "전체선택"}
              </button>
            </div>
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
          {/* 맞춤 지역 + 전체선택 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>맞춤 지역</p>
              <button
                type="button"
                onClick={() => {
                  const allSelected = REGIONS.every((r) => selectedRegions.includes(r));
                  setSelectedRegions(allSelected ? [] : [...REGIONS]);
                }}
                className="text-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                {REGIONS.every((r) => selectedRegions.includes(r)) ? "전체해제" : "전체선택"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => (
                <PillButton key={region} selected={selectedRegions.includes(region)} onClick={() => toggleRegion(region)}>
                  {region}
                </PillButton>
              ))}
            </div>
            {/* 지역 선택 요약 */}
            {selectedRegions.length > 0 && (
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                <span className="font-medium text-[var(--color-primary)]">{selectedRegions.length}개</span> 선택됨
              </p>
            )}
          </div>

          {/* 맞춤 요일 + 전체선택 */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>맞춤 요일</p>
              <button
                type="button"
                onClick={() => {
                  const allCodes = DAYS.map((d) => d.code);
                  const allSelected = allCodes.every((c) => selectedDays.includes(c));
                  setSelectedDays(allSelected ? [] : [...allCodes]);
                }}
                className="text-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                {DAYS.every((d) => selectedDays.includes(d.code)) ? "전체해제" : "전체선택"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(({ code, label }) => (
                <PillButton key={code} selected={selectedDays.includes(code)} onClick={() => toggleDay(code)}>
                  {label}
                </PillButton>
              ))}
            </div>
          </div>

          {/* 맞춤 시간대 + 전체선택 */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>맞춤 시간대</p>
              <button
                type="button"
                onClick={() => {
                  const allCodes = TIME_SLOTS.map((t) => t.code);
                  const allSelected = allCodes.every((c) => selectedTimeSlots.includes(c));
                  setSelectedTimeSlots(allSelected ? [] : [...allCodes]);
                }}
                className="text-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                {TIME_SLOTS.every((t) => selectedTimeSlots.includes(t.code)) ? "전체해제" : "전체선택"}
              </button>
            </div>
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
          {/* 게시판 + 전체선택 버튼 */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>게시판</p>
            <button
              type="button"
              onClick={() => {
                const allCodes = BOARD_CATEGORIES.map((b) => b.code);
                const allSelected = allCodes.every((c) => selectedBoardCategories.includes(c));
                setSelectedBoardCategories(allSelected ? [] : [...allCodes]);
              }}
              className="text-sm font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              {BOARD_CATEGORIES.every((b) => selectedBoardCategories.includes(b.code)) ? "전체해제" : "전체선택"}
            </button>
          </div>
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
          {/* 게시판 선택 요약 */}
          {selectedBoardCategories.length > 0 && (
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-primary)]">{selectedBoardCategories.length}개</span> 선택됨
            </p>
          )}
        </TossCard>
      </div>

      {/* ========================================
       * 섹션 5: 메뉴 설정 — 보고 싶은 메뉴만 켜기/끄기
       * 보호 메뉴(홈, 경기찾기)는 항상 켜짐, 토글 비활성
       * hidden_menus에 포함된 메뉴는 사이드/슬라이드 메뉴에서 숨김
       * ======================================== */}
      <div>
        <TossSectionHeader title="메뉴 설정" />
        <TossCard>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            보고 싶은 메뉴만 켜두세요. 끄면 사이드 메뉴에서 숨겨집니다.
          </p>
          <div className="space-y-3">
            {MENU_ITEMS.map((item) => {
              // 보호 메뉴는 항상 표시 (숨길 수 없음)
              const isVisible = item.protected || !hiddenMenus.includes(item.href);
              return (
                <div key={item.href} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ color: isVisible ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isVisible ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      {item.label}
                    </span>
                    {/* 보호 메뉴 표시 */}
                    {item.protected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-bright)] text-[var(--color-text-muted)]">
                        필수
                      </span>
                    )}
                  </div>
                  {/* 토글 스위치 — 보호 메뉴는 비활성화 */}
                  <button
                    type="button"
                    onClick={() => !item.protected && toggleMenuVisibility(item.href)}
                    disabled={item.protected}
                    className={`relative inline-flex h-7 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${
                      item.protected
                        ? "cursor-not-allowed bg-[var(--color-primary)] opacity-50"
                        : isVisible
                          ? "cursor-pointer bg-[var(--color-primary)]"
                          : "cursor-pointer bg-[var(--color-surface-bright)]"
                    }`}
                    role="switch"
                    aria-checked={isVisible}
                    aria-label={`${item.label} 메뉴 ${isVisible ? "표시" : "숨김"}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                        isVisible ? "translate-x-[22px]" : "translate-x-[3px]"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </TossCard>
      </div>

      {/* ========================================
       * 섹션 6: 테마 설정 (다크/라이트/시스템)
       * localStorage에 저장, DB 저장 불필요
       * 기존 ThemeToggle 로직을 재사용
       * ======================================== */}
      <div>
        <TossSectionHeader title="테마" />
        <TossCard>
          <ThemeSelector />
        </TossCard>
      </div>

      {/* ========================================
       * 섹션 7: 텍스트 크기 설정
       * localStorage에 저장, DB 저장 불필요
       * 기존 TextSizeToggle 로직을 재사용
       * ======================================== */}
      <div>
        <TossSectionHeader title="텍스트 크기" />
        <TossCard>
          <TextSizeSelector />
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
            className={`px-4 py-3 rounded-md text-sm font-medium ${
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
