"use client";

import { useState, useCallback, useMemo } from "react";
import { FloatingFilterPanel, type FilterConfig } from "@/components/shared/floating-filter-panel";
import {
  GENDERS_LIST,
  CATEGORIES_LIST,
  DIVISIONS_BY_CATEGORY,
  type GenderCode,
  type CategoryCode,
} from "@/lib/constants/divisions";

/**
 * TournamentsFilter - 대회 필터 (플로팅 패널 방식)
 *
 * 필터 구성: 지역(17개 시도) / 성별 / 종별 / 디비전
 * - 종별 변경 시 디비전 옵션이 동적으로 바뀜
 * - 성별이 "여성"이면 디비전 코드에 W 접미사
 * - 종별이 "전체"면 디비전 필터 숨김 (전체만 표시)
 */

// 17개 시도 + 전체 (행정구역 기준)
const REGION_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "서울", label: "서울" },
  { value: "부산", label: "부산" },
  { value: "대구", label: "대구" },
  { value: "인천", label: "인천" },
  { value: "광주", label: "광주" },
  { value: "대전", label: "대전" },
  { value: "울산", label: "울산" },
  { value: "세종", label: "세종" },
  { value: "경기", label: "경기" },
  { value: "강원", label: "강원" },
  { value: "충북", label: "충북" },
  { value: "충남", label: "충남" },
  { value: "전북", label: "전북" },
  { value: "전남", label: "전남" },
  { value: "경북", label: "경북" },
  { value: "경남", label: "경남" },
  { value: "제주", label: "제주" },
];

// 성별 옵션: divisions.ts 상수에서 생성 (혼성 없음 — BDR에는 남성부/여성부만)
const GENDER_OPTIONS = [
  { value: "all", label: "전체" },
  ...GENDERS_LIST.map((g) => ({ value: g.key, label: g.label })),
];

// 종별 옵션: divisions.ts 상수에서 생성
const CATEGORY_OPTIONS = [
  { value: "all", label: "전체" },
  ...CATEGORIES_LIST.map((c) => ({ value: c.key, label: c.label })),
];

/**
 * 종별+성별 조합에 따라 디비전 옵션을 동적으로 생성
 * - 종별이 "전체"면 "전체"만 반환 (디비전 선택 불가)
 * - 성별이 "전체"면 남성부 디비전 코드 사용 (기본)
 * - 여성부면 W 접미사 디비전 코드 사용
 */
function getDivisionOptions(
  category: string,
  gender: string
): { value: string; label: string }[] {
  // 종별이 "전체"이면 디비전 선택 불가
  if (category === "all") {
    return [{ value: "all", label: "전체" }];
  }

  // 성별 결정: "전체" 또는 "male"이면 남성부 디비전, "female"이면 여성부 디비전
  const genderKey: GenderCode = gender === "female" ? "female" : "male";
  const categoryKey = category as CategoryCode;

  // divisions.ts의 DIVISIONS_BY_CATEGORY에서 해당 조합의 디비전 목록 가져옴
  const divisions = DIVISIONS_BY_CATEGORY[genderKey]?.[categoryKey] ?? [];

  return [
    { value: "all", label: "전체" },
    ...divisions.map((d) => ({
      value: d.key,
      // subtitle가 있으면 괄호 안에 표시 (예: "D3 (동호회 최강전)")
      label: d.subtitle ? `${d.label} (${d.subtitle})` : d.label,
    })),
  ];
}

export function TournamentsFilter({
  onSearchChange,
  onRegionChange,
  onGenderChange,
  onCategoryChange,
  onDivisionChange,
  // 부모(tournaments-content)에서 현재 선택된 종별/성별을 전달받음
  // 디비전 옵션을 동적으로 생성하기 위해 필요
  selectedCategory: externalCategory,
  selectedGender: externalGender,
}: {
  onSearchChange: (query: string) => void;
  onRegionChange: (region: string) => void;
  onGenderChange: (gender: string) => void;
  onCategoryChange: (category: string) => void;
  onDivisionChange: (division: string) => void;
  selectedCategory?: string;
  selectedGender?: string;
}) {
  // 각 필터의 로컬 상태 (URL에 반영하지 않는 클라이언트 필터)
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 실제 사용할 종별/성별: 외부 prop이 있으면 외부 값 사용, 없으면 로컬 상태 사용
  const activeCat = externalCategory ?? selectedCategory;
  const activeGender = externalGender ?? selectedGender;

  // 종별+성별에 따른 디비전 옵션 (종별/성별 바뀔 때마다 재계산)
  const divisionOptions = useMemo(
    () => getDivisionOptions(activeCat, activeGender),
    [activeCat, activeGender]
  );

  // 검색어 입력 핸들러
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
  };

  // 지역 필터 변경
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    onRegionChange(region);
  };

  // 성별 필터 변경 — 성별이 바뀌면 디비전도 초기화
  const handleGenderChange = (gender: string) => {
    setSelectedGender(gender);
    onGenderChange(gender);
    // 성별 변경 시 디비전 초기화 (여성부 <-> 남성부 전환 시 디비전 코드가 다르므로)
    setSelectedDivision("all");
    onDivisionChange("all");
  };

  // 종별 필터 변경 — 종별이 바뀌면 디비전 자동 초기화
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onCategoryChange(category);
    // 종별 변경 시 디비전 초기화 (각 종별마다 디비전 체계가 다르므로)
    setSelectedDivision("all");
    onDivisionChange("all");
  };

  // 디비전 필터 변경
  const handleDivisionChange = (division: string) => {
    setSelectedDivision(division);
    onDivisionChange(division);
  };

  // 전체 초기화
  const handleReset = useCallback(() => {
    setSelectedRegion("all");
    setSelectedGender("all");
    setSelectedCategory("all");
    setSelectedDivision("all");
    setSearchQuery("");
    onRegionChange("all");
    onGenderChange("all");
    onCategoryChange("all");
    onDivisionChange("all");
    onSearchChange("");
  }, [onRegionChange, onGenderChange, onCategoryChange, onDivisionChange, onSearchChange]);

  // 활성 필터 수 계산 ("all"이 아닌 필터 개수)
  const activeCount = [
    selectedRegion !== "all" ? 1 : 0,
    selectedGender !== "all" ? 1 : 0,
    selectedCategory !== "all" ? 1 : 0,
    selectedDivision !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // FloatingFilterPanel에 전달할 필터 설정 배열
  const filterConfigs: FilterConfig[] = [
    {
      key: "region",
      label: "지역",
      type: "select",
      options: REGION_OPTIONS,
      value: selectedRegion,
      onChange: handleRegionChange,
    },
    {
      key: "gender",
      label: "성별",
      type: "select",
      options: GENDER_OPTIONS,
      value: selectedGender,
      onChange: handleGenderChange,
    },
    {
      key: "category",
      label: "종별",
      type: "select",
      options: CATEGORY_OPTIONS,
      value: selectedCategory,
      onChange: handleCategoryChange,
    },
    {
      key: "division",
      label: "디비전",
      type: "select",
      // 종별+성별에 따라 동적으로 옵션이 바뀜
      options: divisionOptions,
      value: selectedDivision,
      onChange: handleDivisionChange,
    },
  ];

  // 검색창 토글 상태
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* 검색 아이콘 버튼 (클릭 시 검색창 토글) */}
      <button
        type="button"
        onClick={() => setShowSearch((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        style={{
          backgroundColor: showSearch ? "var(--color-primary)" : "var(--color-accent)",
          color: "#fff",
        }}
        title="검색"
      >
        <span className="material-symbols-outlined text-lg">search</span>
      </button>

      {/* 검색 input: 토글 시 표시 */}
      {showSearch && (
        <input
          type="text"
          placeholder="대회 검색..."
          value={searchQuery}
          onChange={handleSearch}
          autoFocus
          className="h-9 rounded px-3 text-sm outline-none border transition-all w-40 sm:w-56"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
      )}

      {/* 플로팅 필터 트리거 버튼 */}
      <FloatingFilterPanel
        filters={filterConfigs}
        onReset={handleReset}
        activeCount={activeCount}
      />
    </div>
  );
}
