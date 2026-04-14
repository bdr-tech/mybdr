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
import { LeagueStandings, type LeagueTeam } from "../bracket/_components/league-standings";
import { LeagueSchedule, type LeagueMatch } from "../bracket/_components/league-schedule";

// 탭 타입 정의
export type TabKey = "overview" | "schedule" | "standings" | "bracket" | "teams";

// 탭 메타 정보
const TAB_META: { key: TabKey; label: string; icon: string }[] = [
  { key: "overview", label: "대회정보", icon: "info" },
  { key: "schedule", label: "일정", icon: "calendar_month" },
  { key: "standings", label: "순위", icon: "leaderboard" },
  { key: "bracket", label: "대진표", icon: "account_tree" },
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

// -- 순위 탭 콘텐츠 (API로 lazy load) --
function StandingsTabContent({ tournamentId }: { tournamentId: string }) {
  const { data, isLoading } = useSWR(
    `/api/web/tournaments/${tournamentId}/public-standings`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <TabSkeleton />;

  // apiSuccess()는 .data 래핑 없이 직접 반환
  // 순위표 팀 타입 (API에서 gamesPlayed, winRate, pointDifference, pointsFor 추가됨)
  type StandingsTeam = {
    id: string;
    teamId: string; // Team 테이블의 실제 id (팀 페이지 링크용)
    teamName: string;
    wins: number;
    losses: number;
    gamesPlayed: number;
    winRate: number;
    pointDifference: number;
    pointsFor: number;
  };
  const teams: StandingsTeam[] = data?.teams ?? [];

  // 대회 상태에 따라 공동순위 판단 기준이 달라짐
  // - 진행 중: 승률만 같으면 공동순위 (세부 기준은 아직 의미 없음)
  // - 종료: 승률+득실차+다득점 모두 같아야 공동순위 (최종 확정 순위)
  const isCompleted = data?.tournamentStatus === "completed";

  let rank = 1;
  const ranks = teams.map((t, i) => {
    if (i > 0) {
      const prev = teams[i - 1];
      if (isCompleted) {
        // 종료된 대회: 모든 세부 기준까지 같아야 공동순위 (거의 발생 안 함)
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
        // 진행 중 대회: 승률만 같으면 공동순위
        if (t.winRate === prev.winRate) {
          // 공동순위 유지
        } else {
          rank = i + 1;
        }
      }
    }
    return rank;
  });

  // KBL 승률 표시: .XXX 형식 (전승만 1.000, 0경기는 "-")
  const formatWinRate = (t: StandingsTeam) => {
    if (t.gamesPlayed === 0) return "-";
    if (t.winRate === 1) return "1.000";
    return t.winRate.toFixed(3).replace(/^0/, "");
  };

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">순위표</h2>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            <th className="px-2 py-2 text-left text-xs font-medium sm:px-3" style={{ color: "var(--color-text-tertiary)" }}>#</th>
            <th className="px-2 py-2 text-left text-xs font-medium sm:px-3" style={{ color: "var(--color-text-tertiary)" }}>팀</th>
            <th className="px-2 py-2 text-center text-xs font-medium sm:px-3" style={{ color: "var(--color-text-tertiary)" }}>경기</th>
            <th className="px-2 py-2 text-center text-xs font-medium sm:px-3" style={{ color: "var(--color-text-tertiary)" }}>승</th>
            <th className="px-2 py-2 text-center text-xs font-medium sm:px-3" style={{ color: "var(--color-text-tertiary)" }}>패</th>
            <th className="px-2 py-2 text-center text-xs font-medium sm:px-3" style={{ color: "var(--color-text-tertiary)" }}>승률</th>
            <th className="hidden px-2 py-2 text-center text-xs font-medium sm:table-cell sm:px-3" style={{ color: "var(--color-text-tertiary)" }}>득실차</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => {
            const isTop3 = ranks[i] <= 3;
            return (
              <tr
                key={t.id}
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  borderLeft: isTop3 ? "3px solid var(--color-primary)" : "3px solid transparent",
                }}
              >
                <td className="px-2 py-2.5 text-sm font-bold sm:px-3" style={{ color: "var(--color-primary)" }}>{ranks[i]}</td>
                <td className="px-2 py-2.5 font-medium sm:px-3">
                  <Link href={`/teams/${t.teamId}`} className="hover:underline">{t.teamName}</Link>
                </td>
                <td className="px-2 py-2.5 text-center sm:px-3">{t.gamesPlayed}</td>
                <td className="px-2 py-2.5 text-center sm:px-3">{t.wins}</td>
                <td className="px-2 py-2.5 text-center sm:px-3">{t.losses}</td>
                <td className="px-2 py-2.5 text-center font-mono sm:px-3">{formatWinRate(t)}</td>
                <td className="hidden px-2 py-2.5 text-center sm:table-cell sm:px-3">
                  {t.pointDifference > 0 ? `+${t.pointDifference}` : t.pointDifference}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
  // - 풀리그(round_robin/full_league/full_league_knockout): 리그 순위표 + 경기 일정
  // - 조별+토너먼트(group_stage_knockout): 기존 GroupStandings + BracketView
  // - 순수 토너먼트(single_elimination 등): 기존 BracketView만
  const format: string | null = d.format ?? null;
  const isLeague =
    format === "round_robin" ||
    format === "full_league" ||
    format === "full_league_knockout";
  const leagueTeams: LeagueTeam[] = d.leagueTeams ?? [];
  const leagueMatches: LeagueMatch[] = d.leagueMatches ?? [];

  // 풀리그 경기가 하나라도 있으면 리그 UI 표시 (경기 0개면 빈 상태)
  const hasLeagueData = isLeague && (leagueTeams.length > 0 || leagueMatches.length > 0);

  return (
    <div>
      {hasLeagueData ? (
        <>
          {/* 풀리그: 리그 순위표 + 경기 일정 */}
          <LeagueStandings teams={leagueTeams} tournamentStatus={d.tournamentStatus} />
          <LeagueSchedule matches={leagueMatches} />
          {/* full_league_knockout: 리그 후 토너먼트가 이미 생성되어 있으면 함께 표시 */}
          {rounds.length > 0 && (
            <div className="mt-8">
              <BracketView rounds={rounds} tournamentId={tournamentId} />
            </div>
          )}
        </>
      ) : (
        <>
          {/* 기존 분기 유지 (조별+토너먼트 / 순수 토너먼트 / 빈 상태) */}
          {groupTeams.length > 0 && <GroupStandings teams={groupTeams} />}
          {rounds.length > 0 ? (
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

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">참가팀</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {teams.map((t: {
          id: string;
          teamId: string; // Team 테이블의 실제 id (팀 페이지 링크용)
          teamName: string;
          primaryColor: string | null;
          groupName: string | null;
          players: { id: string; userId: string | null; jerseyNumber: number | null; position: string | null; nickname: string }[];
        }) => (
          <div
            key={t.id}
            className="rounded-lg p-4"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: t.primaryColor
                    ? `${t.primaryColor}20`
                    : "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                  color: t.primaryColor ?? "var(--color-primary)",
                }}
              >
                {t.teamName.charAt(0)}
              </div>
              <div>
                <Link href={`/teams/${t.teamId}`} className="hover:underline">
                  <h3 className="font-semibold">{t.teamName}</h3>
                </Link>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {t.groupName && `${t.groupName} · `}{t.players.length}명
                </p>
              </div>
            </div>
            <div className="space-y-1">
              {t.players.map((p: { id: string; userId: string | null; jerseyNumber: number | null; position: string | null; nickname: string }) => (
                <div key={p.id} className="flex justify-between text-sm">
                  {/* userId가 있으면 선수 프로필 링크, 없으면 텍스트만 */}
                  {p.userId ? (
                    <Link href={`/users/${p.userId}`} className="hover:underline" style={{ color: "var(--color-text-muted)" }}>
                      #{p.jerseyNumber ?? "-"} {p.nickname}
                    </Link>
                  ) : (
                    <span style={{ color: "var(--color-text-muted)" }}>#{p.jerseyNumber ?? "-"} {p.nickname}</span>
                  )}
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{p.position ?? ""}</span>
                </div>
              ))}
            </div>
          </div>
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
        {activeTab === "schedule" && <ScheduleTabContent tournamentId={tournamentId} />}
        {activeTab === "standings" && <StandingsTabContent tournamentId={tournamentId} />}
        {activeTab === "bracket" && <BracketTabContent tournamentId={tournamentId} />}
        {activeTab === "teams" && <TeamsTabContent tournamentId={tournamentId} />}
      </div>
    </div>
  );
}
