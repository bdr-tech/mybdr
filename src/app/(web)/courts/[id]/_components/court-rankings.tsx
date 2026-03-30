"use client";

/**
 * 코트별 체크인 랭킹 TOP 10
 *
 * 해당 코트에서 가장 많이 체크인한 유저 TOP 10을 보여준다.
 * SWR로 데이터를 가져오며, 60초 갱신.
 */

import useSWR from "swr";

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RankingData {
  court_name: string;
  rankings: {
    rank: number;
    user_id: string;
    nickname: string;
    checkin_count: number;
    level: number;
    title: string;
    emoji: string;
  }[];
}

interface CourtRankingsProps {
  courtId: string;
}

export function CourtRankings({ courtId }: CourtRankingsProps) {
  const { data } = useSWR<RankingData>(
    `/api/web/courts/${courtId}/rankings`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const rankings = data?.rankings ?? [];

  // 데이터가 없으면 렌더링하지 않음
  if (rankings.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 mb-4"
      style={{
        backgroundColor: "var(--color-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <h2
        className="text-base font-bold mb-3 flex items-center gap-1"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span
          className="material-symbols-outlined text-base"
          style={{ color: "var(--color-accent)" }}
        >
          leaderboard
        </span>
        체크인 랭킹 TOP {rankings.length}
      </h2>

      <div className="space-y-1.5">
        {rankings.map((r) => (
          <div
            key={r.user_id}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            style={{
              backgroundColor: r.rank <= 3
                ? "color-mix(in srgb, var(--color-accent) 8%, transparent)"
                : "var(--color-surface)",
            }}
          >
            {/* 순위 */}
            <span
              className="w-6 text-center text-sm font-bold shrink-0"
              style={{
                color: r.rank === 1
                  ? "var(--color-accent)"
                  : r.rank <= 3
                  ? "var(--color-text-primary)"
                  : "var(--color-text-muted)",
              }}
            >
              {r.rank <= 3 ? (
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  {r.rank === 1 ? "emoji_events" : r.rank === 2 ? "workspace_premium" : "military_tech"}
                </span>
              ) : (
                r.rank
              )}
            </span>

            {/* 유저 정보 */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {r.nickname}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {r.emoji} Lv.{r.level} {r.title}
              </p>
            </div>

            {/* 체크인 횟수 */}
            <span
              className="text-sm font-bold shrink-0"
              style={{ color: "var(--color-primary)" }}
            >
              {r.checkin_count}회
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
