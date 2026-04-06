"use client";

/* ============================================================
 * NotableTeams -- 주목할만한 팀 섹션 (토스 스타일)
 *
 * 토스 스타일 변경:
 * - TossSectionHeader로 "주목할 팀" + "전체보기 >" 헤더
 * - TossListItem으로 팀 리스트 표시 (원형 아이콘 + 팀명/지역 + 전적)
 * - 기존 가로 스크롤 4열 그리드 → 세로 리스트
 *
 * API/데이터 패칭 로직은 기존과 100% 동일하게 유지.
 * ============================================================ */

import useSWR from "swr";
import Link from "next/link";
import { TossSectionHeader } from "@/components/toss/toss-section-header";
import { TossListItem } from "@/components/toss/toss-list-item";

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
  // useSWR로 팀 API 호출 (기존 로직 100% 유지)
  const { data: json } = useSWR<{ teams: TeamData[] }>(
    "/api/web/teams",
    null,
    { fallbackData, revalidateOnMount: !fallbackData }
  );

  // API 응답에서 상위 4팀 추출, 데이터 없으면 fallback 사용
  const apiTeams: TeamData[] = json?.teams ?? [];
  const teams = apiTeams.length > 0 ? apiTeams.slice(0, 4) : FALLBACK_TEAMS;

  return (
    <section>
      {/* 2K 스타일 헤더 (굵은 이탤릭, 두꺼운 하단 보더) */}
      <div className="flex items-end justify-between mb-4 pb-2 border-b-2 border-[var(--color-border)]">
        <h2 className="text-xl font-black uppercase tracking-tighter drop-shadow-sm">
          NOTABLE TEAMS
        </h2>
        <Link
          href="/teams"
          className="text-[10px] font-black text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors uppercase"
        >
          VIEW ALL &raquo;
        </Link>
      </div>

      {/* 2K 리더보드/대시보드 스타일의 밀도 높은 리스트 */}
      <div className="flex flex-col gap-1.5">
        {teams.map((team, index) => {
          const isFallback = team.id === "0";
          /* 팀 색상을 아이콘 배경으로 사용 (없으면 기본 회색) */
          const iconBg = team.primary_color ?? "var(--color-text-muted)";
          /* 지역 정보: city + district 조합 */
          const location = [team.city, team.district].filter(Boolean).join(" ");
          /* 부제: 지역 + 멤버수 */
          const subtitle = [
            location,
            !isFallback && team.member_count > 0 ? `${team.member_count}명` : null,
          ].filter(Boolean).join(" · ");

          return (
            <Link
              key={team.id + team.name}
              href={!isFallback ? `/teams/${team.id}` : "#"}
              className={`flex items-center gap-3 p-2 bg-gradient-to-r from-[var(--color-surface)] to-[var(--color-card)] hover:to-[var(--color-surface-bright)] border-l-4 border-transparent hover:border-[var(--color-primary)] transition-all duration-200 group ${isFallback ? "pointer-events-none opacity-80" : ""}`}
            >
              {/* 순위 표기 느낌의 짧은 인덱스 */}
              <div className="flex-none font-black text-lg text-[var(--color-text-disabled)] group-hover:text-[var(--color-primary)] w-5 text-center leading-none">
                {index + 1}
              </div>

              {/* 엠블럼 (평행사변형 컷아웃 박스) */}
              <div
                className="w-10 h-10 flex-none flex items-center justify-center rounded-sm shadow-inner"
                style={{
                  background: `linear-gradient(135deg, ${iconBg} 0%, rgba(0,0,0,0.5) 100%)`,
                }}
              >
                <span className="material-symbols-outlined text-[20px] text-white opacity-80">
                  shield
                </span>
              </div>

              {/* 중앙 텍스트 정보 */}
              <div className="grow min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-baseline w-full">
                  <h4 className="text-sm font-extrabold uppercase truncate text-[var(--color-text-primary)] tracking-tight">
                    {team.name}
                  </h4>
                  <span className="text-sm font-black text-[var(--color-primary)] shrink-0 ml-2">
                    {!isFallback ? `${team.wins}W ${team.losses}L` : "0W 0L"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] truncate uppercase tracking-wider">
                    {subtitle || "LOCATION TBD"}
                  </span>
                  {team.accepting_members && !isFallback && (
                    <span className="text-[9px] font-black text-[var(--color-on-primary)] bg-[var(--color-info)] px-2 py-0.5 rounded-sm ml-2 shrink-0">
                      RECRUIT
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
