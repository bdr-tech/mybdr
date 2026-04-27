/**
 * 랭킹 페이지 로딩 fallback (v2 톤)
 *
 * 이유: 시안의 .page / .eyebrow / .theme-switch 톤에 맞춰
 *      가볍게 헤더 자리만 잡아 깜빡임을 줄인다.
 *      실제 데이터 로딩 스피너는 RankingsContent 내부의
 *      BoardSkeleton이 담당.
 */
export default function RankingsLoading() {
  return (
    <div className="page">
      {/* 헤더 자리 — 시안의 eyebrow + h1 + 부제 톤 유지 */}
      <div style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ opacity: 0.4 }}>
          랭킹 · LEADERBOARD
        </div>
        <div
          style={{
            height: 32,
            width: 220,
            background: "var(--bg-alt)",
            borderRadius: 4,
            marginTop: 8,
          }}
        />
        <div
          style={{
            height: 14,
            width: 280,
            background: "var(--bg-alt)",
            borderRadius: 4,
            marginTop: 8,
            opacity: 0.6,
          }}
        />
      </div>

      {/* 보드 자리 8행 */}
      <div className="board">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="board__row"
            style={{
              gridTemplateColumns: "56px 1fr 80px",
              opacity: 0.4,
            }}
          >
            <div style={{ height: 14, background: "var(--bg-alt)", borderRadius: 2 }} />
            <div style={{ height: 14, background: "var(--bg-alt)", borderRadius: 2 }} />
            <div style={{ height: 14, background: "var(--bg-alt)", borderRadius: 2 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
