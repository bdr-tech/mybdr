import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { UserRadarSection } from "./_components/user-radar-section";
import { UserStatsSection } from "./_components/user-stats-section";
import { UserRecentGames } from "./_components/user-recent-games";
import { ActionButtons } from "./_components/action-buttons";
// 내 프로필과 동일한 승률 계산 로직을 재사용
import { getPlayerStats } from "@/lib/services/user";
import { getWebSession } from "@/lib/auth/web-session";

/**
 * 타인 프로필 페이지 (/users/[id])
 *
 * 서버 컴포넌트 - prisma 직접 쿼리 유지
 * 기존 user 쿼리 유지 + matchPlayerStat 집계 추가 (Promise.all)
 *
 * 디자인 시안(bdr_2/4):
 * - 프로필 헤더: 아바타 + 티어 배지 + 이름 + 통계 4칸 + CTA 버튼
 * - 2열: 레이더 차트 + 시즌 상세 데이터
 * - 최근 경기 기록 테이블
 */

export const revalidate = 60;

// SEO: 유저 프로필 동적 메타데이터 — 닉네임을 DB에서 조회하여 title에 반영
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id: BigInt(id) },
    select: { nickname: true, position: true },
  }).catch(() => null);
  if (!user) return { title: "선수 프로필 | MyBDR" };
  return {
    title: `${user.nickname || "선수"} 프로필 | MyBDR`,
    description: `${user.nickname || "선수"}의 경기 기록과 능력치를 확인하세요.`,
  };
}

const POSITION_LABEL: Record<string, string> = {
  PG: "포인트가드",
  SG: "슈팅가드",
  SF: "스몰포워드",
  PF: "파워포워드",
  C: "센터",
};

/** 티어 배지 계산 - 총 경기수 기반 */
function getTierBadge(totalGames: number): { label: string; color: string } {
  if (totalGames >= 100) return { label: "PLATINUM", color: "var(--color-tertiary)" };
  if (totalGames >= 60) return { label: "GOLD", color: "var(--color-tier-gold)" };
  if (totalGames >= 30) return { label: "SILVER", color: "var(--color-tier-silver)" };
  if (totalGames >= 10) return { label: "BRONZE", color: "var(--color-tier-bronze)" };
  return { label: "ROOKIE", color: "var(--color-text-muted)" };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 로그인 유저 세션 확인 (팔로우 상태 조회용)
  const session = await getWebSession();
  const isLoggedIn = !!session;

  // 기존 user 쿼리 유지 + matchPlayerStat 집계 추가 (병렬 실행)
  // playerStats: 내 프로필과 동일한 서비스 함수로 승률(winRate) 계산
  // 팔로워/팔로잉 수 + 기존 쿼리를 병렬 실행
  const [user, statAgg, recentGames, playerStats, followRecord, followersCount, followingCount] = await Promise.all([
    // 1) 기존 유저 정보 쿼리 (유지)
    prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        name: true,
        nickname: true,
        position: true,
        height: true,
        city: true,
        district: true,
        bio: true,
        profile_image_url: true,
        total_games_participated: true,
        createdAt: true,
        teamMembers: {
          where: { status: "active" },
          include: {
            team: {
              select: { id: true, name: true, primaryColor: true, city: true },
            },
          },
          orderBy: { joined_at: "desc" },
        },
      },
    }).catch(() => null),

    // 2) 추가: matchPlayerStat 집계 쿼리 (레이더 차트 + 시즌 데이터용)
    prisma.matchPlayerStat.aggregate({
      where: {
        tournamentTeamPlayer: {
          userId: BigInt(id),
        },
      },
      _avg: {
        points: true,
        total_rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
      },
      _count: {
        id: true,
      },
    }).catch(() => null),

    // 3) 추가: 최근 경기 기록 (개인 스탯 포함)
    prisma.matchPlayerStat.findMany({
      where: {
        tournamentTeamPlayer: {
          userId: BigInt(id),
        },
      },
      select: {
        points: true,
        total_rebounds: true,
        assists: true,
        steals: true,
        tournamentMatch: {
          select: {
            roundName: true,
            scheduledAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }).catch(() => []),

    // 4) 승률 계산 - 내 프로필과 동일한 서비스 함수 재사용
    getPlayerStats(BigInt(id)).catch(() => null),

    // 5) 팔로우 여부 확인 (로그인 상태일 때만 실제 쿼리)
    session
      ? prisma.follows.findUnique({
          where: {
            follower_id_following_id: {
              follower_id: BigInt(session.sub),
              following_id: BigInt(id),
            },
          },
        }).catch(() => null)
      : Promise.resolve(null),

    // 6) 팔로워 수: 이 유저를 팔로우하는 사람 수
    prisma.follows.count({
      where: { following_id: BigInt(id) },
    }).catch(() => 0),

    // 7) 팔로잉 수: 이 유저가 팔로우하는 사람 수
    prisma.follows.count({
      where: { follower_id: BigInt(id) },
    }).catch(() => 0),
  ]);

  const isFollowing = !!followRecord;

  if (!user) return notFound();

  const displayName = user.nickname ?? user.name ?? "사용자";
  const initial = displayName.charAt(0).toUpperCase();
  const location = [user.city, user.district].filter(Boolean).join(" ");
  const totalGames = user.total_games_participated ?? 0;
  const tier = getTierBadge(totalGames);

  // 스탯 집계 데이터 정리
  const avgPoints = statAgg?._avg?.points ?? 0;
  const avgRebounds = statAgg?._avg?.total_rebounds ?? 0;
  const avgAssists = statAgg?._avg?.assists ?? 0;
  const avgSteals = statAgg?._avg?.steals ?? 0;
  const avgBlocks = statAgg?._avg?.blocks ?? 0;
  const gamesPlayed = statAgg?._count?.id ?? 0;
  const hasStats = gamesPlayed > 0;

  // 최근 경기 데이터 변환 (tournamentMatch의 roundName과 scheduledAt 사용)
  const recentGameRecords = (recentGames ?? []).map((g) => ({
    gameTitle: g.tournamentMatch?.roundName ?? null,
    scheduledAt: g.tournamentMatch?.scheduledAt?.toISOString() ?? null,
    points: g.points ?? 0,
    assists: g.assists ?? 0,
    rebounds: g.total_rebounds ?? 0,
    steals: g.steals ?? 0,
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ===== 프로필 헤더 섹션 (2열: 프로필 정보 + MVP 카드) ===== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* 좌측: 프로필 정보 카드 */}
        <div
          className="lg:col-span-8 rounded-lg p-6 relative overflow-hidden border"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
          }}
        >
          {/* 배경 장식: 빨강 원형 블러 */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"
            style={{ backgroundColor: "rgba(227, 27, 35, 0.05)" }}
          />

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* 아바타: 빨간 원형 테두리 */}
            <div
              className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 p-1 overflow-hidden flex-shrink-0"
              style={{
                borderColor: "var(--color-primary)",
                backgroundColor: "var(--color-background)",
              }}
            >
              {user.profile_image_url ? (
                <Image
                  src={user.profile_image_url}
                  alt={displayName}
                  width={144}
                  height={144}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div
                  className="w-full h-full rounded-full flex items-center justify-center text-4xl font-bold"
                  style={{
                    color: "var(--color-primary)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  {initial}
                </div>
              )}
            </div>

            {/* 이름 + 티어 + 포지션/지역 */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {displayName}
                </h1>
                {/* 티어 배지 */}
                <span
                  className="inline-flex items-center px-3 py-1 text-white text-xs font-bold rounded"
                  style={{ backgroundColor: tier.color }}
                >
                  {tier.label}
                </span>
              </div>

              {/* 메타 정보 */}
              <div
                className="mb-4 flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {location && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {location}
                  </span>
                )}
                {user.position && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">sports_basketball</span>
                    {user.position}
                    {POSITION_LABEL[user.position] ? ` (${POSITION_LABEL[user.position]})` : ""}
                  </span>
                )}
                {user.height && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">straighten</span>
                    {user.height}cm
                  </span>
                )}
              </div>

              {/* CTA 버튼: 메시지 + 팔로우 (클라이언트 컴포넌트로 분리) */}
              <ActionButtons
                targetUserId={id}
                initialFollowed={isFollowing}
                isLoggedIn={isLoggedIn}
              />
            </div>

            {/* 우측: 미니 통계 2x2 그리드 */}
            <div className="hidden xl:grid grid-cols-2 gap-3">
              <div
                className="p-3 rounded-lg text-center min-w-[90px]"
                style={{ backgroundColor: "var(--color-card)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>경기 수</p>
                <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {totalGames}
                </p>
              </div>
              <div
                className="p-3 rounded-lg text-center min-w-[90px]"
                style={{ backgroundColor: "var(--color-card)" }}
              >
                {/* 팔로워: 이 유저를 팔로우하는 사람 수 */}
                <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>팔로워</p>
                <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {followersCount}
                </p>
              </div>
              <div
                className="p-3 rounded-lg text-center min-w-[90px]"
                style={{ backgroundColor: "var(--color-card)" }}
              >
                {/* 승률: getPlayerStats 서비스로 계산 (내 프로필과 동일 로직) */}
                <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>승률</p>
                <p className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
                  {playerStats?.winRate != null ? `${playerStats.winRate}%` : "-%"}
                </p>
              </div>
              <div
                className="p-3 rounded-lg text-center min-w-[90px]"
                style={{ backgroundColor: "var(--color-card)" }}
              >
                {/* 팔로잉: 이 유저가 팔로우하는 사람 수 */}
                <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>팔로잉</p>
                <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {followingCount}
                </p>
              </div>
            </div>
          </div>

          {/* 바이오 */}
          {user.bio && (
            <p
              className="relative mt-5 border-t pt-4 text-sm leading-relaxed"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              {user.bio}
            </p>
          )}
        </div>

        {/* 우측: MVP 하이라이트 카드 (시즌 MVP는 DB에 없으므로 장식용) */}
        <div
          className="lg:col-span-4 rounded-lg p-6 flex flex-col items-center justify-center text-center border"
          style={{
            borderColor: "var(--color-border)",
            background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-background) 100%)",
          }}
        >
          <div
            className="w-20 h-20 mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <span
              className="material-symbols-outlined text-5xl text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">선수 하이라이트</h3>
          <p className="text-white/60 text-sm mb-4">
            {hasStats
              ? `총 ${gamesPlayed}경기에서 평균 ${avgPoints.toFixed(1)}점을 기록했습니다.`
              : "아직 경기 기록이 없습니다."}
          </p>
        </div>
      </section>

      {/* ===== 스탯 섹션 (2열: 레이더 차트 + 시즌 상세 데이터) ===== */}
      {hasStats && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 좌측: 레이더 차트 (1칸) */}
          <UserRadarSection
            avgPoints={avgPoints}
            avgRebounds={avgRebounds}
            avgAssists={avgAssists}
            avgSteals={avgSteals}
            avgBlocks={avgBlocks}
          />

          {/* 우측: 시즌 상세 데이터 (2칸) */}
          <div className="lg:col-span-2">
            <UserStatsSection
              avgPoints={avgPoints}
              avgAssists={avgAssists}
              avgRebounds={avgRebounds}
              avgSteals={avgSteals}
              gamesPlayed={gamesPlayed}
            />
          </div>
        </section>
      )}

      {/* ===== 최근 경기 기록 테이블 ===== */}
      <UserRecentGames games={recentGameRecords} />
    </div>
  );
}
