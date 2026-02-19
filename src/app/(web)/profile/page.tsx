"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Rails users/show — 5탭 프로필 (info, games, stats, teams, tournaments)
const tabs = [
  { id: "info", label: "정보" },
  { id: "games", label: "경기" },
  { id: "stats", label: "기록" },
  { id: "teams", label: "팀" },
  { id: "tournaments", label: "대회" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <div>
      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F4A261] text-2xl font-bold text-[#0A0A0A]">
            U
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">사용자</h1>
            <p className="text-sm text-[#A0A0A0]">user@email.com</p>
          </div>
          <Button variant="secondary" className="text-xs">프로필 수정</Button>
        </div>
      </Card>

      {/* Tabs (Rails _tab_info, _tab_games, _tab_stats, _tab_teams, _tab_tournaments) */}
      <div className="mb-4 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-[rgba(244,162,97,0.12)] font-medium text-[#F4A261]"
                : "text-[#A0A0A0] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card>
        {activeTab === "info" && (
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-[#A0A0A0]">닉네임</span><span>-</span></div>
            <div className="flex justify-between"><span className="text-[#A0A0A0]">포지션</span><span>-</span></div>
            <div className="flex justify-between"><span className="text-[#A0A0A0]">키</span><span>-</span></div>
            <div className="flex justify-between"><span className="text-[#A0A0A0]">지역</span><span>-</span></div>
          </div>
        )}
        {activeTab === "games" && <p className="text-[#A0A0A0]">참여한 경기 이력이 여기에 표시됩니다.</p>}
        {activeTab === "stats" && <p className="text-[#A0A0A0]">통산 기록이 여기에 표시됩니다.</p>}
        {activeTab === "teams" && <p className="text-[#A0A0A0]">소속 팀이 여기에 표시됩니다.</p>}
        {activeTab === "tournaments" && <p className="text-[#A0A0A0]">참가한 대회가 여기에 표시됩니다.</p>}
      </Card>
    </div>
  );
}
