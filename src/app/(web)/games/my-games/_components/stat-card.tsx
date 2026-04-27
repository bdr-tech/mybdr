/* ============================================================
 * StatCard — MyGames 상단 4열 통계 카드
 *
 * 왜: v2 MyGames 시안 상단 "예정된 경기 / 승인 대기 / 대기자 / 이번 달 결제"
 *     4카드 그리드. StatsStrip 은 2줄 구조(label + value)이지만 MyGames
 *     시안은 3줄 구조(label + value + sub). 별도 컴포넌트로 분리.
 *
 * v2 토큰: .card (globals.css) + ff-display(숫자) + ink-dim(라벨) +
 *         ink-mute(서브). 하드코딩 색상 금지 원칙 준수.
 *
 * 서버 컴포넌트 — 동적 인터랙션 없음.
 * ============================================================ */

export interface StatCardItem {
  /** 상단 eyebrow 라벨 (예: "예정된 경기") */
  label: string;
  /** 강조 표시할 값 (숫자 또는 "₩93K" 같은 포맷 문자열) */
  value: string | number;
  /** 하단 보조 설명 (예: "확정" / "호스트 응답 대기") */
  sub: string;
}

export function StatCard({ label, value, sub }: StatCardItem) {
  return (
    // v2 공통 .card — 라이트: 흰 배경 + radius / 다크: brutalist 0px radius
    <div className="card" style={{ padding: "16px 18px" }}>
      {/* 상단 라벨 — 작고 대문자, dim 톤 */}
      <div
        style={{
          fontSize: 11,
          color: "var(--ink-dim)",
          fontWeight: 700,
          letterSpacing: ".04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      {/* 큰 숫자 — 디스플레이 폰트 30px 900 */}
      <div
        style={{
          fontFamily: "var(--ff-display)",
          fontWeight: 900,
          fontSize: 30,
          letterSpacing: "-0.01em",
          marginTop: 4,
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {/* 보조 설명 — 더 작고 무테 */}
      <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}
