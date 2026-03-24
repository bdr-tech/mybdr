"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";

/**
 * TournamentsFilter - 대회 목록 필터 컴포넌트 (리디자인)
 *
 * 기존: 상태 탭 4개 (전체/모집중/진행중/완료)
 * 새 디자인: 3개 드롭다운(Region/Date/Fee) + 검색 + 상세 필터 버튼
 *
 * 실제 필터링은 URL searchParams 기반으로 동작.
 * Region은 city 필드, Date는 startDate 기준, Fee는 entryFee 기준.
 * 모든 필터링은 TournamentsContent에서 클라이언트 사이드로 수행.
 */

// -- 드롭다운 옵션 정의 --
const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "registration", label: "모집중" },
  { value: "in_progress", label: "진행중" },
  { value: "completed", label: "완료" },
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
  const currentStatus = params.get("status") ?? "all";

  // 드롭다운 열림 상태 관리
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // 로컬 필터 상태 (URL에 반영하지 않는 클라이언트 필터)
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedFee, setSelectedFee] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 상태 필터 변경 (기존 URL 기반 필터 유지)
  const setStatus = useCallback(
    (value: string) => {
      const sp = new URLSearchParams(params.toString());
      if (!value || value === "all") sp.delete("status");
      else sp.set("status", value);
      router.push(`${pathname}?${sp.toString()}`);
      setOpenDropdown(null);
    },
    [router, pathname, params]
  );

  // 지역 필터 콜백
  const handleRegionChange = (city: string) => {
    setSelectedRegion(city);
    onRegionChange(city);
    setOpenDropdown(null);
  };

  // 참가비 필터 콜백
  const handleFeeChange = (fee: string) => {
    setSelectedFee(fee);
    onFeeChange(fee);
    setOpenDropdown(null);
  };

  // 검색어 입력 핸들러
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
  };

  // 지역 드롭다운 라벨
  const regionLabel = selectedRegion === "all" ? "Region: All" : `Region: ${selectedRegion}`;

  // 참가비 드롭다운 라벨
  const feeLabels: Record<string, string> = {
    all: "Fee: Any",
    free: "Fee: Free",
    paid: "Fee: Paid",
  };
  const feeLabel = feeLabels[selectedFee] ?? "Fee: Any";

  // 상태 드롭다운 라벨
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label ?? "전체";

  return (
    <div className="flex flex-wrap gap-3" ref={dropdownRef}>
      {/* 상태 드롭다운 (기존 탭 필터를 드롭다운으로 변환) */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
          className="flex items-center gap-2 rounded px-4 py-2.5 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          {statusLabel}
          <span className="material-symbols-outlined text-base">expand_more</span>
        </button>
        {openDropdown === "status" && (
          <div
            className="absolute top-full left-0 mt-1 z-20 min-w-[160px] rounded shadow-lg py-1"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className="w-full text-left px-4 py-2 text-sm transition-colors"
                style={{
                  color: opt.value === currentStatus ? "var(--color-primary)" : "var(--color-text-secondary)",
                  backgroundColor: opt.value === currentStatus ? "var(--color-primary-light)" : "transparent",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 지역 드롭다운 */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === "region" ? null : "region")}
          className="flex items-center gap-2 rounded px-4 py-2.5 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          {regionLabel}
          <span className="material-symbols-outlined text-base">expand_more</span>
        </button>
        {openDropdown === "region" && (
          <div
            className="absolute top-full left-0 mt-1 z-20 min-w-[160px] max-h-[240px] overflow-y-auto rounded shadow-lg py-1"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <button
              onClick={() => handleRegionChange("all")}
              className="w-full text-left px-4 py-2 text-sm transition-colors"
              style={{
                color: selectedRegion === "all" ? "var(--color-primary)" : "var(--color-text-secondary)",
                backgroundColor: selectedRegion === "all" ? "var(--color-primary-light)" : "transparent",
              }}
            >
              전체
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => handleRegionChange(city)}
                className="w-full text-left px-4 py-2 text-sm transition-colors"
                style={{
                  color: selectedRegion === city ? "var(--color-primary)" : "var(--color-text-secondary)",
                  backgroundColor: selectedRegion === city ? "var(--color-primary-light)" : "transparent",
                }}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 참가비 드롭다운 */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === "fee" ? null : "fee")}
          className="flex items-center gap-2 rounded px-4 py-2.5 text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          {feeLabel}
          <span className="material-symbols-outlined text-base">payments</span>
        </button>
        {openDropdown === "fee" && (
          <div
            className="absolute top-full left-0 mt-1 z-20 min-w-[160px] rounded shadow-lg py-1"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            {[
              { value: "all", label: "전체" },
              { value: "free", label: "무료" },
              { value: "paid", label: "유료" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFeeChange(opt.value)}
                className="w-full text-left px-4 py-2 text-sm transition-colors"
                style={{
                  color: selectedFee === opt.value ? "var(--color-primary)" : "var(--color-text-secondary)",
                  backgroundColor: selectedFee === opt.value ? "var(--color-primary-light)" : "transparent",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 검색 입력 */}
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

      {/* 상세 필터 버튼 */}
      <button
        className="flex items-center justify-center rounded px-3 py-2.5 transition-colors"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-primary)",
        }}
      >
        <span className="material-symbols-outlined">filter_list</span>
      </button>
    </div>
  );
}
