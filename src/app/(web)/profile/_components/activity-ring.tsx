"use client";

import { useState, useEffect } from "react";
// lucide-react 제거 → Material Symbols Outlined 사용

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

  // 다크모드 색상: CSS 변수 기반으로 전환
  const ringInnerBg = isDark ? "var(--color-background)" : "var(--color-card)";
  const trackColor = isDark ? "var(--color-border)" : "var(--color-surface)";

  return (
    /* 카드 외형: CSS 변수 적용 */
    <div className="relative overflow-hidden rounded-[20px] border p-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', boxShadow: 'var(--shadow-card)' }}>
      {/* 배경 장식: primary/accent 색상 기반 */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(27, 60, 135, 0.05)' }} />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full blur-2xl" style={{ backgroundColor: 'rgba(244, 162, 97, 0.05)' }} />

      {/* 헤더 */}
      <div className="relative mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 아이콘 배경: accent 그라데이션 */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))' }}>
            <span className="material-symbols-outlined text-base text-white">bolt</span>
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)", color: 'var(--color-text-primary)' }}>
              {monthName} 챌린지
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>월간 활동 목표</p>
          </div>
        </div>
        {currentTier && (
          <div
            className="flex items-center gap-1 rounded-full px-3 py-1"
            style={{ backgroundColor: `${tierColor}20`, border: `1px solid ${tierColor}60` }}
          >
            <span className="material-symbols-outlined text-xs" style={{ color: tierColor }}>workspace_premium</span>
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
                : `conic-gradient(#F4A261 0deg, var(--color-accent) ${deg}deg, ${trackColor} ${deg}deg 360deg)`,
            }}
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full" style={{ backgroundColor: ringInnerBg }}>
              {/* 중앙 숫자: 메인 텍스트 색상 */}
              <span className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>{monthlyGames}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>/ {goldTarget}</span>
            </div>
          </div>
          {currentTier === "gold" && (
            <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700] to-[#F4A261] shadow-lg shadow-[#FFD700]/40">
              <span className="material-symbols-outlined text-base text-white">workspace_premium</span>
            </div>
          )}
        </div>

        {/* 스탯 카드: 테두리/배경 CSS 변수 */}
        <div className="flex flex-1 flex-col gap-2.5">
          <div className="flex items-center gap-3 rounded-2xl border px-3.5 py-2.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-elevated)' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-accent-light)' }}>
              <span className="material-symbols-outlined text-xl" style={{ color: 'var(--color-accent)' }}>local_fire_department</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>총 참가</p>
              <p className="text-xl font-black leading-tight" style={{ color: 'var(--color-text-primary)' }}>{totalGames}<span className="ml-0.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>경기</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border px-3.5 py-2.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-elevated)' }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4A261]/10">
              <span className="material-symbols-outlined text-xl text-[#F4A261]">emoji_events</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>대회</p>
              <p className="text-xl font-black leading-tight" style={{ color: 'var(--color-text-primary)' }}>{totalTournaments}<span className="ml-0.5 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>회</span></p>
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
                : "linear-gradient(90deg, var(--color-accent-hover), var(--color-accent))",
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
                  <span className="material-symbols-outlined text-[13px]" style={{ color: achieved ? "#FFFFFF" : "var(--color-text-muted)" }}>workspace_premium</span>
                </div>
                <span className="text-xs font-bold uppercase" style={{ color: achieved ? m.color : "var(--color-text-muted)" }}>
                  {m.label}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{m.target}경기</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 동기부여 메시지: 배경 CSS 변수 */}
      <div className="mt-4 rounded-xl px-4 py-2.5 text-center" style={{ backgroundColor: 'var(--color-elevated)' }}>
        {monthlyGames === 0 && (
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            이번 달 첫 경기에 참가해서 <span className="font-bold text-[#CD7F32]">Bronze</span>에 도전해보세요!
          </p>
        )}
        {monthlyGames > 0 && !currentTier && (
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="font-bold text-[#CD7F32]">Bronze</span>까지 <span className="font-black" style={{ color: 'var(--color-text-primary)' }}>{remaining}경기</span> 남았습니다
          </p>
        )}
        {currentTier === "bronze" && (
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="font-bold text-[#C0C0C0]">Silver</span>까지 <span className="font-black" style={{ color: 'var(--color-text-primary)' }}>{remaining}경기</span> 남았습니다
          </p>
        )}
        {currentTier === "silver" && (
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="font-bold text-[#FFD700]">Gold</span>까지 <span className="font-black" style={{ color: 'var(--color-text-primary)' }}>{remaining}경기</span> 남았습니다
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
