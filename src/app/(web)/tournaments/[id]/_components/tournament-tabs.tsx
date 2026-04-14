"use client";

/**
 * 대회 상세 탭 전환 컴포넌트 (Lazy Loading 방식)
 *
 * - 개요 탭: 서버에서 렌더링된 ReactNode를 그대로 표시 (즉시 로드)
 * - 나머지 탭(일정/순위/대진표/참가팀): 탭 클릭 시 API 호출 (lazy loading)
 *
 * 왜 lazy loading인가:
 * 기존에는 서버에서 6개 Prisma 쿼리를 한번에 실행했는데,
 * 사용자는 한 번에 1개 탭만 보므로 4개 탭 데이터가 낭비됨
 * 이제 필요한 탭만 클릭 시 로드하여 초기 페이지 로드 속도를 크게 개선
 */

import { useState, type ReactNode } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
// API 응답은 snake_case → 하위 컴포넌트는 camelCase를 기대하므로 변환 필요
import { convertKeysToCamelCase } from "@/lib/utils/case";

// 일정 탭 컴포넌트
import { ScheduleTimeline } from "./schedule-timeline";
import type { ScheduleMatch, ScheduleTeam } from "./schedule-timeline";

// 대진표 컴포넌트들
import { BracketView } from "../bracket/_components/bracket-view";
import { BracketEmpty } from "../bracket/_components/bracket-empty";
import { TournamentDashboardHeader } from "../bracket/_components/tournament-dashboard-header";
import { GroupStandings, type GroupTeam } from "../bracket/_components/group-standings";
import { FinalsSidebar } from "../bracket/_components/finals-sidebar";
// 풀리그 전용 컴포넌트 (round_robin/full_league/full_league_knockout)
// 주의: 경기 일정은 "일정" 탭에서 이미 보여주므로 여기서는 LeagueSchedule을 쓰지 않는다.
import { LeagueStandings, type LeagueTeam } from "../bracket/_components/league-standings";

// 탭 타입 정의 (standings는 bracket에 통합 — 백엔드 페이지는 유지)
export type TabKey = "overview" | "bracket" | "schedule" | "teams";

// 탭 메타 정보 — 순서: 대회정보 → 대진표 → 일정 → 참가팀
const TAB_META: { key: TabKey; label: string; icon: string }[] = [
  { key: "overview", label: "대회정보", icon: "info" },
  { key: "bracket", label: "대진표", icon: "account_tree" },
  { key: "schedule", label: "일정", icon: "calendar_month" },
  { key: "teams", label: "참가팀", icon: "groups" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- API 응답 구조가 탭마다 다름
type ApiResponse = Record<string, any>;

// API fetcher: JSON 파싱 후 snake_case → camelCase 변환
// apiSuccess()가 convertKeysToSnakeCase()를 적용하므로 클라이언트에서 되돌림
const fetcher = (url: string): Promise<ApiResponse> =>
  fetch(url)
    .then((r) => r.json())
    .then((json) => convertKeysToCamelCase(json) as ApiResponse);

interface TournamentTabsProps {
  tournamentId: string;
  // 개요 탭만 서버에서 렌더링하여 전달
  overviewContent: ReactNode;
}

// -- 공통 로딩 스켈레톤 --
function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}

// -- 일정 탭 콘텐츠 (API로 lazy load) --
function ScheduleTabContent({ tournamentId }: { tournamentId: string }) {
  const { data, isLoading } = useSWR(
    `/api/web/tournaments/${tournamentId}/public-schedule`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <TabSkeleton />;

  const rawMatches = data?.data?.matches ?? data?.matches ?? [];
  const matches: ScheduleMatch[] = rawMatches.map((m: Record<string, unknown>) => ({
    id: String(m.id ?? m.Id ?? ''),
    homeTeamName: (m.homeTeamName ?? m.home_team_name ?? null) as string | null,
    awayTeamName: (m.awayTeamName ?? m.away_team_name ?? null) as string | null,
    homeScore: (m.homeScore ?? m.home_score ?? 0) as number,
    awayScore: (m.awayScore ?? m.away_score ?? 0) as number,
    status: (m.status ?? null) as string | null,
    roundName: (m.roundName ?? m.round_name ?? null) as string | null,
    scheduledAt: (m.scheduledAt ?? m.scheduled_at ?? null) as string | null,
    courtNumber: (m.courtNumber ?? m.court_number ?? null) as string | null,
  }));
  const teams: ScheduleTeam[] = (data?.data?.teams ?? data?.teams ?? []).map((t: Record<string, unknown>) => ({
    id: String(t.id ?? ''),
    name: (t.name ?? '') as string,
  }));

  return (
    <div>
      {/* 일정 헤더 + 캘린더 등록 버튼 (placeholder, 추후 구현) */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">일정</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors opacity-50 cursor-not-allowed"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          title="우리팀 일정 구글 캘린더 등록 (준비 중)"
          disabled
        >
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          캘린더 등록
        </button>
      </div>
      <ScheduleTimeline matches={matches} teams={teams} />
    </div>
  );
}


// -- 대회정보 탭: 대시보드 헤더 + 서버 렌더링 개요 콘텐츠 --
function OverviewWithDashboard({ tournamentId, overviewContent }: { tournamentId: string; overviewContent: ReactNode }) {
  // 대진표 API에서 대시보드 데이터(총 팀수, 라이브 경기, 결승 일정)를 가져옴
  const { data } = useSWR(
    `/api/web/tournaments/${tournamentId}/public-bracket`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const d = data ?? {};

  return (
    <div>
      {/* 대시보드 헤더: 진행률/LIVE/핫팀 3카드 */}
      {data && (
        <div className="mb-6">
          <TournamentDashboardHeader
            totalMatches={d.totalMatches ?? 0}
            completedMatches={d.completedMatches ?? 0}
            liveMatchCount={d.liveMatchCount ?? 0}
            hotTeam={d.hotTeam ?? null}
          />
        </div>
      )}
      {/* 기존 서버 렌더링 개요 콘텐츠 */}
      {overviewContent}
    </div>
  );
}

// -- 대진표 탭 콘텐츠 (API로 lazy load) --
function BracketTabContent({ tournamentId }: { tournamentId: string }) {
  const { data, isLoading } = useSWR(
    `/api/web/tournaments/${tournamentId}/public-bracket`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <TabSkeleton />;

  // apiSuccess()는 .data 래핑 없이 직접 반환 + fetcher가 camelCase 변환 완료
  const d = data ?? {};
  const groupTeams: GroupTeam[] = d.groupTeams ?? [];
  const rounds = d.rounds ?? [];

  // 포맷별 렌더링 분기
  // - 풀리그(round_robin/full_league/full_league_knockout): 리그 순위표(=조편성 역할) + 4강 토너먼트 트리
  //   → 경기 일정은 "일정" 탭에 있으므로 대진표 탭에서 제거
  // - 조별+토너먼트(group_stage_knockout): 기존 GroupStandings + BracketView
  // - 순수 토너먼트(single_elimination 등): 기존 BracketView만
  const format: string | null = d.format ?? null;
  const isLeague =
    format === "round_robin" ||
    format === "full_league" ||
    format === "full_league_knockout";
  const leagueTeams: LeagueTeam[] = d.leagueTeams ?? [];

  // 리그 순위표는 참가팀만 있어도 표시 (경기 0개여도 조편성 역할)
  const hasLeagueData = isLeague && leagueTeams.length > 0;
  // 토너먼트 경기(round_number + bracket_position 설정된 경기)가 이미 생성되어 있는지
  const hasKnockout = rounds.length > 0;

  return (
    <div>
      {hasLeagueData ? (
        <>
          {/* 리그 순위표: 풀리그 결과 = 4강 진출 조편성 기준 */}
          <LeagueStandings teams={leagueTeams} tournamentStatus={d.tournamentStatus} />

          {/* 4강 토너먼트 영역: full_league_knockout 포맷에서만 노출
              - 이미 토너먼트 경기가 생성되어 있으면 BracketView
              - 아직 생성 전이면 "리그 종료 후 확정" 안내 카드 */}
          {format === "full_league_knockout" && (
            hasKnockout ? (
              <section className="mt-8">
                <h3
                  className="mb-4 text-lg font-bold sm:text-xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  4강 토너먼트
                </h3>
                <div className="grid grid-cols-12 gap-4 sm:gap-8">
                  <div className="col-span-12">
                    <BracketView rounds={rounds} tournamentId={tournamentId} />
                  </div>
                </div>
              </section>
            ) : (
              <section className="mt-8">
                <div
                  className="rounded-lg border p-6 text-center"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  <span
                    className="material-symbols-outlined mb-2 text-4xl"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    account_tree
                  </span>
                  <h3 className="mb-2 text-base font-bold">토너먼트 대진</h3>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    리그 종료 후 1-4위, 2-3위가 맞붙는 4강이 확정됩니다.
                  </p>
                </div>
              </section>
            )
          )}
        </>
      ) : (
        <>
          {/* 기존 분기 유지 (조별+토너먼트 / 순수 토너먼트 / 빈 상태) */}
          {groupTeams.length > 0 && <GroupStandings teams={groupTeams} />}
          {hasKnockout ? (
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-8">
                <BracketView rounds={rounds} tournamentId={tournamentId} />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <FinalsSidebar
                  finalsDate={d.finalsDate ?? null}
                  venueName={d.venueName ?? null}
                  city={d.city ?? null}
                  entryFee={d.entryFee ?? null}
                />
              </div>
            </div>
          ) : (
            <BracketEmpty tournamentId={tournamentId} />
          )}
        </>
      )}
    </div>
  );
}

// -- 참가팀 탭 콘텐츠 (API로 lazy load) --
function TeamsTabContent({ tournamentId }: { tournamentId: string }) {
  const { data, isLoading } = useSWR(
    `/api/web/tournaments/${tournamentId}/public-teams`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <TabSkeleton />;

  // apiSuccess()는 .data 래핑 없이 직접 반환
  const teams = data?.teams ?? [];

  // 카드 그리드 레이아웃: 모바일 2열 / 태블릿 3열 / PC 4열
  // 선수 목록은 팀 상세 페이지(/teams/{teamId})로 이동하여 확인
  return (
    <div>
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">참가팀</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {teams.map((t: {
          id: string;
          teamId: string; // Team 테이블의 실제 id (팀 페이지 링크용)
          teamName: string;
          primaryColor: string | null;
          // 로고 URL — 있으면 이미지, 없으면 city 플레이스홀더
          logoUrl: string | null;
          city: string | null;
          district: string | null;
          groupName: string | null;
          players: { id: string; userId: string | null; jerseyNumber: number | null; position: string | null; nickname: string }[];
        }) => (
          // 카드 전체를 Link로 감싸 클릭 시 팀 상세로 이동
          <Link
            key={t.id}
            href={`/teams/${t.teamId}`}
            className="flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors hover:opacity-80 sm:p-4"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
          >
            {/* 팀 로고: 있으면 이미지, 없으면 primaryColor 배경 + city(지역명) 텍스트 */}
            {t.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 외부 이미지, next/image 최적화 불필요
              <img
                src={t.logoUrl}
                alt=""
                className="h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16"
              />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full text-xs font-bold text-white sm:h-16 sm:w-16 sm:text-sm"
                style={{ backgroundColor: t.primaryColor ?? "var(--color-primary)" }}
              >
                {/* city(지역명) 우선 — 없을 때만 팀명 첫 글자 */}
                {t.city ?? t.teamName.charAt(0)}
              </div>
            )}
            {/* 팀명 — 가운데 정렬, 잘림 방지 */}
            <p className="w-full truncate text-center text-sm font-bold">{t.teamName}</p>
            {/* 지역 — city + district (없으면 생략) */}
            {t.city && (
              <p className="w-full truncate text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                {t.city}{t.district ? ` ${t.district}` : ""}
              </p>
            )}
            {/* 멤버수 — 아이콘 + 명수 */}
            <p className="flex items-center gap-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              <span className="material-symbols-outlined align-middle text-xs">group</span>
              {t.players?.length ?? 0}명
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TournamentTabs({
  tournamentId,
  overviewContent,
}: TournamentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div>
      {/* 탭 네비게이션: 배경색 카드 스타일 (구분감 있는 세그먼트 디자인) */}
      <div
        className="-mx-4 mb-6 flex gap-0 overflow-x-auto p-1 sm:mx-0 sm:gap-1 sm:rounded-lg sm:mb-8 [&::-webkit-scrollbar]:hidden"
        style={{
          backgroundColor: "var(--color-surface)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {TAB_META.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-all sm:px-4 ${
                isActive
                  ? "bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm font-bold"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠: 개요는 서버 렌더링, 나머지는 lazy loading */}
      <div>
        {activeTab === "overview" && <OverviewWithDashboard tournamentId={tournamentId} overviewContent={overviewContent} />}
        {activeTab === "bracket" && <BracketTabContent tournamentId={tournamentId} />}
        {activeTab === "schedule" && <ScheduleTabContent tournamentId={tournamentId} />}
        {activeTab === "teams" && <TeamsTabContent tournamentId={tournamentId} />}
      </div>
    </div>
  );
}
