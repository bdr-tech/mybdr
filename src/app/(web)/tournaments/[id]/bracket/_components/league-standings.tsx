// 리그(풀리그) 순위표 컴포넌트
// round_robin / full_league / full_league_knockout 포맷에서 대진표 탭 상단에 표시
//
// 왜 순위 탭(StandingsTabContent)과 별도인가:
// - 순위 탭은 /public-standings API를 사용하고, 대진표 탭은 /public-bracket API를 사용한다.
// - 대진표 탭에서 다시 API 호출을 하지 않고 이미 받은 데이터를 재사용하기 위해 별도 컴포넌트로 분리.
// - 대진표 탭 내부에서는 "리그 순위표" 제목으로 조금 더 간결하게 표시한다.

"use client";

import Link from "next/link";

export type LeagueTeam = {
  id: string;
  teamId: string; // Team 테이블의 실제 id (팀 페이지 링크용)
  teamName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
};

type Props = {
  teams: LeagueTeam[];
  tournamentStatus?: string | null; // "completed"면 공동순위 판단 기준이 엄격해짐
};

export function LeagueStandings({ teams, tournamentStatus }: Props) {
  // 대회 상태에 따라 공동순위 기준이 다름 (순위 탭과 동일한 로직)
  // - 진행 중: 승률만 같으면 공동순위
  // - 종료: 승률+득실차+다득점 모두 같아야 공동순위 (사실상 확정 순위)
  const isCompleted = tournamentStatus === "completed";

  let rank = 1;
  const ranks = teams.map((t, i) => {
    if (i > 0) {
      const prev = teams[i - 1];
      if (isCompleted) {
        if (
          t.winRate === prev.winRate &&
          t.pointDifference === prev.pointDifference &&
          t.pointsFor === prev.pointsFor
        ) {
          // 공동순위 유지
        } else {
          rank = i + 1;
        }
      } else {
        if (t.winRate === prev.winRate) {
          // 공동순위 유지
        } else {
          rank = i + 1;
        }
      }
    }
    return rank;
  });

  // KBL 승률 표기: .XXX 형식 (전승만 1.000, 0경기는 "-")
  const formatWinRate = (t: LeagueTeam) => {
    if (t.gamesPlayed === 0) return "-";
    if (t.winRate === 1) return "1.000";
    return t.winRate.toFixed(3).replace(/^0/, "");
  };

  return (
    <section className="mb-8">
      <h3
        className="mb-4 text-lg font-bold sm:text-xl"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        리그 순위표
      </h3>
      <div
        className="overflow-x-auto rounded-lg border"
        style={{ borderColor: "var(--color-border)" }}
      >
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--color-surface)" }}>
              <th
                className="px-2 py-2.5 text-left text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                #
              </th>
              <th
                className="px-2 py-2.5 text-left text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                팀
              </th>
              <th
                className="px-2 py-2.5 text-center text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                경기
              </th>
              <th
                className="px-2 py-2.5 text-center text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                승
              </th>
              <th
                className="px-2 py-2.5 text-center text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                패
              </th>
              <th
                className="px-2 py-2.5 text-center text-xs font-medium sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                승률
              </th>
              <th
                className="hidden px-2 py-2.5 text-center text-xs font-medium sm:table-cell sm:px-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                득실차
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => {
              // 상위 3팀은 왼쪽에 primary 색상의 강조 막대 표시
              const isTop3 = ranks[i] <= 3;
              return (
                <tr
                  key={t.id}
                  style={{
                    borderTop: "1px solid var(--color-border)",
                    borderLeft: isTop3
                      ? "3px solid var(--color-primary)"
                      : "3px solid transparent",
                  }}
                >
                  <td
                    className="px-2 py-2.5 text-sm font-bold sm:px-3"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {ranks[i]}
                  </td>
                  <td className="px-2 py-2.5 font-medium sm:px-3">
                    <Link href={`/teams/${t.teamId}`} className="hover:underline">
                      {t.teamName}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-center sm:px-3">{t.gamesPlayed}</td>
                  <td className="px-2 py-2.5 text-center sm:px-3">{t.wins}</td>
                  <td className="px-2 py-2.5 text-center sm:px-3">{t.losses}</td>
                  <td className="px-2 py-2.5 text-center font-mono sm:px-3">
                    {formatWinRate(t)}
                  </td>
                  <td
                    className="hidden px-2 py-2.5 text-center sm:table-cell sm:px-3"
                    style={{
                      color:
                        t.pointDifference > 0
                          ? "var(--color-primary)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {t.pointDifference > 0 ? "+" : ""}
                    {t.pointDifference}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
