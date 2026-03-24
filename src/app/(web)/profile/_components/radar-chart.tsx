"use client";

/**
 * RadarChart - SVG polygon 기반 레이더 차트 컴포넌트
 *
 * 라이브러리 없이 SVG로 직접 구현한다.
 * - 내 프로필: 6각형(hexagon) - 슈팅/스피드/패스/수비/피지컬/리바운드
 * - 타인 프로필: 5각형(pentagon) - SHOOTING/PACE/PASSING/DEFENSE/DRIBBLE
 *
 * props.values는 0~100 범위의 정규화된 값을 받는다.
 */

interface RadarChartProps {
  /** 각 축의 라벨 (예: ["슈팅", "스피드", "패스", "수비", "피지컬", "리바운드"]) */
  labels: string[];
  /** 각 축의 값 (0~100) */
  values: number[];
  /** 차트 크기 (px, 기본 300) */
  size?: number;
  /** 격자 단계 수 (기본 4) */
  gridSteps?: number;
}

export function RadarChart({
  labels,
  values,
  size = 300,
  gridSteps = 4,
}: RadarChartProps) {
  const sides = labels.length;
  // SVG 중심점과 반지름
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36; // 전체 크기 대비 36% 반지름 (라벨 공간 확보)

  /**
   * 다각형의 꼭짓점 좌표를 계산하는 함수
   * - 12시 방향(상단)을 0번 축으로 시작
   * - 시계 방향으로 진행
   * @param r 반지름
   */
  const getPoint = (index: number, r: number): [number, number] => {
    // 각도: -90도(12시 방향)에서 시작, 시계 방향으로 360/sides 간격
    const angle = (2 * Math.PI * index) / sides - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  /** 다각형 포인트 문자열 생성 (SVG polygon의 points 속성용) */
  const polygonPoints = (r: number): string => {
    return Array.from({ length: sides }, (_, i) => getPoint(i, r).join(",")).join(" ");
  };

  /** 데이터 영역의 포인트 문자열 - 각 축의 값에 비례하는 반지름 사용 */
  const dataPoints = values
    .map((v, i) => {
      const clampedValue = Math.min(Math.max(v, 0), 100); // 0~100 클램핑
      const r = (clampedValue / 100) * radius;
      return getPoint(i, r).join(",");
    })
    .join(" ");

  /** 라벨 위치: 다각형 꼭짓점 바깥 (반지름의 120%) */
  const labelPositions = labels.map((label, i) => {
    const [x, y] = getPoint(i, radius * 1.25);
    return { label, x, y };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      className="max-w-full"
    >
      {/* 배경 격자: gridSteps 단계의 동심 다각형 */}
      {Array.from({ length: gridSteps }, (_, step) => {
        const stepRadius = (radius * (step + 1)) / gridSteps;
        return (
          <polygon
            key={`grid-${step}`}
            points={polygonPoints(stepRadius)}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        );
      })}

      {/* 축 선: 중심에서 각 꼭짓점까지의 직선 */}
      {Array.from({ length: sides }, (_, i) => {
        const [x, y] = getPoint(i, radius);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--color-border)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* 데이터 영역: 빨간 반투명 다각형 + 빨강 테두리 */}
      <polygon
        points={dataPoints}
        fill="rgba(227, 27, 35, 0.15)"
        stroke="var(--color-primary)"
        strokeWidth="2"
      />

      {/* 데이터 꼭짓점: 빨간 점 */}
      {values.map((v, i) => {
        const clampedValue = Math.min(Math.max(v, 0), 100);
        const r = (clampedValue / 100) * radius;
        const [x, y] = getPoint(i, r);
        return (
          <circle
            key={`dot-${i}`}
            cx={x}
            cy={y}
            r="3"
            fill="var(--color-primary)"
          />
        );
      })}

      {/* 축 라벨: 각 꼭짓점 바깥에 텍스트 표시 */}
      {labelPositions.map(({ label, x, y }, i) => (
        <text
          key={`label-${i}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-text-muted)"
          fontSize="11"
          fontWeight="600"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
