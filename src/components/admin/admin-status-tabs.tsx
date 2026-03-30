"use client";

// 관리자 상태 탭 — 프론트 대회 탭과 동일한 밑줄 스타일
// 각 페이지에서 "전체/준비중/진행중/종료" 등 상태 필터링에 사용
interface Tab {
  key: string;
  label: string;
  count?: number; // 탭 옆에 표시할 개수 (예: "접수중 (12)")
}

interface AdminStatusTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export function AdminStatusTabs({
  tabs,
  activeTab,
  onChange,
}: AdminStatusTabsProps) {
  return (
    // 가로 스크롤 가능 — 모바일에서 탭이 많아도 사용 가능
    <div className="mb-4 overflow-x-auto">
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {/* 탭 라벨 + 개수 뱃지 */}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1.5 inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-xs ${
                    isActive
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "bg-[var(--color-elevated)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {/* 활성 탭 밑줄 — primary 색상 */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--color-accent)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
