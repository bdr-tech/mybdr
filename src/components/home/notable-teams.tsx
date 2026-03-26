"use client";

import Link from "next/link";
import useSWR from "swr";

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

/* API 응답의 팀 데이터 타입 (apiSuccess가 snake_case로 자동 변환) */
interface TeamData {
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  city: string | null;
  district: string | null;
  wins: number;
  losses: number;
  accepting_members: boolean;
  tournaments_count: number;
  member_count: number;
}

/* API 실패 시 표시할 fallback 데이터 */
const FALLBACK_TEAMS: TeamData[] = [
  { id: "0", name: "Storm FC", primary_color: "#3B82F6", secondary_color: null, city: null, district: null, wins: 0, losses: 0, accepting_members: true, tournaments_count: 0, member_count: 0 },
  { id: "0", name: "Red Eagles", primary_color: "#EF4444", secondary_color: null, city: null, district: null, wins: 0, losses: 0, accepting_members: true, tournaments_count: 0, member_count: 0 },
  { id: "0", name: "Ace One", primary_color: "#F4A261", secondary_color: null, city: null, district: null, wins: 0, losses: 0, accepting_members: true, tournaments_count: 0, member_count: 0 },
  { id: "0", name: "Neon Pulse", primary_color: "#8B5CF6", secondary_color: null, city: null, district: null, wins: 0, losses: 0, accepting_members: true, tournaments_count: 0, member_count: 0 },
];

/* 서버에서 미리 가져온 데이터를 받을 수 있는 props */
interface NotableTeamsProps {
  fallbackData?: { teams: TeamData[] };
}

export function NotableTeams({ fallbackData }: NotableTeamsProps = {}) {
  // useSWR로 팀 API 호출 (right-sidebar와 같은 URL이므로 SWR이 자동 중복 제거)
  // fallbackData가 있으면 로딩 없이 즉시 렌더링, SWR이 뒤에서 최신 데이터 갱신
  const { data: json, isLoading } = useSWR<{ teams: TeamData[] }>(
    "/api/web/teams",
    null,
    { fallbackData }
  );

  // API 응답에서 상위 4팀 추출, 데이터 없으면 fallback 사용
  const apiTeams: TeamData[] = json?.teams ?? [];
  const teams = apiTeams.length > 0 ? apiTeams.slice(0, 4) : FALLBACK_TEAMS;

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
                style={team.primary_color ? { color: team.primary_color } : undefined}
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
            <div className="text-xs text-text-muted">
              {isLoading ? (
                <span className="inline-block w-16 h-3 bg-elevated rounded animate-pulse" />
              ) : team.id !== "0" ? (
                // 실제 API 데이터: 승수와 멤버수 표시
                <>{team.wins}W · {team.member_count}명</>
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
