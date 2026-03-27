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
      {/* 토스 스타일 섹션 헤더: "주목할 팀" + "전체보기 >" */}
      <TossSectionHeader title="주목할 팀" actionHref="/teams" />

      {/* 팀 리스트: TossListItem으로 통일 (토스 앱 계좌 목록 패턴) */}
      <div>
        {teams.map((team) => {
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
            <TossListItem
              key={team.id + team.name}
              icon="shield"
              iconBg={iconBg}
              title={team.name}
              subtitle={subtitle || undefined}
              rightText={!isFallback ? `${team.wins}W ${team.losses}L` : undefined}
              rightSub={team.accepting_members && !isFallback ? "모집중" : undefined}
              href={!isFallback ? `/teams/${team.id}` : undefined}
              showArrow={!isFallback}
            />
          );
        })}
      </div>
    </section>
  );
}
