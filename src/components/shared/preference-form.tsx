"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES, getDivisionsForCategory, DIVISIONS } from "@/lib/constants/divisions";
import type { CategoryCode, GenderCode } from "@/lib/constants/divisions";

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

// --- Props 타입 정의 ---
// mode: "onboarding"은 온보딩 흐름 (스킵 가능), "settings"는 프로필 설정 페이지용
export interface PreferenceFormProps {
  mode: "onboarding" | "settings";
  onComplete?: () => void;  // 저장 완료 후 호출되는 콜백
  onSkip?: () => void;      // 스킵 버튼 클릭 시 호출 (onboarding 모드에서만 사용)
}

export function PreferenceForm({ mode, onComplete, onSkip }: PreferenceFormProps) {
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
        }),
      });

      if (!res.ok) throw new Error("저장 실패");

      setMessage({ type: "success", text: "선호 설정이 저장되었습니다." });
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#F4A261]" />
      </div>
    );
  }

  return (
    <div>
      {/* 온보딩 모드일 때만 안내 문구 표시 */}
      {mode === "onboarding" && (
        <p className="text-zinc-400 mb-6 text-sm">
          이 설정을 바탕으로 맞춤 경기와 게시글을 보여드릴게요!
        </p>
      )}

      {/* 섹션 1: 선호 종별/디비전 */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          선호 종별 / 디비전
        </h2>

        {/* 성별 토글 (남성부/여성부) */}
        <div className="flex gap-2 mb-4">
          {(["male", "female"] as GenderCode[]).map((gender) => (
            <button
              key={gender}
              onClick={() => setActiveGender(gender)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeGender === gender
                  ? "bg-[#F4A261] text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800"
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
                  isSelected
                    ? "bg-[#F4A261]/20 border-[#F4A261] text-[#F4A261]"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
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
          <div className="mt-3 text-sm text-zinc-500">
            선택됨: {selectedDivisions.join(", ")}
          </div>
        )}
      </section>

      {/* 섹션 2: 선호 경기 유형 */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">선호 경기 유형</h2>
        <div className="flex flex-wrap gap-2">
          {GAME_TYPES.map(({ code, label, description }) => {
            const isSelected = selectedGameTypes.includes(code);
            return (
              <button
                key={code}
                onClick={() => toggleGameType(code)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  isSelected
                    ? "bg-[#F4A261]/20 border-[#F4A261] text-[#F4A261]"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                <span>{label}</span>
                <span className="block text-xs opacity-60">{description}</span>
              </button>
            );
          })}
        </div>
        {selectedGameTypes.length > 0 && (
          <div className="mt-3 text-sm text-zinc-500">
            선택됨: {selectedGameTypes.map((c) => GAME_TYPES.find((g) => g.code === c)?.label ?? c).join(", ")}
          </div>
        )}
      </section>

      {/* 섹션 3: 선호 게시판 카테고리 */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">선호 게시판</h2>
        <div className="flex flex-wrap gap-2">
          {BOARD_CATEGORIES.map(({ code, label }) => {
            const isSelected = selectedBoardCategories.includes(code);
            return (
              <button
                key={code}
                onClick={() => toggleBoardCategory(code)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  isSelected
                    ? "bg-[#F4A261]/20 border-[#F4A261] text-[#F4A261]"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {selectedBoardCategories.length > 0 && (
          <div className="mt-3 text-sm text-zinc-500">
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
                ? "bg-green-900/50 text-green-300 border border-green-700"
                : "bg-red-900/50 text-red-300 border border-red-700"
            }`}
          >
            {message.text}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[#F4A261] text-black font-semibold text-base hover:bg-[#e8954f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "저장 중..." : "설정 저장"}
        </button>

        {/* 온보딩 모드에서만 스킵 버튼 표시 */}
        {mode === "onboarding" && onSkip && (
          <button
            onClick={onSkip}
            className="w-full mt-3 py-3 rounded-xl border border-zinc-700 text-zinc-400 font-medium text-sm hover:bg-zinc-800 transition-colors"
          >
            나중에 할게요
          </button>
        )}
      </div>
    </div>
  );
}
