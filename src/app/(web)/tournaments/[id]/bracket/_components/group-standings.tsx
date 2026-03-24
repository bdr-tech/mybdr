// 조별리그 순위표 컴포넌트
// Group A/B/C/D 탭 + 팀별 순위 테이블
// 시안: bdr_3(라이트) 참조 - 빨간 세로 막대 + 그룹 탭 + ADVANCED 배지

"use client";

import { useState, useMemo } from "react";

// DB에서 가져온 팀 데이터 타입
export type GroupTeam = {
  id: string;
  teamName: string;
  groupName: string | null;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
};

type GroupStandingsProps = {
  teams: GroupTeam[];
  advancedCount?: number; // 조 통과 팀 수 (기본 2)
};

export function GroupStandings({
  teams,
  advancedCount = 2,
}: GroupStandingsProps) {
  // 그룹별로 팀을 분류
  const groups = useMemo(() => {
    const map = new Map<string, GroupTeam[]>();
    for (const t of teams) {
      const key = t.groupName ?? "미배정";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    // 각 그룹 내에서 승점(승*3 + 무*1) 내림차순 정렬
    for (const [, groupTeams] of map) {
      groupTeams.sort((a, b) => {
        const ptsA = a.wins * 3 + a.draws;
        const ptsB = b.wins * 3 + b.draws;
        if (ptsB !== ptsA) return ptsB - ptsA;
        return b.pointDifference - a.pointDifference;
      });
    }
    // 그룹명 알파벳 순 정렬
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [teams]);

  const groupNames = Array.from(groups.keys());
  const [activeGroup, setActiveGroup] = useState(groupNames[0] ?? "");

  // 그룹 데이터가 없으면 표시하지 않음
  if (groupNames.length === 0) return null;

  const activeTeams = groups.get(activeGroup) ?? [];

  return (
    <section className="mb-12">
      {/* 섹션 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          {/* 빨간 세로 막대 */}
          <span
            className="w-1.5 h-6 rounded-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          />
          조별리그 순위표 (Group Stage)
        </h3>

        {/* 그룹 탭 */}
        <div
          className="flex p-1 rounded"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          {groupNames.map((name) => (
            <button
              key={name}
              onClick={() => setActiveGroup(name)}
              className="px-4 py-1.5 text-xs font-bold transition-all rounded"
              style={{
                backgroundColor:
                  activeGroup === name
                    ? "var(--color-card)"
                    : "transparent",
                color:
                  activeGroup === name
                    ? "var(--color-text-primary)"
                    : "var(--color-text-muted)",
                boxShadow:
                  activeGroup === name ? "var(--shadow-card)" : "none",
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 순위 테이블 */}
      <div
        className="rounded overflow-hidden"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="text-xs font-bold uppercase tracking-widest"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-muted)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <th className="px-6 py-4">순위</th>
                <th className="px-6 py-4">팀명</th>
                <th className="px-6 py-4 text-center">경기</th>
                <th
                  className="px-6 py-4 text-center"
                  style={{ color: "var(--color-primary)" }}
                >
                  승
                </th>
                <th className="px-6 py-4 text-center">무</th>
                <th className="px-6 py-4 text-center">패</th>
                <th className="px-6 py-4 text-center">득실차</th>
                <th
                  className="px-6 py-4 text-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                >
                  승점
                </th>
              </tr>
            </thead>
            <tbody>
              {activeTeams.map((team, idx) => {
                const rank = idx + 1;
                const totalGames = team.wins + team.losses + team.draws;
                const pts = team.wins * 3 + team.draws;
                // 조 통과 여부 (상위 N팀)
                const isAdvanced = rank <= advancedCount;
                // 탈락 팀은 약간 흐리게
                const isEliminated = !isAdvanced;

                return (
                  <tr
                    key={team.id}
                    className="transition-colors"
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      opacity: isEliminated ? 0.6 : 1,
                    }}
                  >
                    {/* 순위 */}
                    <td
                      className="px-6 py-4 font-bold"
                      style={{
                        color: isAdvanced
                          ? "var(--color-primary)"
                          : "var(--color-text-muted)",
                      }}
                    >
                      {String(rank).padStart(2, "0")}
                    </td>

                    {/* 팀명 + ADVANCED 배지 */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* 팀 아이콘 placeholder */}
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--color-surface)",
                          }}
                        >
                          <span
                            className="material-symbols-outlined text-xs"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            shield
                          </span>
                        </div>
                        <span
                          className="font-bold"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {team.teamName}
                        </span>
                        {/* 조 통과 배지 */}
                        {isAdvanced && (
                          <span
                            className="px-2 py-0.5 text-[10px] font-bold rounded"
                            style={{
                              backgroundColor: "rgba(34, 197, 94, 0.1)",
                              color: "#22C55E",
                            }}
                          >
                            ADVANCED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 경기 수 */}
                    <td
                      className="px-6 py-4 text-center font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {totalGames}
                    </td>

                    {/* 승 */}
                    <td
                      className="px-6 py-4 text-center font-bold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {team.wins}
                    </td>

                    {/* 무 */}
                    <td
                      className="px-6 py-4 text-center"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {team.draws}
                    </td>

                    {/* 패 */}
                    <td
                      className="px-6 py-4 text-center"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {team.losses}
                    </td>

                    {/* 득실차 */}
                    <td
                      className="px-6 py-4 text-center"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {team.pointDifference > 0
                        ? `+${team.pointDifference}`
                        : team.pointDifference === 0
                          ? "0"
                          : String(team.pointDifference)}
                    </td>

                    {/* 승점 (강조 배경) */}
                    <td
                      className="px-6 py-4 text-center font-black"
                      style={{
                        color: "var(--color-text-primary)",
                        backgroundColor: "rgba(0,0,0,0.03)",
                      }}
                    >
                      {pts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
