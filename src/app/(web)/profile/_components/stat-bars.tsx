"use client";

import Link from "next/link";

/**
 * StatBars - 핵심 스탯 3칸 카드 (PPG / RPG / APG)
 *
 * 디자인 시안(bdr_1): 각 카드에 라벨(색상 태그) + 큰 숫자 표시
 * - 변동 표시(vs 지난 시즌)는 DB에 없으므로 숨김 처리
 * - 빈 상태일 때는 대회 참가 유도 UI
 */

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

/** 개별 스탯 카드 - PPG/RPG/APG 하나씩 */
function StatCard({
  label,
  value,
  labelColor,
  iconName,
}: {
  label: string;
  value: number;
  labelColor: string;
  iconName: string;
}) {
  return (
    <div
      className="p-5 rounded-xl border transition-all hover:opacity-90"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 상단: 라벨 + 아이콘 */}
      <div className="flex justify-between items-start mb-3">
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: labelColor }}
        >
          {label}
        </span>
        <span
          className="material-symbols-outlined opacity-30"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {iconName}
        </span>
      </div>
      {/* 큰 숫자 */}
      <div
        className="text-4xl font-bold"
        style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
      >
        {value.toFixed(1)}
      </div>
    </div>
  );
}

export function StatBars({ careerAverages, seasonHighs }: StatBarsProps) {
  // 빈 상태: 경기 기록이 없을 때
  if (!careerAverages) {
    return (
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <h2
          className="mb-3 text-base font-bold uppercase tracking-wide"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          내 기록
        </h2>
        <div className="flex flex-col items-center gap-3 py-6">
          <span className="material-symbols-outlined text-3xl" style={{ color: "var(--color-primary)" }}>
            trending_up
          </span>
          <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            아직 기록이 없어요
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            대회에 참가하면 스탯이 기록됩니다
          </p>
          <Link
            href="/tournaments"
            className="mt-1 rounded px-4 py-2 text-xs font-bold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            대회 둘러보기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* PPG: Points Per Game - 빨강 */}
      <StatCard
        label="PPG"
        value={careerAverages.avgPoints}
        labelColor="var(--color-primary)"
        iconName="sports_score"
      />
      {/* RPG: Rebounds Per Game - 네이비 */}
      <StatCard
        label="RPG"
        value={careerAverages.avgRebounds}
        labelColor="var(--color-accent)"
        iconName="height"
      />
      {/* APG: Assists Per Game - 블루 */}
      <StatCard
        label="APG"
        value={careerAverages.avgAssists}
        labelColor="var(--color-tertiary)"
        iconName="assistant"
      />
    </div>
  );
}
