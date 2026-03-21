"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const STATUSES = [
  { value: "all",           label: "전체" },
  { value: "registration",  label: "모집중" },
  { value: "in_progress",   label: "진행중" },
  { value: "completed",     label: "완료" },
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
    <div className="mb-6 flex gap-2 overflow-x-auto">
      {STATUSES.map((s) => {
        const active = current === s.value;
        return (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium min-h-[44px] transition-all ${
              active
                ? "bg-[var(--color-accent)] text-white shadow-sm"
                : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text-primary)]"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
