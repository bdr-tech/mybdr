"use client";

import { RadarChart } from "./radar-chart";

/**
 * AbilitySection - 능력치 분석 섹션 (2열: 헥사곤 차트 + 바 차트 6개)
 *
 * 디자인 시안(bdr_1): 좌측 헥사곤 레이더 차트 + 종합 점수, 우측 바 차트 6개
 * - 5개 스탯(points/rebounds/assists/steals/blocks)을 6축에 매핑
 * - "피지컬"과 "리바운드"가 같은 rebounds 값을 공유 (DB 한계)
 * - 각 스탯을 0~100 스케일로 정규화 (max 30 기준)
 */

interface AbilitySectionProps {
  avgPoints: number;
  avgRebounds: number;
  avgAssists: number;
  avgSteals: number;
  avgBlocks: number;
}

/** 스탯을 0~100으로 정규화. 각 스탯별 최대 기준값이 다름 */
function normalize(value: number, maxBase: number): number {
  return Math.min(Math.round((value / maxBase) * 100), 100);
}

/** 프로그레스 바 컴포넌트 */
function AbilityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
        <span style={{ color: "var(--color-primary)" }}>{value}</span>
      </div>
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-surface-high)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            backgroundColor: "var(--color-primary)",
          }}
        />
      </div>
    </div>
  );
}

export function AbilitySection({
  avgPoints,
  avgRebounds,
  avgAssists,
  avgSteals,
  avgBlocks,
}: AbilitySectionProps) {
  /**
   * 6축 매핑 + 정규화
   * - 슈팅(points): 최대 30점 기준
   * - 스피드(steals): 최대 5 기준 (스틸 = 발빠름의 지표)
   * - 패스(assists): 최대 15 기준
   * - 수비(blocks): 최대 5 기준
   * - 피지컬(rebounds): 최대 15 기준
   * - 리바운드(rebounds): 최대 15 기준 (피지컬과 동일 데이터)
   */
  const abilities = [
    { label: "슈팅", value: normalize(avgPoints, 30) },
    { label: "스피드", value: normalize(avgSteals, 5) },
    { label: "패스", value: normalize(avgAssists, 15) },
    { label: "수비", value: normalize(avgBlocks, 5) },
    { label: "피지컬", value: normalize(avgRebounds, 15) },
    { label: "리바운드", value: normalize(avgRebounds, 15) },
  ];

  // 종합 점수: 6축 평균
  const overallScore = Math.round(
    abilities.reduce((sum, a) => sum + a.value, 0) / abilities.length
  );

  const chartLabels = abilities.map((a) => a.label);
  const chartValues = abilities.map((a) => a.value);

  return (
    <div
      className="rounded-md border p-5"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 섹션 헤더 */}
      <div className="flex justify-between items-center mb-5">
        <h3
          className="font-bold text-lg"
          style={{ color: "var(--color-text-primary)" }}
        >
          능력치 분석
        </h3>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          종합 점수: {overallScore}
        </span>
      </div>

      {/* 2열 레이아웃: 차트 + 바 */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* 좌측: 헥사곤 레이더 차트 */}
        <div className="w-48 h-48 md:w-56 md:h-56 flex-shrink-0">
          <RadarChart labels={chartLabels} values={chartValues} size={300} />
        </div>

        {/* 우측: 능력치별 프로그레스 바 */}
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3 w-full">
          {abilities.map((a) => (
            <AbilityBar key={a.label} label={a.label} value={a.value} />
          ))}
        </div>
      </div>
    </div>
  );
}
