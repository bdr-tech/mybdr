"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES, getDivisionsForCategory, DIVISIONS } from "@/lib/constants/divisions";
import type { CategoryCode, GenderCode } from "@/lib/constants/divisions";
import { usePreferFilter } from "@/contexts/prefer-filter-context";

// 경기 유형 목록 (game_type 숫자값과 매핑)
const GAME_TYPES = [
  { code: 0, label: "PICKUP", description: "픽업 경기" },
  { code: 1, label: "GUEST", description: "게스트 경기" },
  { code: 2, label: "PRACTICE", description: "연습 경기" },
] as const;

// 게시판 카테고리 목록 (커뮤니티에서 사용하는 카테고리)
const BOARD_CATEGORIES = [
  { code: "general", label: "자유게시판" },
  { code: "info", label: "정보게시판" },
  { code: "review", label: "후기게시판" },
  { code: "marketplace", label: "장터게시판" },
] as const;

// --- 미선택 버튼의 공통 스타일 (CSS 변수로 라이트/다크 자동 대응) ---
const unselectedBtn = "bg-(--color-elevated) border-(--color-border) text-(--color-text-secondary) hover:border-(--color-text-secondary)";
// --- 선택된 버튼 스타일 (오렌지 계열 - 테마 무관하게 고정) ---
// 선택된 칩 스타일 - 액센트 색상(오렌지) CSS 변수 사용
const selectedChip = "bg-(--color-accent)/20 border-(--color-accent) text-(--color-accent)";

// --- Props 타입 정의 ---
// mode: "onboarding"은 온보딩 흐름 (스킵 가능), "settings"는 프로필 설정 페이지용
export interface PreferenceFormProps {
  mode: "onboarding" | "settings";
  onComplete?: () => void;  // 저장 완료 후 호출되는 콜백
  onSkip?: () => void;      // 스킵 버튼 클릭 시 호출 (onboarding 모드에서만 사용)
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-(--color-accent)" />
      </div>
    );
  }

  return (
    <div>
      {/* 온보딩 모드일 때만 안내 문구 표시 */}
      {mode === "onboarding" && (
        <p className="text-(--color-text-secondary) mb-6 text-sm">
          이 설정을 바탕으로 맞춤 경기와 게시글을 보여드릴게요!
        </p>
      )}

      {/* "원하는 정보만 보기" 토글 - settings와 onboarding 모두 표시 */}
      <section className="mb-8 rounded-2xl border border-(--color-border) bg-(--color-card) p-5">
        <div className="flex items-center justify-between">
          <div>
            {/* 토글 라벨 */}
            <h3 className="text-base font-semibold text-(--color-text-primary)">
              원하는 정보만 보기
            </h3>
            {/* 토글 설명 - 온보딩과 설정 모드에 따라 다른 안내 문구 */}
            {mode === "onboarding" ? (
              <p className="text-sm text-(--color-text-secondary) mt-1">
                켜면 경기, 대회, 게시판에서 내가 원하는 정보만 표시됩니다. 나중에 프로필에서 변경할 수 있습니다.
              </p>
            ) : (
              <>
                <p className="text-sm text-(--color-text-secondary) mt-1">
                  켜면 경기, 대회, 게시판에서 원하는 정보만 표시됩니다
                </p>
                <p className="text-xs text-(--color-text-secondary) mt-1 opacity-70">
                  켜두면 항상 기본으로 내가 원하는 정보만 볼 수 있습니다. 상단 아이콘을 통해 언제든지 전체 정보를 볼 수 있습니다.
                </p>
              </>
            )}
          </div>
          {/* 토글 스위치 - 클릭 시 전역 preferFilter 상태 즉시 변경 */}
          <button
            type="button"
            onClick={togglePreferFilter}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
              preferFilter ? "bg-(--color-accent)" : "bg-(--color-surface)"
            }`}
            role="switch"
            aria-checked={preferFilter}
            aria-label="원하는 정보만 보기"
          >
            {/* 토글 동그라미 (ON: 오른쪽, OFF: 왼쪽) */}
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                preferFilter ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* 섹션 1: 관심 종별/디비전 */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-(--color-text-primary)">
          관심 종별 / 디비전
        </h2>

        {/* 성별 토글 (남성부/여성부) */}
        <div className="flex gap-2 mb-4">
          {(["male", "female"] as GenderCode[]).map((gender) => (
            <button
              key={gender}
              onClick={() => setActiveGender(gender)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeGender === gender
                  ? "bg-(--color-accent) text-black"
                  : unselectedBtn
              }`}
            >
              {gender === "male" ? "남성부" : "여성부"}
            </button>
          ))}
        </div>

        {/* 종별 탭 (일반부/유청소년/대학부/시니어) */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {Object.entries(CATEGORIES).map(([code, cat]) => (
            <button
              key={code}
              onClick={() => setActiveCategory(code as CategoryCode)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === code
                  ? "bg-(--color-surface) text-(--color-text-primary)"
                  : "bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-surface)"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 디비전 칩 목록 - 각 디비전을 토글 버튼으로 표시 */}
        <div className="flex flex-wrap gap-2">
          {currentDivisions.map((code) => {
            const info = DIVISIONS[code];
            const isSelected = selectedDivisions.includes(code);
            return (
              <button
                key={code}
                onClick={() => toggleDivision(code)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  isSelected ? selectedChip : unselectedBtn
                }`}
              >
                <span>{info?.label ?? code}</span>
                {info?.leagueName && (
                  <span className="block text-xs opacity-60">{info.leagueName}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 선택된 디비전 요약 */}
        {selectedDivisions.length > 0 && (
          <div className="mt-3 text-sm text-(--color-text-secondary)">
            선택됨: {selectedDivisions.join(", ")}
          </div>
        )}
      </section>

      {/* 섹션 2: 관심 경기 유형 */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 text-(--color-text-primary)">관심 경기 유형</h2>
        <div className="flex flex-wrap gap-2">
          {GAME_TYPES.map(({ code, label, description }) => {
            const isSelected = selectedGameTypes.includes(code);
            return (
              <button
                key={code}
                onClick={() => toggleGameType(code)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  isSelected ? selectedChip : unselectedBtn
                }`}
              >
                <span>{label}</span>
                <span className="block text-xs opacity-60">{description}</span>
              </button>
            );
          })}
        </div>
        {selectedGameTypes.length > 0 && (
          <div className="mt-3 text-sm text-(--color-text-secondary)">
            선택됨: {selectedGameTypes.map((c) => GAME_TYPES.find((g) => g.code === c)?.label ?? c).join(", ")}
          </div>
        )}
      </section>

      {/* 섹션 3: 관심 게시판 카테고리 */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 text-(--color-text-primary)">관심 게시판</h2>
        <div className="flex flex-wrap gap-2">
          {BOARD_CATEGORIES.map(({ code, label }) => {
            const isSelected = selectedBoardCategories.includes(code);
            return (
              <button
                key={code}
                onClick={() => toggleBoardCategory(code)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  isSelected ? selectedChip : unselectedBtn
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {selectedBoardCategories.length > 0 && (
          <div className="mt-3 text-sm text-(--color-text-secondary)">
            선택됨: {selectedBoardCategories.map((c) => BOARD_CATEGORIES.find((b) => b.code === c)?.label ?? c).join(", ")}
          </div>
        )}
      </section>

      {/* 저장 버튼 + 메시지 */}
      <div className="sticky bottom-4">
        {message && (
          <div
            className={`mb-3 px-4 py-2 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700"
                : "bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700"
            }`}
          >
            {message.text}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-(--color-accent) text-black font-semibold text-base hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "저장 중..." : "설정 저장"}
        </button>

        {/* 온보딩 모드에서만 스킵 버튼 표시 */}
        {mode === "onboarding" && onSkip && (
          <button
            onClick={onSkip}
            className="w-full mt-3 py-3 rounded-xl border border-(--color-border) text-(--color-text-secondary) font-medium text-sm hover:bg-(--color-elevated) transition-colors"
          >
            기본 설정으로 시작
          </button>
        )}
      </div>
    </div>
  );
}
