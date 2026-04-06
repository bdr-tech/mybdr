import Link from "next/link";

/**
 * RecentGamesSection - 최근 경기 전적
 *
 * 디자인 시안(bdr_1): 각 행에 날짜 + 경기 제목 + chevron 아이콘
 * - 현재 API에는 WIN/LOSS, 스코어, 상대팀, 개인 스탯이 없으므로
 *   사용 가능한 데이터(title, scheduled_at)만 표시
 */

interface Game {
  id: string;
  title: string | null;
  scheduled_at: string | null;
  status: number;
}

export function RecentGamesSection({ games }: { games: Game[] }) {
  const items = games.slice(0, 5); // 최근 5경기

  return (
    <div
      className="rounded-md border overflow-hidden"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 섹션 헤더 */}
      <div
        className="px-5 py-4 flex justify-between items-center border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h3
          className="font-bold text-lg"
          style={{ color: "var(--color-text-primary)" }}
        >
          최근 경기 전적
        </h3>
        <Link
          href="/games/my-games"
          className="text-xs transition-all hover:opacity-80"
          style={{ color: "var(--color-text-muted)" }}
        >
          전체보기
        </Link>
      </div>

      {/* 경기 목록 */}
      {items.length > 0 ? (
        <div>
          {items.map((g, index) => {
            // 날짜 포매팅
            const dateStr = g.scheduled_at
              ? new Date(g.scheduled_at).toLocaleDateString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                })
              : "-";

            return (
              <Link
                key={g.id}
                href={`/games/${g.id.slice(0, 8)}`}
                className="px-5 py-3.5 flex items-center gap-4 transition-colors hover:opacity-80"
                style={{
                  // 행 사이 구분선 (마지막 행 제외)
                  borderBottom: index < items.length - 1
                    ? "1px solid var(--color-border)"
                    : "none",
                }}
              >
                {/* 날짜 */}
                <div className="w-12 text-center flex-shrink-0">
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {dateStr}
                  </div>
                </div>

                {/* 경기 제목 */}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium text-sm truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {g.title ?? "경기"}
                  </div>
                </div>

                {/* 화살표 아이콘 */}
                <span
                  className="material-symbols-outlined text-sm flex-shrink-0"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  chevron_right
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        /* 빈 상태 */
        <div className="px-5 py-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            참여한 경기가 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
