"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";

const GAME_TYPES = [
  { value: "all", label: "전체 유형" },
  { value: "0",   label: "🏀 픽업" },
  { value: "1",   label: "🤝 용병 모집" },
  { value: "2",   label: "⚔️ 팀 대결" },
];

const DATE_OPTIONS = [
  { value: "all",   label: "전체 날짜" },
  { value: "today", label: "오늘" },
  { value: "week",  label: "이번 주" },
  { value: "month", label: "이번 달" },
];

const selectCls =
  "h-10 appearance-none rounded-[12px] border border-[#2A2A2A] bg-[#1A1A1A] pl-3 pr-8 text-sm text-white focus:border-[#F4A261]/60 focus:outline-none cursor-pointer";

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex-shrink-0">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666]"
        width="12" height="12" viewBox="0 0 12 12" fill="none"
      >
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function GamesFilter({ cities }: { cities: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

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

  const handleSearch = (v: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update({ q: v }), 380);
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {/* 텍스트 검색 */}
      <div className="relative min-w-[180px] flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]"
          width="15" height="15" viewBox="0 0 15 15" fill="none"
        >
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="경기 검색..."
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-10 w-full rounded-[12px] border border-[#2A2A2A] bg-[#1A1A1A] pl-9 pr-4 text-sm text-white placeholder:text-[#555555] focus:border-[#F4A261]/60 focus:outline-none"
        />
      </div>

      <Select value={params.get("type") ?? "all"} onChange={(v) => update({ type: v })}>
        {GAME_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </Select>

      <Select value={params.get("city") ?? "all"} onChange={(v) => update({ city: v })}>
        <option value="all">전체 지역</option>
        {cities.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>

      <Select value={params.get("date") ?? "all"} onChange={(v) => update({ date: v })}>
        {DATE_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
      </Select>
    </div>
  );
}
