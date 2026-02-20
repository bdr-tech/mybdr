"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const STATUSES = [
  { value: "all",               label: "전체" },
  { value: "registration_open", label: "모집중" },
  { value: "ongoing",           label: "진행중" },
  { value: "completed",         label: "완료" },
];

export function TournamentsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("status") ?? "all";

  const setStatus = useCallback(
    (value: string) => {
      const sp = new URLSearchParams(params.toString());
      if (!value || value === "all") sp.delete("status");
      else sp.set("status", value);
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, params]
  );

  return (
    <div className="mb-6 flex gap-1.5 overflow-x-auto">
      {STATUSES.map((s) => {
        const active = current === s.value;
        return (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
              active
                ? "bg-[#F4A261] text-[#0A0A0A]"
                : "border border-[#2A2A2A] text-[#A0A0A0] hover:border-[#F4A261]/40 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
