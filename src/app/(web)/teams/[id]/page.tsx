import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
// Phase 2C: 팀 상세 히어로에서 한/영 병기 표시
import { getTeamDisplayNames } from "@/lib/utils/team-display";
// Phase 3: 공식 기록 가드 (미래 경기 + NULL 날짜 제외)
import { officialMatchWhere } from "@/lib/tournaments/official-match";
// 팀장 전용 "팀 관리" 버튼 노출 여부 판단에 현재 로그인 세션 필요
import { getWebSession } from "@/lib/auth/web-session";
import { Breadcrumb } from "@/components/shared/breadcrumb";

// Phase 3 Teams 상세 v2 — 8개 컴포넌트 조립
import { TeamHeroV2 } from "./_components_v2/team-hero-v2";
import { TeamTabsV2, type TeamTabKey, TEAM_TAB_KEYS } from "./_components_v2/team-tabs-v2";
import { OverviewTabV2 } from "./_components_v2/overview-tab-v2";
import { RosterTabV2 } from "./_components_v2/roster-tab-v2";
import { RecentTabV2, computeRecentForm } from "./_components_v2/recent-tab-v2";
import { StatsTabV2 } from "./_components_v2/stats-tab-v2";
import { TeamSideCardV2 } from "./_components_v2/team-side-card-v2";

export const revalidate = 60;

// SEO: 팀 상세 동적 메타데이터 — 기존 유지
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id: BigInt(id) },
    select: { name: true, city: true },
  }).catch(() => null);
  if (!team) return { title: "팀 상세 | MyBDR" };
  const location = team.city ? ` (${team.city})` : "";
  return {
    title: `${team.name}${location} | MyBDR`,
    description: `${team.name} 팀의 로스터, 전적, 대회 이력을 확인하세요.`,
  };
}

// 팀 고유색 → 유효 accent 추출. 흰색/없음이면 BDR 네이비 fallback (기존 규칙 유지)
function resolveAccent(primary: string | null, secondary: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    if (!secondary || secondary.toLowerCase() === "#ffffff" || secondary.toLowerCase() === "#fff") {
      return "#1B3C87";
    }
    return secondary;
  }
  return primary;
}

// tag 추출 — 이유: Phase 3 Teams 목록(team-card-v2)과 동일 규칙으로 통일.
// 영문명 우선 → 없으면 한글명 첫 3글자. 모든 대문자.
function resolveTag(name: string, nameEn: string | null): string {
  const base = (nameEn && nameEn.trim()) || name.slice(0, 3);
  return base.trim().toUpperCase();
}

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  // v2 탭 키 4종(overview/roster/recent/stats). 알 수 없는 값이면 overview 폴백.
  const currentTab: TeamTabKey =
    (TEAM_TAB_KEYS as string[]).includes(tab ?? "")
      ? (tab as TeamTabKey)
      : "overview";

  // 팀 본조회 — 기존 include(teamMembers) 유지. memberCount 용.
  const team = await prisma.team.findUnique({
    where: { id: BigInt(id) },
    include: {
      teamMembers: {
        where: { status: "active" },
        include: { user: { select: { id: true, nickname: true, name: true } } },
        orderBy: [{ role: "asc" }],
      },
    },
  }).catch(() => null);
  if (!team) return notFound();

  // 기본 표시 데이터 준비
  const accent = resolveAccent(team.primaryColor, team.secondaryColor);
  const tag = resolveTag(team.name, team.name_en);
  const memberCount = team.teamMembers.length;
  // 시/구 조합 → 홈 코트 fallback (DB에 home_court 컬럼이 없기 때문)
  const location = [team.city, team.district].filter(Boolean).join(" ");
  const { primary: teamDisplayPrimary, secondary: teamDisplaySecondary } =
    getTeamDisplayNames(team.name, team.name_en, team.name_primary);

  // 이 팀의 TournamentTeam ID 목록
  const tournamentTeamIds = await prisma.tournamentTeam.findMany({
    where: { teamId: BigInt(id) },
    select: { id: true },
  });
  const ttIds = tournamentTeamIds.map((t) => t.id);

  // 이 팀이 참가한 공식 경기 → 승/패 집계 (기존 유지)
  const completedMatches = ttIds.length > 0 ? await prisma.tournamentMatch.findMany({
    where: officialMatchWhere({
      OR: [{ homeTeamId: { in: ttIds } }, { awayTeamId: { in: ttIds } }],
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    }),
    select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
  }) : [];

  let wins = 0, losses = 0;
  for (const m of completedMatches) {
    const isHome = ttIds.some((ttId) => ttId === m.homeTeamId);
    const myScore = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
    const oppScore = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
    if (myScore > oppScore) wins++;
    else losses++;
  }
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : null;

  // ===== Rating + Rank (v2 Hero / Overview 전용) =====
  // 이유: v2 시안은 "레이팅 N · 전체 N위"를 표시한다. rating 필드가 DB에 없으므로
  // Phase 3 Teams 목록과 동일한 규칙으로 **wins**를 레이팅 값으로 사용하고,
  // wins desc 전체 순위를 rank로 산출한다 (가짜 수치 생성 금지 원칙).
  // 최소 비용으로: wins > 이 팀의 wins 인 팀 수를 세서 +1 = rank.
  const rating = wins;
  const higherCount = await prisma.team.count({
    where: { wins: { gt: wins } },
  }).catch(() => 0);
  const teamRank = higherCount + 1;

  // ===== 최근 폼 5칸 (사이드 카드용) =====
  // 별도 쿼리이지만 recent-tab-v2와 중복 제거를 위해 유틸 함수화.
  const recentForm = await computeRecentForm(BigInt(id));

  // ===== 팀장 여부 (기존 규칙 유지) =====
  const session = await getWebSession();
  let isCaptain = false;
  if (session?.sub) {
    try {
      isCaptain = BigInt(session.sub) === team.captainId;
    } catch {
      isCaptain = false;
    }
  }

  // 팀장 닉네임 추출 — 사이드 카드 연락 영역 표시용
  const captainMember = team.teamMembers.find((m) => m.role === "captain");
  const captainName =
    captainMember?.user?.nickname ?? captainMember?.user?.name ?? null;

  // 창단 연도 — founded_year 우선, 없으면 created_at 연도
  const foundedYear =
    team.founded_year ??
    (team.createdAt ? new Date(team.createdAt).getFullYear() : null);

  // Hero 위 이미지 accent 의 ink(전경색) — 기본 흰색 유지 (충분한 대비 확보)
  const ink = "#FFFFFF";

  return (
    <div className="page page--wide">
      {/* 브레드크럼 — 기존 유지 */}
      <div style={{ marginBottom: 14 }}>
        <Breadcrumb
          items={[
            { label: "팀", href: "/teams" },
            { label: teamDisplayPrimary },
          ]}
        />
      </div>

      {/* 1) Hero — accent 카드형 블록 */}
      <TeamHeroV2
        accent={accent}
        ink={ink}
        tag={tag}
        teamName={teamDisplayPrimary}
        teamNameSecondary={teamDisplaySecondary}
        foundedYear={foundedYear}
        rating={rating}
        wins={wins}
        losses={losses}
        winRate={winRate}
        teamId={id}
        isCaptain={isCaptain}
      />

      {/* 2) Tabs — sticky 네비 */}
      <TeamTabsV2 teamId={id} currentTab={currentTab} />

      {/* ===== 본문: 좌측 탭 컨텐츠 + 우측 사이드 카드 =====
          시안 grid: `minmax(0,1fr) 320px` — PC 이상에서만 2열, 모바일은 스택 */}
      <div
        className="grid items-start gap-6 lg:gap-6"
        style={{
          gridTemplateColumns: "minmax(0, 1fr)",
        }}
      >
        <div className="lg:grid lg:items-start lg:gap-6"
             style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
          {/* 좌측: 탭별 컨텐츠 */}
          <div className="min-w-0">
            <Suspense
              fallback={
                <div
                  className="card"
                  style={{ padding: 40, textAlign: "center", color: "var(--ink-mute)" }}
                >
                  불러오는 중…
                </div>
              }
            >
              {currentTab === "overview" && (
                <OverviewTabV2
                  description={team.description}
                  foundedYear={foundedYear}
                  homeCourt={location}
                  rating={rating}
                  teamRank={teamRank}
                />
              )}
              {currentTab === "roster" && (
                <RosterTabV2 teamId={team.id} accent={accent} />
              )}
              {currentTab === "recent" && (
                <RecentTabV2 teamId={team.id} />
              )}
              {currentTab === "stats" && <StatsTabV2 />}
            </Suspense>
          </div>

          {/* 우측: 사이드 카드 (최근 폼 + 연락) — 모바일에선 본문 아래로 스택 */}
          <div className="mt-6 lg:mt-0">
            <TeamSideCardV2
              recentForm={recentForm}
              captainName={captainName}
            />
          </div>
        </div>
      </div>

      {/* 하단: 다른 팀 탐색 유도 — 기존 유지 */}
      <div style={{ marginTop: 32 }}>
        <Link
          href="/teams"
          className="btn"
          style={{ display: "inline-flex", gap: 6 }}
        >
          <span className="material-symbols-outlined text-base">groups</span>
          다른 팀 보기
        </Link>
      </div>
    </div>
  );
}
