"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";

// -- 정렬 옵션 --
const SORT_OPTIONS = [
  { value: "wins", label: "랭킹순" },
  { value: "newest", label: "최신순" },
  { value: "winrate", label: "승률순" },
] as const;

/**
 * TeamsFilter - 팀 목록 필터 (리디자인)
 *
 * 기존 검색/도시 필터 로직은 100% 유지.
 * UI를 시안(bdr_3/bdr_4)에 맞춰 탭형 필터 + 검색바 + 정렬로 교체.
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

  // 정렬 상태 (로컬, API에 sort 파라미터가 없으므로 UI만 표시)
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

  // 지역 그룹 생성: 전체 + 도시별 버튼
  // 시안에서는 서울/경기, 충청/강원, 경상/전라 같은 그룹이지만
  // 실제 데이터는 API에서 cities 배열로 내려오므로 그대로 사용
  return (
    <div className="mb-8 flex flex-col gap-4">
      {/* 상단: 필터 탭 + 상세 필터 버튼 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 지역 필터 탭 그룹 */}
        <div
          className="flex items-center p-1 rounded"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          {/* "전체" 버튼 */}
          <button
            onClick={() => update({ city: "all" })}
            className="px-4 py-1.5 text-xs font-medium rounded transition-colors"
            style={
              currentCity === "all"
                ? {
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-on-primary)",
                    fontWeight: 700,
                  }
                : {
                    color: "var(--color-text-secondary)",
                  }
            }
          >
            전체
          </button>
          {/* 도시별 버튼 */}
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => update({ city })}
              className="px-4 py-1.5 text-xs font-medium rounded transition-colors"
              style={
                currentCity === city
                  ? {
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-on-primary)",
                      fontWeight: 700,
                    }
                  : {
                      color: "var(--color-text-secondary)",
                    }
              }
            >
              {city}
            </button>
          ))}
        </div>

        {/* 상세 필터 버튼 */}
        <button
          className="flex items-center gap-2 px-4 py-2 rounded border text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--color-elevated)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span className="material-symbols-outlined text-sm">filter_list</span>
          상세 필터
        </button>
      </div>

      {/* 하단: 검색바 + 총 팀 수 + 정렬 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 검색바 */}
        <div
          className="relative flex items-center rounded px-4 py-2 border focus-within:ring-1"
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
            className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-48"
            style={{
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {/* 우측: 총 팀 수 + 정렬 */}
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            총 {totalCount}개 팀
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm focus:outline-none cursor-pointer"
            style={{
              backgroundColor: "var(--color-card)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
