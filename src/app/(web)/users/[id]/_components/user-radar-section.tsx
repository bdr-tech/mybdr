"use client";

import { RadarChart } from "@/app/(web)/profile/_components/radar-chart";

/**
 * UserRadarSection - 타인 프로필 역량 레이더 차트
 *
 * 디자인 시안(bdr_2): 5각형(pentagon) 레이더 차트
 * 축: SHOOTING / PACE / PASSING / DEFENSE / DRIBBLE
 * + 종합 스코어 표시
 */

interface UserRadarSectionProps {
  avgPoints: number;
  avgRebounds: number;
  avgAssists: number;
  avgSteals: number;
  avgBlocks: number;
}

/** 스탯을 0~100으로 정규화 */
function normalize(value: number, maxBase: number): number {
  return Math.min(Math.round((value / maxBase) * 100), 100);
}

export function UserRadarSection({
  avgPoints,
  avgRebounds,
  avgAssists,
  avgSteals,
  avgBlocks,
}: UserRadarSectionProps) {
  /**
   * 5축 매핑 (영문 라벨, 시안대로)
   * SHOOTING(points/30) / PACE(steals/5) / PASSING(assists/15)
   * / DEFENSE(blocks/5) / DRIBBLE(assists/15 재활용)
   */
  const abilities = [
    { label: "SHOOTING", value: normalize(avgPoints, 30) },
    { label: "PACE", value: normalize(avgSteals, 5) },
    { label: "PASSING", value: normalize(avgAssists, 15) },
    { label: "DEFENSE", value: normalize(avgBlocks, 5) },
    { label: "DRIBBLE", value: normalize(avgAssists, 15) },
  ];

  const overallScore = Math.round(
    abilities.reduce((sum, a) => sum + a.value, 0) / abilities.length
  );

  return (
    <div
      className="rounded-lg border p-5"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 헤더 — 페이지 h1(닉네임) 바로 아래 섹션이므로 h2 */}
      <div className="flex justify-between items-center mb-6">
        <h2
          className="font-bold text-lg"
          style={{ color: "var(--color-text-primary)" }}
        >
          역량 레이더
        </h2>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          종합 스코어 {overallScore}
        </span>
      </div>

      {/* 레이더 차트 (정사각형 비율) */}
      <div className="aspect-square relative flex items-center justify-center">
        <RadarChart
          labels={abilities.map((a) => a.label)}
          values={abilities.map((a) => a.value)}
          size={300}
          gridSteps={3}
        />
      </div>
    </div>
  );
}
