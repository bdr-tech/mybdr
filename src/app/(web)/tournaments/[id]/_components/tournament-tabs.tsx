"use client";

/**
 * 대회 상세 탭 전환 컴포넌트
 * - 5개 탭(개요/일정/순위/대진표/참가팀)을 페이지 이동 없이 클라이언트 상태로 전환
 * - 서버에서 받은 모든 데이터를 Props로 전달받아 조건부 렌더링
 */

import { useState, type ReactNode } from "react";

// 탭 타입 정의
export type TabKey = "overview" | "schedule" | "standings" | "bracket" | "teams";

// 탭 메타 정보 (라벨 + 아이콘)
const TAB_META: { key: TabKey; label: string; icon: string }[] = [
  { key: "overview", label: "개요", icon: "info" },
  { key: "schedule", label: "일정", icon: "calendar_month" },
  { key: "standings", label: "순위", icon: "leaderboard" },
  { key: "bracket", label: "대진표", icon: "account_tree" },
  { key: "teams", label: "참가팀", icon: "groups" },
];

interface TournamentTabsProps {
  // 각 탭의 콘텐츠를 ReactNode로 전달 (서버 컴포넌트에서 미리 렌더링)
  overviewContent: ReactNode;
  scheduleContent: ReactNode;
  standingsContent: ReactNode;
  bracketContent: ReactNode;
  teamsContent: ReactNode;
}

export function TournamentTabs({
  overviewContent,
  scheduleContent,
  standingsContent,
  bracketContent,
  teamsContent,
}: TournamentTabsProps) {
  // 현재 활성 탭 상태 (기본: 개요)
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // 탭 키 -> 콘텐츠 매핑
  const tabContentMap: Record<TabKey, ReactNode> = {
    overview: overviewContent,
    schedule: scheduleContent,
    standings: standingsContent,
    bracket: bracketContent,
    teams: teamsContent,
  };

  return (
    <div>
      {/* 밑줄 탭 네비게이션: 모바일 가로 스크롤 + 스크롤바 숨김 */}
      <div
        className="mb-6 flex gap-4 overflow-x-auto border-b sm:mb-8 sm:gap-8 [&::-webkit-scrollbar]:hidden"
        style={{
          borderColor: "var(--color-border)",
          /* 스크롤바 숨김: WebKit + Firefox */
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {TAB_META.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="whitespace-nowrap pb-3 text-sm font-medium transition-colors sm:pb-4 sm:text-base"
              style={
                isActive
                  ? {
                      // 선택된 탭: primary 색상 + 밑줄 + 굵은 텍스트
                      color: "var(--color-primary)",
                      fontWeight: 700,
                      borderBottom: "2px solid var(--color-primary)",
                      marginBottom: "-1px",
                    }
                  : { color: "var(--color-text-secondary)" }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 활성 탭의 콘텐츠만 렌더링 */}
      <div>{tabContentMap[activeTab]}</div>
    </div>
  );
}
