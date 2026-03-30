/**
 * UserRecentGames - 타인 프로필 최근 경기 기록 테이블
 *
 * 디자인 시안(bdr_2): 테이블 형태
 * - 컬럼: 경기 날짜 / 경기 유형 / 팀/상대 / 결과 / 개인 스탯
 * - 현재 DB에서 가져올 수 있는 데이터: game title, scheduled_at, 개인 스탯(points/assists/rebounds/steals)
 * - 경기 유형, 팀/상대, 결과(WIN/LOSE)는 현재 데이터 구조상 불완전하므로 간략하게 표시
 */

interface RecentGameRecord {
  gameTitle: string | null;
  scheduledAt: string | null;
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
}

interface UserRecentGamesProps {
  games: RecentGameRecord[];
}

export function UserRecentGames({ games }: UserRecentGamesProps) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 헤더 */}
      <div
        className="p-5 flex items-center justify-between border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h3
          className="font-bold text-lg"
          style={{ color: "var(--color-text-primary)" }}
        >
          최근 경기 기록
        </h3>
      </div>

      {games.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            {/* 테이블 헤더 */}
            <thead>
              <tr style={{ backgroundColor: "var(--color-card)" }}>
                <th
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  경기 날짜
                </th>
                <th
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  경기
                </th>
                <th
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-right"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  개인 스탯
                </th>
              </tr>
            </thead>
            <tbody>
              {games.map((game, i) => (
                <tr
                  key={i}
                  className="transition-colors hover:opacity-80"
                  style={{
                    borderBottom:
                      i < games.length - 1
                        ? "1px solid var(--color-border)"
                        : "none",
                  }}
                >
                  {/* 날짜 */}
                  <td className="px-5 py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {game.scheduledAt
                      ? new Date(game.scheduledAt).toLocaleDateString("ko-KR")
                      : "-"}
                  </td>
                  {/* 경기명 */}
                  <td className="px-5 py-4 text-sm" style={{ color: "var(--color-text-primary)" }}>
                    {game.gameTitle ?? "경기"}
                  </td>
                  {/* 개인 스탯 */}
                  <td
                    className="px-5 py-4 text-sm text-right"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <span style={{ color: "var(--color-primary)" }}>{game.points}</span>
                    <span style={{ color: "var(--color-text-muted)" }}> PTS / </span>
                    <span style={{ color: "var(--color-text-primary)" }}>{game.assists}</span>
                    <span style={{ color: "var(--color-text-muted)" }}> AST / </span>
                    <span style={{ color: "var(--color-text-primary)" }}>{game.rebounds}</span>
                    <span style={{ color: "var(--color-text-muted)" }}> REB</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* 빈 상태 */
        <div className="p-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            경기 기록이 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
