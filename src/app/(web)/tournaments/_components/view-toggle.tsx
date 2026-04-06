"use client";

/**
 * ViewToggle -- 대회 목록의 뷰 모드 전환 버튼 (리스트/월간/주간)
 *
 * 3가지 뷰:
 * - list: 기존 리스트 뷰 (기본값)
 * - calendar: 월간 캘린더 뷰
 * - week: 주간 뷰
 */

export type ViewMode = "list" | "calendar" | "week";

interface ViewToggleProps {
  current: ViewMode;
  onChange: (mode: ViewMode) => void;
}

// 각 뷰 모드의 아이콘과 라벨
const VIEW_OPTIONS: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: "list", icon: "list", label: "리스트" },
  { mode: "calendar", icon: "calendar_month", label: "월간" },
  { mode: "week", icon: "view_week", label: "주간" },
];

export function ViewToggle({ current, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-[var(--color-surface)] p-0.5">
      {VIEW_OPTIONS.map(({ mode, icon, label }) => {
        const isActive = current === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            title={label}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all"
            style={{
              // 활성 탭: 카드 배경 + 텍스트 강조
              backgroundColor: isActive ? "var(--color-card)" : "transparent",
              color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
              boxShadow: isActive ? "var(--shadow-card)" : "none",
            }}
          >
            <span className="material-symbols-outlined text-base">{icon}</span>
            {/* 모바일에서는 아이콘만, 데스크톱에서는 라벨도 표시 */}
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
