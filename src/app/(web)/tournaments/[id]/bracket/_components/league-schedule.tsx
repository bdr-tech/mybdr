// 리그(풀리그) 경기 일정 목록 컴포넌트
// 날짜별로 경기를 그룹핑해서 한눈에 일정과 결과를 볼 수 있게 표시
//
// 왜 날짜별 그룹핑인가:
// - 풀리그는 라운드 개념이 없고(모든 팀이 모든 팀과 한 번씩) 기간이 길다.
// - 사용자 입장에서 "오늘 경기가 뭐 있지?"를 찾기 쉽게 날짜로 묶는다.

"use client";

import Link from "next/link";
import { formatShortTime, formatGroupDate } from "@/lib/utils/format-date";

export type LeagueMatch = {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
  scheduledAt: string | null;
  courtNumber: string | null;
};

type Props = { matches: LeagueMatch[] };

export function LeagueSchedule({ matches }: Props) {
  // 날짜별 그룹 (Map으로 삽입 순서 유지 — matches가 이미 시간순 정렬되어 있음)
  const groups = new Map<string, LeagueMatch[]>();
  for (const m of matches) {
    const key = formatGroupDate(m.scheduledAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  // 상단 통계: "N/M 경기 완료"
  const completedCount = matches.filter((m) => m.status === "completed").length;
  const totalCount = matches.length;

  if (totalCount === 0) {
    return (
      <section>
        <h3
          className="mb-4 text-lg font-bold sm:text-xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          경기 일정
        </h3>
        <div
          className="rounded-lg border p-8 text-center text-sm"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          아직 생성된 경기가 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* 헤더: 제목 + 진행률 표시 */}
      <div className="mb-4 flex items-center justify-between">
        <h3
          className="text-lg font-bold sm:text-xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          경기 일정
        </h3>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {completedCount}/{totalCount} 경기 완료
        </span>
      </div>

      <div className="space-y-4">
        {Array.from(groups.entries()).map(([date, dayMatches]) => (
          <div key={date}>
            {/* 날짜 헤더: 아이콘 + 날짜 + 경기 수 */}
            <div className="mb-2 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-base"
                style={{ color: "var(--color-primary)" }}
              >
                calendar_today
              </span>
              <span className="text-sm font-bold">{date}</span>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {dayMatches.length}경기
              </span>
            </div>

            {/* 해당 날짜의 경기 카드들 */}
            <div className="space-y-2">
              {dayMatches.map((match) => {
                const isCompleted = match.status === "completed";
                // live / in_progress 둘 다 실시간 경기로 간주
                const isLive =
                  match.status === "live" || match.status === "in_progress";
                const homeWins =
                  isCompleted && (match.homeScore ?? 0) > (match.awayScore ?? 0);
                const awayWins =
                  isCompleted && (match.awayScore ?? 0) > (match.homeScore ?? 0);

                return (
                  <Link
                    key={match.id}
                    href={`/live/${match.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:opacity-80"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-card)",
                    }}
                  >
                    {/* 시간 */}
                    <div
                      className="w-12 flex-shrink-0 text-xs font-bold"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {formatShortTime(match.scheduledAt)}
                    </div>

                    {/* 홈팀 (패배 시 흐리게) */}
                    <div
                      className="flex-1 text-right text-sm font-medium"
                      style={{ opacity: awayWins ? 0.5 : 1 }}
                    >
                      {match.homeTeamName ?? "TBD"}
                    </div>

                    {/* 스코어 박스 */}
                    <div
                      className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold"
                      style={{ backgroundColor: "var(--color-elevated)" }}
                    >
                      {isCompleted || isLive ? (
                        <span>
                          <span
                            style={{
                              color: homeWins
                                ? "var(--color-primary)"
                                : "var(--color-text-secondary)",
                            }}
                          >
                            {match.homeScore ?? 0}
                          </span>
                          <span style={{ color: "var(--color-text-tertiary)" }}> : </span>
                          <span
                            style={{
                              color: awayWins
                                ? "var(--color-primary)"
                                : "var(--color-text-secondary)",
                            }}
                          >
                            {match.awayScore ?? 0}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>vs</span>
                      )}
                    </div>

                    {/* 어웨이팀 (패배 시 흐리게) */}
                    <div
                      className="flex-1 text-left text-sm font-medium"
                      style={{ opacity: homeWins ? 0.5 : 1 }}
                    >
                      {match.awayTeamName ?? "TBD"}
                    </div>

                    {/* LIVE 뱃지 (실시간 경기일 때) */}
                    {isLive && (
                      <span
                        className="flex-shrink-0 animate-pulse rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: "rgba(227,27,35,0.15)",
                          color: "var(--color-primary)",
                        }}
                      >
                        LIVE
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
