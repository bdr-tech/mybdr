"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

interface CareerAverages {
  gamesPlayed: number;
  avgPoints: number;
  avgRebounds: number;
  avgAssists: number;
  avgSteals: number;
  avgBlocks: number;
}

interface SeasonHighs {
  maxPoints: number;
  maxRebounds: number;
  maxAssists: number;
}

interface StatBarsProps {
  careerAverages: CareerAverages | null;
  seasonHighs: SeasonHighs | null;
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-right text-xs text-[#9CA3AF]">{label}</span>
      <div className="flex-1">
        <div className="h-5 overflow-hidden rounded-full bg-[#E8ECF0]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${width}%`, backgroundColor: color }}
          />
        </div>
      </div>
      <span className="w-10 text-right text-sm font-bold text-[#111827]">{value}</span>
    </div>
  );
}

export function StatBars({ careerAverages, seasonHighs }: StatBarsProps) {
  if (!careerAverages) {
    return (
      <div className="rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h2
          className="mb-3 text-base font-bold uppercase tracking-wide text-[#111827]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          내 기록
        </h2>
        <div className="flex flex-col items-center gap-3 py-6">
          <TrendingUp size={32} className="text-[#F4A261]" />
          <p className="text-sm font-bold text-[#111827]">아직 기록이 없어요</p>
          <p className="text-xs text-[#6B7280]">대회에 참가하면 스탯이 기록됩니다</p>
          <Link
            href="/tournaments"
            className="mt-1 rounded-[10px] bg-[#E31B23] px-4 py-2 text-xs font-bold text-white hover:bg-[#C8101E]"
          >
            대회 둘러보기
          </Link>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(
    seasonHighs?.maxPoints ?? careerAverages.avgPoints,
    seasonHighs?.maxRebounds ?? careerAverages.avgRebounds,
    seasonHighs?.maxAssists ?? careerAverages.avgAssists,
    careerAverages.avgSteals,
    careerAverages.avgBlocks,
    1,
  );

  const stats = [
    { label: "득점", value: careerAverages.avgPoints, color: "#E31B23" },
    { label: "리바운드", value: careerAverages.avgRebounds, color: "#F4A261" },
    { label: "어시스트", value: careerAverages.avgAssists, color: "#1B3C87" },
    { label: "스틸", value: careerAverages.avgSteals, color: "#16A34A" },
    { label: "블록", value: careerAverages.avgBlocks, color: "#7C3AED" },
  ];

  return (
    <div className="rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="mb-1 flex items-center justify-between">
        <h2
          className="text-base font-bold uppercase tracking-wide text-[#111827]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          내 기록
        </h2>
        <span className="text-xs text-[#9CA3AF]">{careerAverages.gamesPlayed}경기 평균</span>
      </div>

      {seasonHighs && (seasonHighs.maxPoints > 0 || seasonHighs.maxRebounds > 0) && (
        <div className="mb-4 flex gap-3">
          {seasonHighs.maxPoints > 0 && (
            <div className="rounded-xl bg-[#E31B23]/10 px-3 py-1.5">
              <p className="text-xs text-[#9CA3AF]">최고 득점</p>
              <p className="text-lg font-black text-[#E31B23]">{seasonHighs.maxPoints}</p>
            </div>
          )}
          {seasonHighs.maxRebounds > 0 && (
            <div className="rounded-xl bg-[#F4A261]/10 px-3 py-1.5">
              <p className="text-xs text-[#9CA3AF]">최고 리바운드</p>
              <p className="text-lg font-black text-[#F4A261]">{seasonHighs.maxRebounds}</p>
            </div>
          )}
          {seasonHighs.maxAssists > 0 && (
            <div className="rounded-xl bg-[#1B3C87]/20 px-3 py-1.5">
              <p className="text-xs text-[#9CA3AF]">최고 어시스트</p>
              <p className="text-lg font-black text-[#1B3C87]">{seasonHighs.maxAssists}</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        {stats.map((s) => (
          <Bar key={s.label} label={s.label} value={s.value} max={maxVal} color={s.color} />
        ))}
      </div>
    </div>
  );
}
