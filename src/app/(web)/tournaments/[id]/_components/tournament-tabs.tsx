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

// 대시보드 헤더 (overview 탭에서 사용)
import { TournamentDashboardHeader } from "../bracket/_components/tournament-dashboard-header";
// 팀 카드 (팀 목록 페이지와 UI 통일)
import { TeamCard } from "../../../teams/_components/team-card";

// 대진표 v2 통합 래퍼 — 헤더/Status/메인트리/사이드 카드 전체를 자체적으로 처리
// 기존 BracketView/LeagueStandings/GroupStandings/FinalsSidebar/BracketEmpty 등은
// V2BracketWrapper 내부에서 그대로 호출 (포맷별 분기 보존)
import { V2BracketWrapper } from "./v2-bracket-wrapper";
import type { SeriesEdition } from "./v2-bracket-header";

// 탭 타입 정의 (standings는 bracket에 통합 — 백엔드 페이지는 유지)
// Phase 2 Match: "rules" 탭 추가 (DB tournaments.rules 표시용)
export type TabKey = "overview" | "schedule" | "bracket" | "teams" | "rules";

// 탭 메타 정보 — 시안 Match.jsx L117 순서: 대회소개 → 경기일정 → 대진표 → 참가팀 → 규정
const TAB_META: { key: TabKey; label: string; icon: string }[] = [
  { key: "overview", label: "대회소개", icon: "info" },
  { key: "schedule", label: "경기일정", icon: "calendar_month" },
  { key: "bracket", label: "대진표", icon: "account_tree" },
  { key: "teams", label: "참가팀", icon: "groups" },
  { key: "rules", label: "규정", icon: "gavel" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- API 응답 구조가 탭마다 다름
type ApiResponse = Record<string, any>;

// API fetcher: JSON 파싱 후 snake_case → camelCase 변환
// apiSuccess()가 convertKeysToSnakeCase()를 적용하므로 클라이언트에서 되돌림
// non-OK 응답은 throw → SWR error 상태 트리거 (이전엔 에러 JSON을 data로 반환해 silent failure 발생)
const fetcher = (url: string): Promise<ApiResponse> =>
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`API ${r.status}`);
      return r.json();
    })
    .then((json) => convertKeysToCamelCase(json) as ApiResponse);

interface TournamentTabsProps {
  tournamentId: string;
  // 개요 탭만 서버에서 렌더링하여 전달
  overviewContent: ReactNode;
  // Phase 2 Match: 규정 탭 콘텐츠 (서버에서 tournament.rules 프리렌더)
  // 없으면(null) 빈 상태 카드 렌더 — 탭 자체는 항상 표시
  rulesContent?: ReactNode;
  // URL의 ?tab= 쿼리로 받은 초기 탭 (redirect된 /bracket, /schedule 등에서 유입 시 사용)
  // 상위 서버 컴포넌트가 searchParams로 파싱해서 넘김 → 잘못된 값은 "overview"로 이미 폴백됨
  initialTab?: TabKey;
  // ── Bracket 탭 v2 헤더용 메타 (page.tsx에서 서버 props로 전달) ──
  // 기존 props 변경 0 — 신규 추가만. 이미 서버에서 조회한 필드 그대로 위임.
  tournamentName: string;
  editionNumber: number | null;
  startDate: Date | null;
  endDate: Date | null;
  venueName: string | null;
  // 같은 series_id 내 다른 토너먼트 (시안의 select 라우팅용)
  // 데이터 부족 시 빈 배열 → V2BracketHeader에서 select 자동 disabled
  seriesEditions?: SeriesEdition[];
}

// -- 공통 에러 상태 --
function TabError({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border p-8 text-center text-sm"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-muted)" }}
    >
      <span className="material-symbols-outlined mb-2 block text-3xl" style={{ color: "var(--color-error)" }}>error_outline</span>
      {message}
    </div>
  );
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
  const { data, isLoading, error } = useSWR(
    `/api/web/tournaments/${tournamentId}/public-schedule`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <TabSkeleton />;
  if (error) return <TabError message="일정을 불러오는 중 오류가 발생했습니다." />;

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

// -- 대진표 탭 콘텐츠 (v2 래퍼) --
// 기존 BracketTabContent의 포맷별 분기 로직 + 새 헤더/Status/사이드 카드를
// V2BracketWrapper가 모두 담당. 여기서는 props만 위임한다.
// API/Prisma/서비스 레이어 변경 없음. SWR 호출도 V2BracketWrapper 내부로 이동.
//
// BracketView/LeagueStandings/GroupStandings/FinalsSidebar/BracketEmpty 등
// 기존 트리 컴포넌트는 V2BracketWrapper 내부에서 그대로 호출됨.
type BracketTabContentProps = {
  tournamentId: string;
  // 헤더/부제 조립용 — page.tsx에서 서버 props로 전달
  tournamentName: string;
  editionNumber: number | null;
  startDate: Date | null;
  endDate: Date | null;
  venueName: string | null;
  // 시리즈 회차 select 옵션 (같은 series_id 다른 토너먼트 라우팅용)
  seriesEditions: SeriesEdition[];
};

function BracketTabContent({
  tournamentId,
  tournamentName,
  editionNumber,
  startDate,
  endDate,
  venueName,
  seriesEditions,
}: BracketTabContentProps) {
  return (
    <V2BracketWrapper
      tournamentId={tournamentId}
      tournamentName={tournamentName}
      editionNumber={editionNumber}
      startDate={startDate}
      endDate={endDate}
      venueName={venueName}
      seriesEditions={seriesEditions}
    />
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

  // 팀 목록 페이지와 동일한 TeamCard 재사용 (UI 통일)
  type ApiTeam = {
    id: string;
    teamId: string;
    teamName: string;
    // Phase 2C: 한/영 병기를 위해 API가 내려주는 영문명/대표언어 필드
    teamNameEn: string | null;
    teamNamePrimary: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    logoUrl: string | null;
    city: string | null;
    district: string | null;
    wins: number | null;
    losses: number | null;
    accepting_members: boolean | null;
    tournaments_count: number | null;
    players: { id: string }[];
  };
  return (
    <div>
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">참가팀</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {(teams as ApiTeam[]).map((t) => (
          <TeamCard
            key={t.id}
            team={{
              id: BigInt(t.teamId),
              name: t.teamName,
              // Phase 2C: TeamCard가 한/영 병기를 렌더링하도록 name_en/name_primary 전달 (snake_case key)
              name_en: t.teamNameEn,
              name_primary: t.teamNamePrimary,
              logoUrl: t.logoUrl,
              primaryColor: t.primaryColor,
              secondaryColor: t.secondaryColor,
              city: t.city,
              district: t.district,
              wins: t.wins,
              losses: t.losses,
              accepting_members: t.accepting_members,
              tournaments_count: t.tournaments_count,
              _count: { teamMembers: t.players?.length ?? 0 },
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function TournamentTabs({
  tournamentId,
  overviewContent,
  rulesContent,
  initialTab = "overview",
  tournamentName,
  editionNumber,
  startDate,
  endDate,
  venueName,
  seriesEditions = [],
}: TournamentTabsProps) {
  // 초기 탭: 서버에서 searchParams로 파싱한 값. 유효하지 않으면 overview로 폴백됨(상위에서 이미 검증)
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

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

      {/* 탭 콘텐츠: 개요/규정은 서버 렌더링, 나머지는 lazy loading */}
      <div>
        {activeTab === "overview" && <OverviewWithDashboard tournamentId={tournamentId} overviewContent={overviewContent} />}
        {activeTab === "bracket" && (
          <BracketTabContent
            tournamentId={tournamentId}
            tournamentName={tournamentName}
            editionNumber={editionNumber}
            startDate={startDate}
            endDate={endDate}
            venueName={venueName}
            seriesEditions={seriesEditions}
          />
        )}
        {activeTab === "schedule" && <ScheduleTabContent tournamentId={tournamentId} />}
        {activeTab === "teams" && <TeamsTabContent tournamentId={tournamentId} />}
        {/* 규정 탭: 서버에서 tournament.rules로 프리렌더된 콘텐츠.
            데이터 없으면 빈 상태 카드(page.tsx에서 폴백 렌더). 탭 자체는 항상 렌더. */}
        {activeTab === "rules" && <div>{rulesContent}</div>}
      </div>
    </div>
  );
}
