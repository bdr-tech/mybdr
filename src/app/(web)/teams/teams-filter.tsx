"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";

const selectCls =
  "h-10 appearance-none rounded-[12px] border border-[#2A2A2A] bg-[#1A1A1A] pl-3 pr-8 text-sm text-white focus:border-[#F4A261]/60 focus:outline-none cursor-pointer";

export function TeamsFilter({ cities }: { cities: string[] }) {
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
          placeholder="팀 이름 검색..."
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-10 w-full rounded-[12px] border border-[#2A2A2A] bg-[#1A1A1A] pl-9 pr-4 text-sm text-white placeholder:text-[#555555] focus:border-[#F4A261]/60 focus:outline-none"
        />
      </div>

      <div className="relative flex-shrink-0">
        <select
          value={params.get("city") ?? "all"}
          onChange={(e) => update({ city: e.target.value })}
          className={selectCls}
        >
          <option value="all">전체 지역</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666]"
          width="12" height="12" viewBox="0 0 12 12" fill="none"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
