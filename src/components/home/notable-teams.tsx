"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ============================================================
 * NotableTeams — 주목할만한 팀 섹션
 *
 * 왜 이 컴포넌트가 필요한가: 새 디자인에 팀 소개 섹션이 추가되었다.
 * 사용자가 활발한 팀을 발견하고 관심을 가질 수 있도록 한다.
 *
 * 구조:
 * - 파란 세로 막대(tertiary) + "주목할만한 팀" + 필터 버튼
 * - 모바일: 가로 스크롤 / 데스크탑: 4열 그리드
 * - 팀 카드: 아이콘 + 팀명 + 승수 + 멤버수
 *
 * 데이터: /api/web/teams API에서 승수(wins) 기준 상위 4팀을 가져온다.
 * API 실패 시 FALLBACK_TEAMS 상수로 graceful degradation.
 * ============================================================ */

/* API 응답의 팀 데이터 타입 */
interface TeamData {
  id: string;
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  city: string | null;
  district: string | null;
  wins: number;
  losses: number;
  acceptingMembers: boolean;
  tournamentsCount: number;
  memberCount: number;
}

/* API 실패 시 표시할 fallback 데이터 */
const FALLBACK_TEAMS: TeamData[] = [
  { id: "0", name: "Storm FC", primaryColor: "#3B82F6", secondaryColor: null, city: null, district: null, wins: 0, losses: 0, acceptingMembers: true, tournamentsCount: 0, memberCount: 0 },
  { id: "0", name: "Red Eagles", primaryColor: "#EF4444", secondaryColor: null, city: null, district: null, wins: 0, losses: 0, acceptingMembers: true, tournamentsCount: 0, memberCount: 0 },
  { id: "0", name: "Ace One", primaryColor: "#F4A261", secondaryColor: null, city: null, district: null, wins: 0, losses: 0, acceptingMembers: true, tournamentsCount: 0, memberCount: 0 },
  { id: "0", name: "Neon Pulse", primaryColor: "#8B5CF6", secondaryColor: null, city: null, district: null, wins: 0, losses: 0, acceptingMembers: true, tournamentsCount: 0, memberCount: 0 },
];

export function NotableTeams() {
  // API에서 가져온 팀 목록 (상위 4팀만 사용)
  const [teams, setTeams] = useState<TeamData[]>(FALLBACK_TEAMS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // /api/web/teams는 이미 wins 내림차순으로 정렬된 결과를 반환한다
    fetch("/api/web/teams")
      .then((res) => {
        if (!res.ok) throw new Error("API 응답 실패");
        return res.json();
      })
      .then((json) => {
        const apiTeams: TeamData[] = json.data?.teams ?? [];
        // 상위 4팀만 선택 (API가 이미 wins 내림차순이므로 slice만 하면 됨)
        if (apiTeams.length > 0) {
          setTeams(apiTeams.slice(0, 4));
        }
        // apiTeams가 비어있으면 fallback 유지
      })
      .catch(() => {
        // API 실패 시 fallback 유지 (이미 초기값으로 설정됨)
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section>
      {/* 섹션 헤더: 파란 세로 막대 + 제목 + 필터 버튼 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold font-heading tracking-tight text-text-primary flex items-center gap-3">
          {/* 파란 세로 막대 */}
          <span className="w-1.5 h-6 bg-tertiary" />
          주목할만한 팀
        </h3>
        <button className="bg-card hover:bg-elevated text-text-primary p-2 rounded transition-colors">
          <span className="material-symbols-outlined">filter_list</span>
        </button>
      </div>

      {/* 반응형 레이아웃: 모바일 가로 스크롤 / 데스크탑 4열 그리드 */}
      <div className="flex flex-row overflow-x-auto gap-4 no-scrollbar -mx-6 px-6 md:grid md:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
        {teams.map((team) => (
          <Link
            key={team.id + team.name}
            href={team.id !== "0" ? `/teams/${team.id}` : "#"}
            className="min-w-[140px] md:min-w-0 bg-surface p-6 rounded-lg text-center border border-border hover:translate-y-[-4px] transition-transform cursor-pointer block"
          >
            {/* 팀 아이콘: primaryColor가 있으면 해당 색상, 없으면 기본 */}
            <div className="w-16 h-16 bg-card rounded-lg mx-auto mb-4 flex items-center justify-center border border-border">
              <span
                className="material-symbols-outlined text-3xl"
                style={team.primaryColor ? { color: team.primaryColor } : undefined}
              >
                shield
              </span>
            </div>

            {/* 팀명 */}
            <div className="font-bold text-text-primary mb-1">
              {isLoading ? (
                // 로딩 중 스켈레톤
                <span className="inline-block w-20 h-4 bg-elevated rounded animate-pulse" />
              ) : (
                team.name
              )}
            </div>

            {/* 승수 + 멤버수 표시 (API 데이터가 있을 때만) */}
            <div className="text-[10px] text-text-muted">
              {isLoading ? (
                <span className="inline-block w-16 h-3 bg-elevated rounded animate-pulse" />
              ) : team.id !== "0" ? (
                // 실제 API 데이터: 승수와 멤버수 표시
                <>{team.wins}W · {team.memberCount}명</>
              ) : (
                // fallback 데이터: 포인트 없이 팀명만 표시
                <>-</>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
