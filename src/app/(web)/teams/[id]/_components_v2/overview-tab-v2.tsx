/**
 * OverviewTabV2
 * ─────────────────────────────────────────────────────────
 * v2 시안 `TeamDetail.jsx` tab === 'overview' 재현.
 *
 * 이유(왜): 기존 OverviewTab은 최근 경기 위젯 + 주요 스쿼드 카드까지
 * 모두 한 탭에 몰아넣었다. 시안은 이걸 단순화해서 "팀 소개 카드" +
 * "팀 정보 6행 key-value 카드" 두 덩어리로만 구성한다.
 * 최근 경기는 '최근 경기' 탭으로, 스쿼드는 '로스터' 탭으로 분리됨.
 *
 * 방법(어떻게):
 * - `.card` 2개 세로 배치 (padding 20px 22px)
 * - 첫 카드: `<h2>팀 소개</h2>` + `<p>` description (없으면 placeholder)
 * - 둘째 카드: 120px/1fr grid 6행 (창단 / 홈 코트 / 연습일 / 팀 레벨 / 레이팅 / 게스트 모집)
 * - 라벨 색: `var(--ink-dim)` / 값 색: 기본 `var(--ink)`
 *
 * DB 매핑 / 미지원:
 * - 창단      → `teams.founded_year` (없으면 created_at 연도)
 * - 홈 코트   → `teams.city + district` (시/구)
 * - 연습일    → DB 없음 → "준비 중"
 * - 팀 레벨   → DB 없음 → "준비 중"
 * - 레이팅    → wins 대체 + "#N위" (전체 wins desc 기준)
 * - 게스트 모집 → DB 없음 → "준비 중" (badge 는 숨김)
 */

type Props = {
  description: string | null;
  foundedYear: number | null;
  homeCourt: string;
  rating: number;
  teamRank: number | null; // wins desc 기준 순위 (1-based), 없으면 null
};

export function OverviewTabV2({
  description,
  foundedYear,
  homeCourt,
  rating,
  teamRank,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* 팀 소개 카드 */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700 }}>
          팀 소개
        </h2>
        {description ? (
          <p
            style={{
              margin: 0,
              color: "var(--ink-soft)",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {description}
          </p>
        ) : (
          // 이유: description이 null이어도 카드 자체는 유지하여
          // 시안의 "두 덩어리" 레이아웃이 무너지지 않게 한다.
          <p style={{ margin: 0, color: "var(--ink-mute)", lineHeight: 1.7 }}>
            아직 소개가 작성되지 않았습니다.
          </p>
        )}
      </div>

      {/* 팀 정보 key-value 카드 */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700 }}>
          팀 정보
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            rowGap: 10,
            fontSize: 14,
          }}
        >
          <KvLabel>창단</KvLabel>
          <KvValue>{foundedYear ? `${foundedYear}년` : "—"}</KvValue>

          <KvLabel>홈 코트</KvLabel>
          <KvValue>{homeCourt || "—"}</KvValue>

          {/* 연습일 — DB 필드 없음 (teams.practice_days 추가 시 교체) */}
          <KvLabel>연습일</KvLabel>
          <KvValue muted>준비 중</KvValue>

          {/* 팀 레벨 — DB 필드 없음 */}
          <KvLabel>팀 레벨</KvLabel>
          <KvValue muted>준비 중</KvValue>

          <KvLabel>레이팅</KvLabel>
          <KvValue>
            <b>{rating}</b>
            {teamRank != null && (
              <span style={{ color: "var(--ink-mute)", marginLeft: 6 }}>
                · 전체 {teamRank}위
              </span>
            )}
          </KvValue>

          {/* 게스트 모집 — DB 필드 없음 (teams.recruiting 추가 시 badge 복원) */}
          <KvLabel>게스트 모집</KvLabel>
          <KvValue muted>준비 중</KvValue>
        </div>
      </div>
    </div>
  );
}

// 라벨 셀 — 이유: 반복 제거 + 스타일 통일
function KvLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ color: "var(--ink-dim)" }}>{children}</div>;
}

// 값 셀 — muted 옵션으로 "준비 중" placeholder 처리
function KvValue({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div style={{ color: muted ? "var(--ink-mute)" : "var(--ink)" }}>
      {children}
    </div>
  );
}
