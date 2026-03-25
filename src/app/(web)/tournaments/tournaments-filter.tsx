"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { FloatingFilterPanel, type FilterConfig } from "@/components/shared/floating-filter-panel";

/**
 * TournamentsFilter - 대회 필터 (플로팅 패널 방식으로 교체)
 *
 * 기존: 커스텀 드롭다운 3개 (상태/지역/참가비) + 검색
 * 변경: 검색바 인라인 + FloatingFilterPanel 트리거
 *
 * 상태 필터는 URL params (status), 지역/참가비는 클라이언트 사이드 콜백.
 */

// 상태 옵션 (기존 유지)
const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "registration", label: "모집중" },
  { value: "in_progress", label: "진행중" },
  { value: "completed", label: "완료" },
];

// 참가비 옵션
const FEE_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "free", label: "무료" },
  { value: "paid", label: "유료" },
];

export function TournamentsFilter({
  cities,
  onSearchChange,
  onRegionChange,
  onFeeChange,
}: {
  cities: string[];
  onSearchChange: (query: string) => void;
  onRegionChange: (city: string) => void;
  onFeeChange: (fee: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // 로컬 필터 상태 (URL에 반영하지 않는 클라이언트 필터)
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedFee, setSelectedFee] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 현재 상태 필터값 (URL params)
  const currentStatus = params.get("status") ?? "all";

  // 상태 필터 변경 (기존 URL 기반 필터 유지)
  const setStatus = useCallback(
    (value: string) => {
      const sp = new URLSearchParams(params.toString());
      if (!value || value === "all") sp.delete("status");
      else sp.set("status", value);
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, params]
  );

  // 검색어 입력 핸들러
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
  };

  // 지역 필터 콜백
  const handleRegionChange = (city: string) => {
    setSelectedRegion(city);
    onRegionChange(city);
  };

  // 참가비 필터 콜백
  const handleFeeChange = (fee: string) => {
    setSelectedFee(fee);
    onFeeChange(fee);
  };

  // 전체 초기화
  const handleReset = useCallback(() => {
    // URL params 초기화 (상태 필터)
    router.push(pathname);
    // 클라이언트 필터 초기화
    setSelectedRegion("all");
    setSelectedFee("all");
    setSearchQuery("");
    onRegionChange("all");
    onFeeChange("all");
    onSearchChange("");
  }, [router, pathname, onRegionChange, onFeeChange, onSearchChange]);

  // 지역 옵션: "전체" + API에서 받은 도시 목록
  const cityOptions = [
    { value: "all", label: "전체" },
    ...cities.map((c) => ({ value: c, label: c })),
  ];

  // 활성 필터 수 계산
  const activeCount = [
    currentStatus !== "all" ? 1 : 0,
    selectedRegion !== "all" ? 1 : 0,
    selectedFee !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // FloatingFilterPanel에 전달할 필터 설정
  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: "상태",
      type: "select",
      options: STATUS_OPTIONS,
      value: currentStatus,
      onChange: setStatus,
    },
    {
      key: "region",
      label: "지역",
      type: "select",
      options: cityOptions,
      value: selectedRegion,
      onChange: handleRegionChange,
    },
    {
      key: "fee",
      label: "참가비",
      type: "select",
      options: FEE_OPTIONS,
      value: selectedFee,
      onChange: handleFeeChange,
    },
  ];

  return (
    <div className="flex items-center gap-3">
      {/* 검색바: 인라인 유지 (패널 밖) */}
      <div
        className="flex items-center gap-2 rounded px-3 py-2 flex-1 min-w-[200px]"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <span
          className="material-symbols-outlined text-lg"
          style={{ color: "var(--color-text-disabled)" }}
        >
          search
        </span>
        <input
          type="text"
          placeholder="대회 검색..."
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 bg-transparent border-none outline-none text-sm"
          style={{ color: "var(--color-text-primary)" }}
        />
      </div>

      {/* 플로팅 필터 트리거 버튼 */}
      <FloatingFilterPanel
        filters={filterConfigs}
        onReset={handleReset}
        activeCount={activeCount}
      />
    </div>
  );
}
