"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";

// 경기 유형 옵션 (기존 로직 유지)
const GAME_TYPES = [
  { value: "all", label: "전체 유형", icon: "sports_basketball" },
  { value: "0",   label: "픽업",     icon: "sports_basketball" },
  { value: "1",   label: "게스트",   icon: "group_add" },
  { value: "2",   label: "연습경기", icon: "fitness_center" },
];

// 날짜 옵션 (기존 로직 유지)
const DATE_OPTIONS = [
  { value: "all",   label: "전체 날짜" },
  { value: "today", label: "오늘" },
  { value: "week",  label: "이번 주" },
  { value: "month", label: "이번 달" },
];

// 실력 옵션 (새로 추가 - 디자인 시안에 맞춤)
const SKILL_OPTIONS = [
  { value: "all",                  label: "전체 실력" },
  { value: "beginner",             label: "초급" },
  { value: "intermediate",         label: "중급" },
  { value: "intermediate_advanced", label: "중상" },
  { value: "advanced",             label: "상급" },
];

/**
 * 인라인 필터 바 - 디자인 시안(bdr_1, bdr_5)에 맞춘 인라인 필터
 *
 * 기존 플로팅 패널 방식에서 인라인 필터 바로 변경.
 * URL 쿼리 파라미터 기반 필터링 로직은 100% 유지.
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

  // 활성 필터 여부 확인
  const hasActiveFilters = params.get("q") || params.get("type") || params.get("city") || params.get("date") || params.get("skill");

  // 전체 필터 초기화
  const clearAll = () => {
    router.push(pathname);
  };

  return (
    <div className="space-y-4">
      {/* 검색창 - 디자인 시안 상단 우측의 인라인 검색 */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[var(--color-text-muted)]">
          search
        </span>
        <input
          type="text"
          placeholder="Search games..."
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-10 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none transition-all"
        />
      </div>

      {/* 필터 바 - 디자인 시안의 인라인 4칸 + Apply Filters 버튼 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 종목(Type) 필터 */}
        <div className="flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors">
          <span className="material-symbols-outlined text-[var(--color-text-muted)] text-lg">
            sports_basketball
          </span>
          <select
            value={params.get("type") ?? "all"}
            onChange={(e) => update({ type: e.target.value })}
            className="appearance-none bg-transparent text-sm font-medium text-[var(--color-text-primary)] cursor-pointer focus:outline-none pr-1"
          >
            {GAME_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[var(--color-text-muted)] text-sm">
            expand_more
          </span>
        </div>

        {/* 날짜(Date) 필터 */}
        <div className="flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors">
          <span className="material-symbols-outlined text-[var(--color-text-muted)] text-lg">
            calendar_today
          </span>
          <select
            value={params.get("date") ?? "all"}
            onChange={(e) => update({ date: e.target.value })}
            className="appearance-none bg-transparent text-sm font-medium text-[var(--color-text-primary)] cursor-pointer focus:outline-none pr-1"
          >
            {DATE_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[var(--color-text-muted)] text-sm">
            expand_more
          </span>
        </div>

        {/* 지역(Region) 필터 */}
        <div className="flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors">
          <span className="material-symbols-outlined text-[var(--color-text-muted)] text-lg">
            location_on
          </span>
          <select
            value={params.get("city") ?? "all"}
            onChange={(e) => update({ city: e.target.value })}
            className="appearance-none bg-transparent text-sm font-medium text-[var(--color-text-primary)] cursor-pointer focus:outline-none pr-1"
          >
            <option value="all">전체 지역</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[var(--color-text-muted)] text-sm">
            expand_more
          </span>
        </div>

        {/* 실력(Skill) 필터 */}
        <div className="flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors">
          <span className="material-symbols-outlined text-[var(--color-text-muted)] text-lg">
            bolt
          </span>
          <select
            value={params.get("skill") ?? "all"}
            onChange={(e) => update({ skill: e.target.value })}
            className="appearance-none bg-transparent text-sm font-medium text-[var(--color-text-primary)] cursor-pointer focus:outline-none pr-1"
          >
            {SKILL_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <span className="material-symbols-outlined text-[var(--color-text-muted)] text-sm">
            expand_more
          </span>
        </div>

        {/* Apply Filters / 초기화 버튼 - 우측으로 밀기 */}
        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="px-4 py-2 rounded text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              초기화
            </button>
          )}
          <button
            onClick={() => {
              /* 현재 필터는 실시간 적용이므로 시각적 피드백만 제공 */
              /* 향후 지연 적용(batch) 방식으로 전환 시 여기서 일괄 적용 */
            }}
            className="bg-[var(--color-primary)] text-white px-6 py-2 rounded text-sm font-bold hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
