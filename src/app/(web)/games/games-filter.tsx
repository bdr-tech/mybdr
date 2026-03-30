"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { FloatingFilterPanel, type FilterConfig } from "@/components/shared/floating-filter-panel";

// 경기 유형 옵션 (기존 로직 유지)
const GAME_TYPES = [
  { value: "all", label: "전체 유형" },
  { value: "0",   label: "픽업" },
  { value: "1",   label: "게스트" },
  { value: "2",   label: "연습경기" },
];

// 날짜 옵션 (기존 로직 유지)
const DATE_OPTIONS = [
  { value: "all",   label: "전체 날짜" },
  { value: "today", label: "오늘" },
  { value: "week",  label: "이번 주" },
  { value: "month", label: "이번 달" },
];

// 실력 옵션 (기존 로직 유지)
const SKILL_OPTIONS = [
  { value: "all",                  label: "전체 실력" },
  { value: "beginner",             label: "초급" },
  { value: "intermediate",         label: "중급" },
  { value: "intermediate_advanced", label: "중상" },
  { value: "advanced",             label: "상급" },
];

/**
 * GamesFilter - 경기 필터 (플로팅 패널 방식으로 교체)
 *
 * 기존: 인라인 select 4개 + "Apply Filters" 버튼
 * 변경: FloatingFilterPanel 트리거 버튼만 노출, 클릭 시 패널 열림
 *
 * URL 쿼리 파라미터 기반 필터링 로직은 100% 유지.
 * 검색바만 인라인으로 남기고, 나머지 필터는 패널 안으로 이동.
 */
export function GamesFilter({ cities }: { cities: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // 기존 update 함수 유지 - URL 쿼리 파라미터를 업데이트
  const update = useCallback(
    (updates: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === "all") sp.delete(k);
        else sp.set(k, v);
      }
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, params]
  );

  // 기존 검색 디바운스 로직 유지
  const handleSearch = (v: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update({ q: v }), 380);
  };

  // 전체 필터 초기화
  const clearAll = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  // 현재 필터 값 읽기 (URL params에서)
  const currentType = params.get("type") ?? "all";
  const currentDate = params.get("date") ?? "all";
  const currentCity = params.get("city") ?? "all";
  const currentSkill = params.get("skill") ?? "all";

  // 활성 필터 수 계산 (기본값 "all"이 아닌 것의 개수)
  const activeCount = [currentType, currentDate, currentCity, currentSkill]
    .filter((v) => v !== "all")
    .length;

  // 지역 옵션: "전체" + API에서 받은 도시 목록
  const cityOptions = [
    { value: "all", label: "전체 지역" },
    ...cities.map((c) => ({ value: c, label: c })),
  ];

  // FloatingFilterPanel에 전달할 필터 설정 배열
  const filterConfigs: FilterConfig[] = [
    {
      key: "type",
      label: "유형",
      type: "select",
      options: GAME_TYPES,
      value: currentType,
      onChange: (v) => update({ type: v }),
    },
    {
      key: "date",
      label: "날짜",
      type: "select",
      options: DATE_OPTIONS,
      value: currentDate,
      onChange: (v) => update({ date: v }),
    },
    {
      key: "city",
      label: "지역",
      type: "select",
      options: cityOptions,
      value: currentCity,
      onChange: (v) => update({ city: v }),
    },
    {
      key: "skill",
      label: "실력",
      type: "select",
      options: SKILL_OPTIONS,
      value: currentSkill,
      onChange: (v) => update({ skill: v }),
    },
  ];

  // 모바일에서 검색창 열기/닫기 토글 (작은 화면에서 공간 절약)
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* 모바일: 검색 아이콘 토글 버튼 (md 이상에서는 숨김) */}
      <button
        type="button"
        onClick={() => setSearchOpen(!searchOpen)}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-full transition-colors shrink-0"
        style={{
          backgroundColor: searchOpen ? "var(--color-primary)" : "var(--color-surface)",
          color: searchOpen ? "#fff" : "var(--color-text-secondary)",
        }}
        title="검색"
      >
        <span className="material-symbols-outlined text-lg">search</span>
      </button>

      {/* 검색바: 데스크탑에서는 항상 보임, 모바일에서는 토글 */}
      <div className={`relative ${searchOpen ? "block" : "hidden"} md:block`}>
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base" style={{ color: "var(--color-text-muted)" }}>
          search
        </span>
        <input
          type="text"
          placeholder="경기 검색..."
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-9 w-[160px] lg:w-[200px] rounded border pl-8 pr-3 text-sm focus:ring-1 focus:outline-none transition-all"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      {/* 플로팅 필터 트리거 버튼 */}
      <FloatingFilterPanel
        filters={filterConfigs}
        onReset={clearAll}
        activeCount={activeCount}
      />
    </div>
  );
}
