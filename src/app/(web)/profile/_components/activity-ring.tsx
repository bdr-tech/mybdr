"use client";

import { useState, useEffect } from "react";
import { Crown, Flame, Trophy, Zap } from "lucide-react";

const MILESTONES = [
  { key: "bronze", label: "Bronze", target: 8, color: "#CD7F32" },
  { key: "silver", label: "Silver", target: 12, color: "#C0C0C0" },
  { key: "gold", label: "Gold", target: 20, color: "#FFD700" },
] as const;

interface ActivityRingProps {
  monthlyGames: number;
  totalGames: number;
  totalTournaments: number;
}

export function ActivityRing({ monthlyGames, totalGames, totalTournaments }: ActivityRingProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const goldTarget = MILESTONES[2].target;
  const pct = Math.min((monthlyGames / goldTarget) * 100, 100);
  const deg = (pct / 100) * 360;

  const currentTier =
    monthlyGames >= 20 ? "gold" : monthlyGames >= 12 ? "silver" : monthlyGames >= 8 ? "bronze" : null;

  const tierColor =
    currentTier === "gold" ? "#FFD700" : currentTier === "silver" ? "#C0C0C0" : currentTier === "bronze" ? "#CD7F32" : "#F4A261";

  const monthName = new Date().toLocaleDateString("ko-KR", { month: "long" });

  const nextMilestone = MILESTONES.find((m) => monthlyGames < m.target);
  const remaining = nextMilestone ? nextMilestone.target - monthlyGames : 0;

  // 다크모드 색상
  const ringInnerBg = isDark ? "#1A1D27" : "#FFFFFF";
  const trackColor = isDark ? "#2A2D37" : "#E8ECF0";

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#1B3C87]/5 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-[#F4A261]/5 blur-2xl" />

      {/* 헤더 */}
      <div className="relative mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#E31B23] to-[#F4A261]">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-[#111827]" style={{ fontFamily: "var(--font-heading)" }}>
              {monthName} 챌린지
            </h2>
            <p className="text-xs text-[#9CA3AF]">월간 활동 목표</p>
          </div>
        </div>
        {currentTier && (
          <div
            className="flex items-center gap-1 rounded-full px-3 py-1"
            style={{ backgroundColor: `${tierColor}20`, border: `1px solid ${tierColor}60` }}
          >
            <Crown size={12} style={{ color: tierColor }} />
            <span className="text-[11px] font-bold uppercase" style={{ color: tierColor }}>
              {currentTier}
            </span>
          </div>
        )}
      </div>

      {/* 메인: 링 + 스탯 */}
      <div className="relative mb-5 flex items-center gap-5">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <div
            className="flex h-[120px] w-[120px] items-center justify-center rounded-full p-[3px]"
            style={{
              background: currentTier === "gold"
                ? `conic-gradient(#FFD700 0deg, #F4A261 ${deg}deg, ${trackColor} ${deg}deg 360deg)`
                : `conic-gradient(#F4A261 0deg, #E31B23 ${deg}deg, ${trackColor} ${deg}deg 360deg)`,
            }}
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full" style={{ backgroundColor: ringInnerBg }}>
              <span className="text-3xl font-black text-[#111827]">{monthlyGames}</span>
              <span className="text-xs font-medium text-[#9CA3AF]">/ {goldTarget}</span>
            </div>
          </div>
          {currentTier === "gold" && (
            <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700] to-[#F4A261] shadow-lg shadow-[#FFD700]/40">
              <Crown size={16} className="text-white" />
            </div>
          )}
        </div>

        {/* 스탯 카드 */}
        <div className="flex flex-1 flex-col gap-2.5">
          <div className="flex items-center gap-3 rounded-2xl border border-[#E8ECF0] bg-[#F9FAFB] px-3.5 py-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E31B23]/10">
              <Flame size={20} className="text-[#E31B23]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">총 참가</p>
              <p className="text-xl font-black leading-tight text-[#111827]">{totalGames}<span className="ml-0.5 text-xs font-medium text-[#9CA3AF]">경기</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#E8ECF0] bg-[#F9FAFB] px-3.5 py-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4A261]/10">
              <Trophy size={20} className="text-[#F4A261]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">대회</p>
              <p className="text-xl font-black leading-tight text-[#111827]">{totalTournaments}<span className="ml-0.5 text-xs font-medium text-[#9CA3AF]">회</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 마일스톤 프로그레스 */}
      <div className="relative">
        <div className="mb-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: trackColor }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: currentTier === "gold"
                ? "linear-gradient(90deg, #CD7F32, #C0C0C0, #FFD700)"
                : "linear-gradient(90deg, #E31B23, #F4A261)",
            }}
          />
        </div>

        <div className="flex justify-between px-0.5">
          {MILESTONES.map((m) => {
            const achieved = monthlyGames >= m.target;
            return (
              <div key={m.key} className="flex flex-col items-center" style={{ width: `${100 / 3}%` }}>
                <div
                  className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full transition-all ${achieved ? "scale-110" : ""}`}
                  style={{
                    backgroundColor: achieved ? m.color : trackColor,
                    boxShadow: achieved ? `0 0 12px ${m.color}40` : "none",
                  }}
                >
                  <Crown size={13} style={{ color: achieved ? "#FFFFFF" : "#9CA3AF" }} />
                </div>
                <span className="text-xs font-bold uppercase" style={{ color: achieved ? m.color : "#9CA3AF" }}>
                  {m.label}
                </span>
                <span className="text-xs text-[#9CA3AF]">{m.target}경기</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 동기부여 메시지 */}
      <div className="mt-4 rounded-xl bg-[#F9FAFB] px-4 py-2.5 text-center">
        {monthlyGames === 0 && (
          <p className="text-xs text-[#6B7280]">
            이번 달 첫 경기에 참가해서 <span className="font-bold text-[#CD7F32]">Bronze</span>에 도전해보세요!
          </p>
        )}
        {monthlyGames > 0 && !currentTier && (
          <p className="text-xs text-[#6B7280]">
            <span className="font-bold text-[#CD7F32]">Bronze</span>까지 <span className="font-black text-[#111827]">{remaining}경기</span> 남았습니다
          </p>
        )}
        {currentTier === "bronze" && (
          <p className="text-xs text-[#6B7280]">
            <span className="font-bold text-[#C0C0C0]">Silver</span>까지 <span className="font-black text-[#111827]">{remaining}경기</span> 남았습니다
          </p>
        )}
        {currentTier === "silver" && (
          <p className="text-xs text-[#6B7280]">
            <span className="font-bold text-[#FFD700]">Gold</span>까지 <span className="font-black text-[#111827]">{remaining}경기</span> 남았습니다
          </p>
        )}
        {currentTier === "gold" && (
          <p className="text-xs font-bold text-[#FFD700]">
            이달의 활동왕! Gold를 달성했습니다
          </p>
        )}
      </div>
    </div>
  );
}
