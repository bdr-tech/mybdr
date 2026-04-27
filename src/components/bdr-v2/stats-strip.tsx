/* ============================================================
 * StatsStrip — BDR v2 4열 통계 카드 스트립
 *
 * 왜 이 컴포넌트가 있는가:
 * v2 Home.jsx 시안에서 Promo 배너 바로 아래에 위치하는 4열 통계 행.
 * "전체 회원 / 지금 접속 / 오늘의 글 / 진행중 대회" 형태로 간결히
 * 숫자를 강조하는 섹션을 props 기반 재사용 컴포넌트로 추출.
 *
 * globals.css의 `.card` 클래스(라이트 흰 카드/다크 brutalist 박스)를
 * 그대로 사용. 디스플레이 폰트(var(--ff-display))로 숫자를 크게 표시.
 * 서버 컴포넌트 — 동적 인터랙션 없음.
 * ============================================================ */

/** 한 개의 통계 항목 */
export interface StatItem {
  /** 상단 라벨 (대문자화되어 렌더) */
  label: string;
  /** 표시할 값 — 숫자 또는 문자열(예: "-" placeholder) */
  value: string | number;
}

export interface StatsStripProps {
  /** 스트립에 표시할 통계 항목 배열 (보통 4개) */
  items: StatItem[];
}

/**
 * 4열(모바일은 responsive.css에서 2열로 줄어듦) 통계 카드 스트립.
 * 항목 개수에 관계없이 균등 분할 (repeat(N, 1fr)).
 */
export function StatsStrip({ items }: StatsStripProps) {
  return (
    // 균등 그리드 — items 개수에 맞춰 자동 분할
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 12,
        marginBottom: 24,
      }}
    >
      {items.map((item) => (
        // .card = v2 공통 카드 스타일 (라이트: 흰 + radius / 다크: brutalist)
        <div key={item.label} className="card" style={{ padding: "16px 18px" }}>
          {/* 상단 eyebrow 라벨 — 작고 대문자, dim 톤 */}
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-dim)",
              fontWeight: 700,
            }}
          >
            {item.label}
          </div>
          {/* 큰 숫자 — 디스플레이 폰트로 28px */}
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: 28,
              fontWeight: 800,
              marginTop: 4,
              letterSpacing: "-0.01em",
            }}
          >
            {/* 숫자는 자동으로 천단위 구분자 포맷, 문자열은 그대로 */}
            {typeof item.value === "number"
              ? item.value.toLocaleString()
              : item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
