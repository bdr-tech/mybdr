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
import { Skeleton } from "@/components/ui/skeleton";

// 일정 탭 컴포넌트
import { ScheduleTimeline } from "./schedule-timeline";
import type { ScheduleMatch, ScheduleTeam } from "./schedule-timeline";

// 대진표 컴포넌트들
import { BracketView } from "../bracket/_components/bracket-view";
import { BracketEmpty } from "../bracket/_components/bracket-empty";
import { TournamentDashboardHeader } from "../bracket/_components/tournament-dashboard-header";
import { GroupStandings, type GroupTeam } from "../bracket/_components/group-standings";
import { FinalsSidebar } from "../bracket/_components/finals-sidebar";

// 탭 타입 정의
export type TabKey = "overview" | "schedule" | "standings" | "bracket" | "teams";

// 탭 메타 정보
const TAB_META: { key: TabKey; label: string; icon: string }[] = [
  { key: "overview", label: "개요", icon: "info" },
  { key: "schedule", label: "일정", icon: "calendar_month" },
  { key: "standings", label: "순위", icon: "leaderboard" },
  { key: "bracket", label: "대진표", icon: "account_tree" },
  { key: "teams", label: "참가팀", icon: "groups" },
];

// API fetcher (JSON 응답 파싱)
const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

  const matches: ScheduleMatch[] = data?.data?.matches ?? [];
  const teams: ScheduleTeam[] = data?.data?.teams ?? [];

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">일정</h2>
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

  const teams = data?.data?.teams ?? [];

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">순위표</h2>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>#</th>
            <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>팀</th>
            <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>승</th>
            <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>패</th>
            <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>승률</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t: { id: string; teamName: string; wins: number; losses: number }, i: number) => {
            const total = t.wins + t.losses;
            const pct = total > 0 ? (t.wins / total).toFixed(3) : ".000";
            const isTop3 = i < 3;
            return (
              <tr
                key={t.id}
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  borderLeft: isTop3 ? "3px solid var(--color-primary)" : "3px solid transparent",
                }}
              >
                <td className="px-3 py-2.5 text-sm font-bold" style={{ color: "var(--color-primary)" }}>{i + 1}</td>
                <td className="px-3 py-2.5 font-medium">{t.teamName}</td>
                <td className="px-3 py-2.5 text-center">{t.wins}</td>
                <td className="px-3 py-2.5 text-center">{t.losses}</td>
                <td className="px-3 py-2.5 text-center">{pct}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
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

  const d = data?.data ?? {};
  const groupTeams: GroupTeam[] = d.groupTeams ?? [];
  const rounds = d.rounds ?? [];

  return (
    <div>
      <TournamentDashboardHeader
        tournamentName={d.tournamentName ?? ""}
        totalTeams={d.totalTeams ?? 0}
        liveMatchCount={d.liveMatchCount ?? 0}
        finalsDate={d.finalsDate ?? null}
      />
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

  const teams = data?.data?.teams ?? [];

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">참가팀</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {teams.map((t: {
          id: string;
          teamName: string;
          primaryColor: string | null;
          groupName: string | null;
          players: { id: string; jerseyNumber: number | null; position: string | null; nickname: string }[];
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
                <h3 className="font-semibold">{t.teamName}</h3>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {t.groupName && `${t.groupName} · `}{t.players.length}명
                </p>
              </div>
            </div>
            <div className="space-y-1">
              {t.players.map((p: { id: string; jerseyNumber: number | null; position: string | null; nickname: string }) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>#{p.jerseyNumber ?? "-"} {p.nickname}</span>
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
      {/* 밑줄 탭 네비게이션 */}
      <div
        className="mb-6 flex gap-4 overflow-x-auto border-b sm:mb-8 sm:gap-8 [&::-webkit-scrollbar]:hidden"
        style={{
          borderColor: "var(--color-border)",
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
              className="whitespace-nowrap pb-3 text-sm font-medium transition-colors sm:pb-4 sm:text-base"
              style={
                isActive
                  ? {
                      color: "var(--color-primary)",
                      fontWeight: 700,
                      borderBottom: "2px solid var(--color-primary)",
                      marginBottom: "-1px",
                    }
                  : { color: "var(--color-text-secondary)" }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠: 개요는 서버 렌더링, 나머지는 lazy loading */}
      <div>
        {activeTab === "overview" && overviewContent}
        {activeTab === "schedule" && <ScheduleTabContent tournamentId={tournamentId} />}
        {activeTab === "standings" && <StandingsTabContent tournamentId={tournamentId} />}
        {activeTab === "bracket" && <BracketTabContent tournamentId={tournamentId} />}
        {activeTab === "teams" && <TeamsTabContent tournamentId={tournamentId} />}
      </div>
    </div>
  );
}
