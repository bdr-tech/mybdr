"use client";

import type { ConnectorPath } from "@/lib/tournaments/bracket-builder";

type BracketConnectorProps = {
  paths: ConnectorPath[];
  width: number;
  height: number;
};

/**
 * SVG 연결선 레이어
 *
 * 대진표 카드 위에 절대 위치로 겹쳐 표시된다.
 * 각 연결선은 계단형(step) 경로:
 *   현재 카드 우측 → 수평 중간 → 수직 이동 → 수평으로 다음 카드 좌측
 */
export function BracketConnector({
  paths,
  width,
  height,
}: BracketConnectorProps) {
  if (paths.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ overflow: "visible" }}
    >
      {paths.map((path) => (
        <path
          key={path.id}
          d={path.d}
          stroke={path.isActive ? "rgba(244,162,97,0.4)" : "var(--color-text-muted)"}
          strokeWidth={1.5}
          fill="none"
        />
      ))}
    </svg>
  );
}
