/* ============================================================
 * RecentGamesTab — /users/[id] v2 "최근 경기" 탭
 *
 * 왜:
 * - v2 PlayerProfile.jsx L253~273 recent games 탭 재현. board 스타일 테이블.
 * - 기존 공용 RecentGames 는 `--color-*` 구식 변수 + 다른 레이아웃 — v2 토큰 재구성.
 *
 * 어떻게:
 * - board__head + board__row 클래스 (globals.css 제공) 재사용.
 * - 컬럼: 날짜 / 경기 / PTS / REB / AST / STL (5개 — opp/score 는 데이터 없음).
 *   · "상대팀" 은 픽업/3x3 구분이 모호 — 경기 제목으로 대체.
 *   · "W/L" 결과는 winner_team_id 가 경기 row 에 있지만 이번 범위에서는 미표시
 *     (복잡도 ↑ / D-P5 "최근 경기 기록" 단순 표시가 목적).
 * - 숫자는 ff-mono.
 * ============================================================ */

export interface RecentGameStat {
  id: string;
  scheduledAt: string | null;
  gameTitle: string | null;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
}

export interface RecentGamesTabProps {
  games: RecentGameStat[];
}

function fmtMonthDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}.${day}`;
}

export function RecentGamesTab({ games }: RecentGamesTabProps) {
  if (games.length === 0) {
    return (
      <div className="card" style={{ padding: "36px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--ink-mute)", fontSize: 13, margin: 0 }}>
          최근 경기 기록이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* 헤더 — 6열 grid */}
      <div
        className="board__head"
        style={{ gridTemplateColumns: "80px 1fr repeat(4, 60px)" }}
      >
        <div>날짜</div>
        <div style={{ textAlign: "left" }}>경기</div>
        <div>PTS</div>
        <div>REB</div>
        <div>AST</div>
        <div>STL</div>
      </div>
      {/* 행들 */}
      {games.map((g) => (
        <div
          key={g.id}
          className="board__row"
          style={{ gridTemplateColumns: "80px 1fr repeat(4, 60px)" }}
        >
          <div style={{ fontFamily: "var(--ff-mono)", color: "var(--ink-dim)" }}>
            {g.scheduledAt ? fmtMonthDay(g.scheduledAt) : "-"}
          </div>
          {/* 제목은 좌측 정렬 — board__row 기본은 center 이므로 덮어쓰기 */}
          <div style={{ justifyContent: "flex-start", textAlign: "left" }}>
            <span
              style={{
                fontSize: 13,
                color: "var(--ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
                width: "100%",
              }}
            >
              {g.gameTitle ?? "경기"}
            </span>
          </div>
          <div style={{ fontFamily: "var(--ff-mono)", fontWeight: 700, color: "var(--ink)" }}>
            {g.points}
          </div>
          <div style={{ fontFamily: "var(--ff-mono)" }}>{g.rebounds}</div>
          <div style={{ fontFamily: "var(--ff-mono)" }}>{g.assists}</div>
          <div style={{ fontFamily: "var(--ff-mono)" }}>{g.steals}</div>
        </div>
      ))}
    </div>
  );
}
