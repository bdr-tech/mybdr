import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

import { buildRoundGroups } from "@/lib/tournaments/bracket-builder";

// 기존 디자인 컴포넌트 (히어로 + 사이드바 + About 섹션)
import { TournamentHero } from "./_components/tournament-hero";
import { TournamentSidebar } from "./_components/tournament-sidebar";
import { TournamentAbout } from "./_components/tournament-about";

// 새 탭 전환 컴포넌트 (클라이언트)
import { TournamentTabs } from "./_components/tournament-tabs";

// 일정 탭 컴포넌트 (클라이언트)
import { ScheduleTimeline } from "./_components/schedule-timeline";
import type { ScheduleMatch, ScheduleTeam } from "./_components/schedule-timeline";

// 대진표 컴포넌트들 (클라이언트)
import { BracketView } from "./bracket/_components/bracket-view";
import { BracketEmpty } from "./bracket/_components/bracket-empty";
import { TournamentDashboardHeader } from "./bracket/_components/tournament-dashboard-header";
import { GroupStandings, type GroupTeam } from "./bracket/_components/group-standings";
import { FinalsSidebar } from "./bracket/_components/finals-sidebar";

export const revalidate = 30;

// SEO: 대회 상세 동적 메타데이터 -- 대회명을 DB에서 조회하여 title에 반영
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { name: true, description: true },
  }).catch(() => null);
  if (!tournament) return { title: "대회 상세 | MyBDR" };
  return {
    title: `${tournament.name} | MyBDR`,
    description: tournament.description?.slice(0, 100) || `${tournament.name} 대회 일정, 팀, 순위를 확인하세요.`,
  };
}

// -- Skeleton for matches + standings (개요 탭 내부 Suspense용) --
function MatchesStandingsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Skeleton className="mb-3 h-5 w-20" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-radius-card" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-12" />
        <Skeleton className="h-48 rounded-radius-card" />
      </div>
    </div>
  );
}

// -- Async component: 개요 탭의 최근 경기 + 순위 미리보기 (기존 prisma 쿼리 100% 유지) --
async function MatchesAndStandings({ tournamentId }: { tournamentId: string }) {
  const [matches, teams] = await Promise.all([
    prisma.tournamentMatch.findMany({
      where: { tournamentId },
      orderBy: { scheduledAt: "asc" },
      take: 10,
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { team: { select: { name: true } } } },
        awayTeam: { select: { team: { select: { name: true } } } },
      },
    }),
    prisma.tournamentTeam.findMany({
      where: { tournamentId },
      orderBy: [{ wins: "desc" }],
      select: {
        id: true,
        wins: true,
        losses: true,
        team: { select: { name: true } },
      },
    }),
  ]);

  if (matches.length === 0 && teams.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 최근 경기 */}
      {matches.length > 0 && (
        <div>
          <h2
            className="mb-3 flex items-center gap-2 font-semibold uppercase tracking-wide"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="material-symbols-outlined text-lg" style={{ color: "var(--color-primary)" }}>sports_score</span>
            최근 경기
          </h2>
          <div className="space-y-2">
            {matches.map((m) => (
              <div
                key={m.id.toString()}
                className="flex items-center justify-between rounded-radius-card border p-3"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <span className="text-sm font-medium">{m.homeTeam?.team.name ?? "TBD"}</span>
                <span
                  className="rounded-full px-3 py-1 text-sm font-bold"
                  style={{ backgroundColor: "var(--color-elevated)" }}
                >
                  {m.homeScore}:{m.awayScore}
                </span>
                <span className="text-sm font-medium">{m.awayTeam?.team.name ?? "TBD"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 순위 테이블: 미니멀 플랫 스타일 (외곽 border 제거, 하단선만) */}
      {teams.length > 0 && (
        <div>
          <h2
            className="mb-3 flex items-center gap-2 font-semibold uppercase tracking-wide"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="material-symbols-outlined text-lg" style={{ color: "var(--color-primary)" }}>leaderboard</span>
            순위
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>#</th>
                <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>팀</th>
                <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>승</th>
                <th className="px-3 py-2 text-center text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>패</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t, i) => {
                const isTop3 = i < 3;
                return (
                  <tr
                    key={t.id.toString()}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      borderLeft: isTop3 ? "3px solid var(--color-primary)" : "3px solid transparent",
                    }}
                  >
                    <td className="px-3 py-2 font-bold" style={{ color: "var(--color-primary)" }}>{i + 1}</td>
                    <td className="px-3 py-2">{t.team.name}</td>
                    <td className="px-3 py-2 text-center">{t.wins ?? 0}</td>
                    <td className="px-3 py-2 text-center">{t.losses ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// -- 메인 페이지: 모든 탭 데이터를 병렬 조회 후 TournamentTabs에 전달 --
export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // UUID 형식이 아닌 경우 (예: /tournaments/new) 404 처리
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return notFound();
  }

  // ========================================
  // 1) 대회 기본 정보 조회 (기존 쿼리 100% 유지)
  // ========================================
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      format: true,
      status: true,
      description: true,
      startDate: true,
      endDate: true,
      city: true,
      venue_name: true,
      entry_fee: true,
      registration_start_at: true,
      registration_end_at: true,
      categories: true,
      div_caps: true,
      div_fees: true,
      allow_waiting_list: true,
      bank_name: true,
      bank_account: true,
      bank_holder: true,
      maxTeams: true,
      _count: { select: { tournamentTeams: true } },
    },
  });
  if (!tournament) return notFound();

  // ========================================
  // 2) 모든 탭에 필요한 데이터를 병렬 조회
  //    Promise.all로 한번에 -- 페이지 로드 속도 최적화
  // ========================================
  const [
    scheduleRawMatches,
    scheduleRawTeams,
    standingsTeams,
    bracketMatches,
    bracketTournamentTeams,
    teamsWithPlayers,
  ] = await Promise.all([
    // 일정 탭: 경기 목록
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: { scheduledAt: "asc" },
      include: {
        homeTeam: { include: { team: { select: { name: true } } } },
        awayTeam: { include: { team: { select: { name: true } } } },
      },
    }),
    // 일정 탭: 참가팀 목록 (팀 필터용)
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      select: {
        id: true,
        team: { select: { name: true } },
      },
      orderBy: { team: { name: "asc" } },
    }),
    // 순위 탭: 팀 순위 목록
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      include: { team: { select: { name: true } } },
      orderBy: [{ wins: "desc" }, { losses: "asc" }],
    }),
    // 대진표 탭: 매치 데이터
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }],
      include: {
        homeTeam: {
          include: {
            team: { select: { name: true, primaryColor: true } },
          },
        },
        awayTeam: {
          include: {
            team: { select: { name: true, primaryColor: true } },
          },
        },
      },
    }),
    // 대진표 탭: 참가팀 (조별리그 순위표 + 통계용)
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      include: {
        team: { select: { name: true } },
      },
      orderBy: [{ wins: "desc" }, { losses: "asc" }],
    }),
    // 참가팀 탭: 팀 + 선수 목록
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      include: {
        team: { select: { name: true, primaryColor: true } },
        players: {
          select: {
            id: true,
            jerseyNumber: true,
            position: true,
            users: { select: { nickname: true } },
          },
        },
      },
    }),
  ]);

  // ========================================
  // 3) 접수 상태 + 디비전 가공 (기존 로직 100% 유지)
  // ========================================
  const now = new Date();
  const regStatuses = ["registration", "registration_open", "active", "published"];
  const isRegStatus = regStatuses.includes(tournament.status ?? "");
  const regOpen = tournament.registration_start_at;
  const regClose = tournament.registration_end_at;
  const isRegistrationOpen = isRegStatus && (!regOpen || regOpen <= now) && (!regClose || regClose >= now);
  const isRegistrationSoon = isRegStatus && regOpen && regOpen > now;

  const categories = (tournament.categories ?? {}) as Record<string, string[]>;
  const divCaps = (tournament.div_caps ?? {}) as Record<string, number>;
  const divFees = (tournament.div_fees ?? {}) as Record<string, number>;
  const hasCategories = Object.keys(categories).length > 0;

  let divisionCounts: { division: string | null; _count: { id: number } }[] = [];
  if (hasCategories) {
    const grouped = await prisma.tournamentTeam.groupBy({
      by: ["division"] as const,
      where: { tournamentId: id, status: { in: ["pending", "approved"] } },
      _count: { id: true },
    });
    divisionCounts = grouped;
  }

  const divisions = hasCategories
    ? Object.entries(categories).flatMap(([cat, divs]) =>
        divs.map((div) => ({
          category: cat,
          division: div,
          count: divisionCounts.find((d) => d.division === div)?._count.id ?? 0,
          cap: divCaps[div] ?? null,
          fee: divFees[div] ?? (tournament.entry_fee ? Number(tournament.entry_fee) : null),
        }))
      )
    : [];

  // ========================================
  // 4) 일정 탭 데이터 직렬화 (BigInt -> string, Date -> ISO string)
  // ========================================
  const scheduleMatches: ScheduleMatch[] = scheduleRawMatches.map((m) => ({
    id: m.id.toString(),
    homeTeamName: m.homeTeam?.team.name ?? null,
    awayTeamName: m.awayTeam?.team.name ?? null,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    roundName: m.roundName,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    courtNumber: m.court_number,
  }));

  const scheduleTeams: ScheduleTeam[] = scheduleRawTeams.map((t) => ({
    id: t.id.toString(),
    name: t.team.name,
  }));

  // ========================================
  // 5) 대진표 탭 데이터 가공
  // ========================================
  const liveMatchCount = bracketMatches.filter((m) => m.status === "in_progress").length;

  // 대진표용 매치만 필터 (round_number + bracket_position이 있는 것)
  const bracketOnlyMatches = bracketMatches.filter(
    (m) => m.round_number != null && m.bracket_position != null
  );

  // 결승전 예정일 계산
  const finalsDate = bracketOnlyMatches.length > 0
    ? (() => {
        const maxRound = Math.max(...bracketOnlyMatches.map((m) => m.round_number!));
        const finalMatch = bracketOnlyMatches.find((m) => m.round_number === maxRound);
        return finalMatch?.scheduledAt?.toISOString() ?? null;
      })()
    : null;

  // 조별리그 순위표 데이터 (groupName이 있는 팀만)
  const groupTeams: GroupTeam[] = bracketTournamentTeams
    .filter((t) => t.groupName != null)
    .map((t) => ({
      id: t.id.toString(),
      teamName: t.team.name,
      groupName: t.groupName,
      wins: t.wins ?? 0,
      losses: t.losses ?? 0,
      draws: t.draws ?? 0,
      pointsFor: t.points_for ?? 0,
      pointsAgainst: t.points_against ?? 0,
      pointDifference: t.point_difference ?? 0,
    }));

  // 대진표 라운드 구조 변환 (bracket-builder 유틸 사용)
  const rounds = bracketOnlyMatches.length > 0 ? buildRoundGroups(bracketOnlyMatches) : [];

  // ========================================
  // 6) 각 탭 콘텐츠 조립
  // ========================================

  // -- 개요 탭 콘텐츠 --
  const overviewContent = (
    <>
      {/* 대회 정보 (구조화된 설명) */}
      {tournament.description && (
        <TournamentAbout
          description={tournament.description}
          categories={categories}
          format={tournament.format}
        />
      )}

      {/* 장소/안내 요약 카드: 모바일에서 사이드바가 하단에 밀리므로 인라인 요약 제공 */}
      <div
        className="mt-8 rounded-radius-card border p-5 sm:p-6 lg:hidden"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <h3
          className="mb-4 flex items-center gap-2 font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span
            className="h-6 w-1.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: "var(--color-primary)" }}
          />
          대회 안내
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(tournament.city || tournament.venue_name) && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg" style={{ color: "var(--color-primary)" }}>location_on</span>
              <div>
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>장소</p>
                <p className="text-sm font-medium">{[tournament.city, tournament.venue_name].filter(Boolean).join(" ")}</p>
              </div>
            </div>
          )}
          {tournament.startDate && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg" style={{ color: "var(--color-primary)" }}>event</span>
              <div>
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>일시</p>
                <p className="text-sm font-medium">
                  {tournament.startDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                  {tournament.endDate && tournament.endDate.getTime() !== tournament.startDate.getTime() && (
                    <> ~ {tournament.endDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}</>
                  )}
                </p>
              </div>
            </div>
          )}
          {tournament.entry_fee && Number(tournament.entry_fee) > 0 && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg" style={{ color: "var(--color-primary)" }}>payments</span>
              <div>
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>참가비</p>
                <p className="text-sm font-medium">{Number(tournament.entry_fee).toLocaleString()}원</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg" style={{ color: "var(--color-primary)" }}>groups</span>
            <div>
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>참가팀</p>
              <p className="text-sm font-medium">
                {tournament._count.tournamentTeams}팀
                {tournament.maxTeams && <span style={{ color: "var(--color-text-secondary)" }}> / {tournament.maxTeams}팀</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 경기 + 순위 미리보기: Suspense로 스트리밍 */}
      <div className="mt-8">
        <Suspense fallback={<MatchesStandingsSkeleton />}>
          <MatchesAndStandings tournamentId={id} />
        </Suspense>
      </div>
    </>
  );

  // -- 일정 탭 콘텐츠 --
  const scheduleContent = (
    <div>
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">일정</h2>
      <ScheduleTimeline matches={scheduleMatches} teams={scheduleTeams} />
    </div>
  );

  // -- 순위 탭 콘텐츠: 미니멀 플랫 테이블 (외곽 border 제거, 행 구분은 얇은 하단선만) --
  const standingsContent = (
    <div>
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">순위표</h2>
      <table className="w-full text-sm">
        {/* 헤더: 배경 없이 작은 muted 텍스트 */}
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
          {standingsTeams.map((t, i) => {
            const total = (t.wins ?? 0) + (t.losses ?? 0);
            const pct = total > 0 ? ((t.wins ?? 0) / total).toFixed(3) : ".000";
            // 1~3위: 왼쪽 border-left 3px primary로 미세한 하이라이트
            const isTop3 = i < 3;
            return (
              <tr
                key={t.id.toString()}
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  borderLeft: isTop3 ? "3px solid var(--color-primary)" : "3px solid transparent",
                }}
              >
                <td className="px-3 py-2.5 text-sm font-bold" style={{ color: "var(--color-primary)" }}>{i + 1}</td>
                <td className="px-3 py-2.5 font-medium">{t.team.name}</td>
                <td className="px-3 py-2.5 text-center">{t.wins ?? 0}</td>
                <td className="px-3 py-2.5 text-center">{t.losses ?? 0}</td>
                <td className="px-3 py-2.5 text-center">{pct}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // -- 대진표 탭 콘텐츠 --
  const bracketContent = (
    <div>
      {/* 대시보드 헤더: 통계 4칸 */}
      <TournamentDashboardHeader
        tournamentName={tournament.name}
        totalTeams={bracketTournamentTeams.length}
        liveMatchCount={liveMatchCount}
        finalsDate={finalsDate}
      />

      {/* 조별리그 순위표 (데이터가 있을 때만) */}
      {groupTeams.length > 0 && <GroupStandings teams={groupTeams} />}

      {/* 대진표 트리 또는 빈 상태 */}
      {rounds.length > 0 ? (
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8">
            <BracketView rounds={rounds} tournamentId={id} />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <FinalsSidebar
              finalsDate={finalsDate}
              venueName={tournament.venue_name}
              city={tournament.city}
              entryFee={tournament.entry_fee ? Number(tournament.entry_fee) : null}
            />
          </div>
        </div>
      ) : (
        <BracketEmpty tournamentId={id} />
      )}
    </div>
  );

  // -- 참가팀 탭 콘텐츠: 얇은 하단 구분선 스타일 (두꺼운 카드 border 제거) --
  const teamsContent = (
    <div>
      <h2 className="mb-6 text-xl font-bold sm:text-2xl">참가팀</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {teamsWithPlayers.map((t) => (
          <div
            key={t.id.toString()}
            className="rounded-lg p-4"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="mb-3 flex items-center gap-3">
              {/* 팀 아이콘: primaryColor가 없으면 CSS 변수 사용 */}
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: t.team.primaryColor
                    ? `${t.team.primaryColor}20`
                    : "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                  color: t.team.primaryColor ?? "var(--color-primary)",
                }}
              >
                {t.team.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold">{t.team.name}</h3>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {t.groupName && `${t.groupName} · `}{t.players.length}명
                </p>
              </div>
            </div>
            <div className="space-y-1">
              {t.players.map((p) => (
                <div key={p.id.toString()} className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>#{p.jerseyNumber ?? "-"} {p.users?.nickname ?? "선수"}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{p.position ?? ""}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      {/* 히어로 섹션: 그라디언트 배경 + 배지 + 대회명 + 메타 */}
      <TournamentHero
        name={tournament.name}
        format={tournament.format}
        status={tournament.status}
        startDate={tournament.startDate}
        endDate={tournament.endDate}
        city={tournament.city}
        venueName={tournament.venue_name}
        teamCount={tournament._count.tournamentTeams}
        maxTeams={tournament.maxTeams}
      />

      {/* 2열 레이아웃: 좌측 본문(col-span-9) + 우측 사이드카드(col-span-3) — 사이드바 60% 축소 */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-8 lg:px-8">
        {/* 좌측 메인 콘텐츠: 탭 전환 컴포넌트 */}
        <div className="lg:col-span-9">
          <TournamentTabs
            overviewContent={overviewContent}
            scheduleContent={scheduleContent}
            standingsContent={standingsContent}
            bracketContent={bracketContent}
            teamsContent={teamsContent}
          />
        </div>

        {/* 우측 사이드바: 참가비 + CTA + 캘린더 (축소된 3컬럼) */}
        <div className="mt-8 lg:col-span-3 lg:mt-0">
          <TournamentSidebar
            tournamentId={id}
            entryFee={tournament.entry_fee ? Number(tournament.entry_fee) : null}
            isRegistrationOpen={isRegistrationOpen}
            isRegistrationSoon={isRegistrationSoon ?? false}
            regClose={regClose}
            name={tournament.name}
            startDate={tournament.startDate}
            endDate={tournament.endDate}
            venue={[tournament.city, tournament.venue_name].filter(Boolean).join(" ")}
            teamCount={tournament._count.tournamentTeams}
            maxTeams={tournament.maxTeams}
            divisions={divisions}
            allowWaitingList={tournament.allow_waiting_list}
            bankName={tournament.bank_name}
            bankAccount={tournament.bank_account}
            bankHolder={tournament.bank_holder}
          />
        </div>
      </div>
    </div>
  );
}
