"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { FloatingFilterPanel, type FilterConfig } from "@/components/shared/floating-filter-panel";

// 정렬 옵션 (기존 유지)
const SORT_OPTIONS = [
  { value: "wins", label: "랭킹순" },
  { value: "newest", label: "최신순" },
  { value: "winrate", label: "승률순" },
];

/**
 * TeamsFilter - 팀 필터 (플로팅 패널 방식으로 교체)
 *
 * 기존: 지역 탭 그룹 + 검색바 + 정렬 + "상세 필터" 버튼(미구현)
 * 변경: 검색바 인라인 + FloatingFilterPanel (지역 + 정렬)
 *
 * URL 쿼리 파라미터 기반 필터링 로직은 100% 유지.
 */
export function TeamsFilter({
  cities,
  totalCount,
}: {
  cities: string[];
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // 정렬 상태 (로컬)
  const [sortBy, setSortBy] = useState("wins");

  // URL 파라미터 업데이트 (기존 로직 그대로)
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

  // 검색 디바운스 (기존 로직 그대로)
  const handleSearch = (v: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update({ q: v }), 380);
  };

  // 현재 선택된 도시
  const currentCity = params.get("city") ?? "all";

  // 전체 초기화
  const handleReset = useCallback(() => {
    router.push(pathname);
    setSortBy("wins");
  }, [router, pathname]);

  // 지역 옵션
  const cityOptions = [
    { value: "all", label: "전체" },
    ...cities.map((c) => ({ value: c, label: c })),
  ];

  // 활성 필터 수 계산
  const activeCount = [
    currentCity !== "all" ? 1 : 0,
    sortBy !== "wins" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // FloatingFilterPanel에 전달할 필터 설정
  const filterConfigs: FilterConfig[] = [
    {
      key: "city",
      label: "지역",
      type: "select",
      options: cityOptions,
      value: currentCity,
      onChange: (v) => update({ city: v }),
    },
    {
      key: "sort",
      label: "정렬",
      type: "select",
      options: SORT_OPTIONS,
      value: sortBy,
      onChange: (v) => setSortBy(v),
    },
  ];

  return (
    <div className="mb-8 flex items-center gap-3">
      {/* 검색바: 인라인 유지 */}
      <div
        className="relative flex items-center rounded px-4 py-2 border flex-1 focus-within:ring-1"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <span
          className="material-symbols-outlined text-xl mr-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          search
        </span>
        <input
          type="text"
          placeholder="팀 이름 검색..."
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm flex-1"
          style={{
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      {/* 총 팀 수 표시 */}
      <span
        className="text-sm font-medium shrink-0 hidden sm:block"
        style={{ color: "var(--color-text-muted)" }}
      >
        총 {totalCount}개 팀
      </span>

      {/* 플로팅 필터 트리거 버튼 */}
      <FloatingFilterPanel
        filters={filterConfigs}
        onReset={handleReset}
        activeCount={activeCount}
      />
    </div>
  );
}
