import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { getPlayerStats } from "@/lib/services/user";
import { getProfileLevelInfo } from "@/lib/profile/gamification";

import { ProfileHero } from "@/components/profile/profile-hero";
import { RecentGames } from "@/components/profile/recent-games";
import { UserRadarSection } from "./_components/user-radar-section";
import { UserStatsSection } from "./_components/user-stats-section";
import { ActionButtons } from "./_components/action-buttons";

/**
 * 타인 프로필 페이지 (/users/[id]) — L2 통합 구현
 *
 * 왜:
 * - L2 본 설계 (Q1=A): 본인 프로필도 `/users/[id]`로 통합하되 isOwner 분기로 액션/편집 버튼만 교체.
 * - 서버 컴포넌트 유지 (Promise.all 7쿼리 유지).
 * - 티어 배지 제거(Q4): 경기수 기반 BRONZE/GOLD 등 제거 → 레벨(Lv.N) 배지로 통합.
 * - Teams 섹션 추가(Q7): 공개 팀만 카드 그리드로 렌더.
 * - gamification은 API 대신 getProfileLevelInfo 헬퍼 직접 호출 (snake_case 6회 재발 패턴 차단).
 *
 * 어떻게:
 * - session.sub와 user.id를 BigInt로 비교해 isOwner 판단.
 * - ProfileHero actionSlot으로 본인=편집 링크 / 타인=ActionButtons / 비로그인=미표시.
 * - 공용 컴포넌트(ProfileHero, RecentGames) 사용 → 인라인 JSX 제거.
 */

// 60초 ISR — 기존 동일
export const revalidate = 60;

// SEO: 닉네임 동적 메타
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user
    .findUnique({
      where: { id: BigInt(id) },
      select: { nickname: true, position: true },
    })
    .catch(() => null);
  if (!user) return { title: "선수 프로필 | MyBDR" };
  return {
    title: `${user.nickname || "선수"} 프로필 | MyBDR`,
    description: `${user.nickname || "선수"}의 경기 기록과 능력치를 확인하세요.`,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userIdBigInt = BigInt(id);

  // 로그인 세션 (팔로우 상태 조회 + isOwner 판정용)
  const session = await getWebSession();
  const isLoggedIn = !!session;
  // isOwner: 세션의 sub(문자열)를 BigInt로 변환해 target과 비교
  const isOwner = !!session && BigInt(session.sub) === userIdBigInt;

  // 병렬 쿼리 — 기존 7개 유지 + teamMembers include 확장 (team.is_public/logoUrl/city/status)
  const [
    user,
    statAgg,
    recentGames,
    playerStats,
    followRecord,
    followersCount,
    followingCount,
  ] = await Promise.all([
    // 1) 유저 기본 정보 + 공개 팀 필터용 필드 확장
    prisma.user
      .findUnique({
        where: { id: userIdBigInt },
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
          xp: true, // 레벨 배지 계산용
          createdAt: true,
          teamMembers: {
            where: { status: "active" },
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                  city: true,
                  district: true,
                  is_public: true,
                  status: true,
                  primaryColor: true,
                },
              },
            },
            orderBy: { joined_at: "desc" },
          },
        },
      })
      .catch(() => null),

    // 2) matchPlayerStat 집계 (레이더/시즌)
    prisma.matchPlayerStat
      .aggregate({
        where: {
          tournamentTeamPlayer: {
            userId: userIdBigInt,
          },
        },
        _avg: {
          points: true,
          total_rebounds: true,
          assists: true,
          steals: true,
          blocks: true,
        },
        _count: { id: true },
      })
      .catch(() => null),

    // 3) 최근 경기 5건 (개인 스탯 포함)
    prisma.matchPlayerStat
      .findMany({
        where: {
          tournamentTeamPlayer: {
            userId: userIdBigInt,
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
      })
      .catch(() => []),

    // 4) 승률 계산 (내 프로필과 동일 로직)
    getPlayerStats(userIdBigInt).catch(() => null),

    // 5) 팔로우 여부 (로그인 상태일 때만)
    session
      ? prisma.follows
          .findUnique({
            where: {
              follower_id_following_id: {
                follower_id: BigInt(session.sub),
                following_id: userIdBigInt,
              },
            },
          })
          .catch(() => null)
      : Promise.resolve(null),

    // 6) 팔로워 수
    prisma.follows
      .count({ where: { following_id: userIdBigInt } })
      .catch(() => 0),

    // 7) 팔로잉 수
    prisma.follows
      .count({ where: { follower_id: userIdBigInt } })
      .catch(() => 0),
  ]);

  if (!user) return notFound();

  const isFollowing = !!followRecord;

  // 스탯 집계 정리
  const avgPoints = statAgg?._avg?.points ?? 0;
  const avgRebounds = statAgg?._avg?.total_rebounds ?? 0;
  const avgAssists = statAgg?._avg?.assists ?? 0;
  const avgSteals = statAgg?._avg?.steals ?? 0;
  const avgBlocks = statAgg?._avg?.blocks ?? 0;
  const gamesPlayed = statAgg?._count?.id ?? 0;
  const hasStats = gamesPlayed > 0;

  // 레벨 배지 정보 (본인·타인 동일) — API 대신 헬퍼 직접 호출
  const levelInfo = getProfileLevelInfo(user.xp);

  // 최근 경기 → 공용 RecentGames 형태로 변환
  const recentGameRows = (recentGames ?? []).map((g) => ({
    gameTitle: g.tournamentMatch?.roundName ?? null,
    scheduledAt: g.tournamentMatch?.scheduledAt?.toISOString() ?? null,
    points: g.points ?? 0,
    assists: g.assists ?? 0,
    rebounds: g.total_rebounds ?? 0,
    steals: g.steals ?? 0,
  }));

  // 공개 팀 필터 (Q7): status="active" AND is_public !== false
  // is_public은 Boolean?(default true)라서 null/true 모두 공개로 간주, false만 제외
  const publicTeams = user.teamMembers
    .filter((tm) => {
      const t = tm.team;
      if (!t) return false;
      if (t.status !== "active") return false;
      if (t.is_public === false) return false;
      return true;
    })
    .map((tm) => tm.team);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ===== 1) 공용 Hero — actionSlot으로 본인/타인 분기 ===== */}
      <ProfileHero
        user={{
          id: user.id,
          name: user.name,
          nickname: user.nickname,
          profile_image_url: user.profile_image_url,
          position: user.position,
          city: user.city,
          district: user.district,
          height: user.height,
          bio: user.bio,
          total_games_participated: user.total_games_participated,
        }}
        stats={playerStats ? { winRate: playerStats.winRate ?? null } : null}
        levelInfo={levelInfo}
        followersCount={followersCount}
        followingCount={followingCount}
        actionSlot={
          // 본인: 편집 버튼 / 타인(로그인/비로그인): ActionButtons
          isOwner ? (
            <OwnerEditButton />
          ) : (
            <ActionButtons
              targetUserId={id}
              initialFollowed={isFollowing}
              isLoggedIn={isLoggedIn}
            />
          )
        }
      />

      {/* ===== 2) Teams 섹션 (Q7) — 공개 팀만 ===== */}
      {publicTeams.length > 0 && (
        <section
          className="rounded-lg border overflow-hidden"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
          }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h3
              className="font-bold text-lg"
              style={{ color: "var(--color-text-primary)" }}
            >
              소속 팀
            </h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {publicTeams.map((team) => (
              <Link
                key={team.id.toString()}
                href={`/teams/${team.id.toString()}`}
                className="flex items-center gap-3 rounded border p-3 transition-colors hover:opacity-80"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-card)",
                  borderRadius: "4px",
                }}
              >
                {/* 팀 로고: 이미지 있으면 표시, 없으면 primaryColor 기반 이니셜 원 */}
                <div
                  className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm"
                  style={{
                    backgroundColor:
                      team.primaryColor ?? "var(--color-primary)",
                    color: "var(--color-on-primary, #FFFFFF)",
                  }}
                >
                  {team.logoUrl ? (
                    <Image
                      src={team.logoUrl}
                      alt={team.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    team.name.trim()[0]?.toUpperCase() ?? "T"
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className="font-medium text-sm truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {team.name}
                  </p>
                  {(team.city || team.district) && (
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {[team.city, team.district].filter(Boolean).join(" ")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== 3) 스탯 섹션 (레이더 + 시즌 상세) — hasStats일 때만 ===== */}
      {hasStats && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UserRadarSection
            avgPoints={avgPoints}
            avgRebounds={avgRebounds}
            avgAssists={avgAssists}
            avgSteals={avgSteals}
            avgBlocks={avgBlocks}
          />
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

      {/* ===== 4) 공용 RecentGames (variant=table) ===== */}
      <RecentGames games={recentGameRows} variant="table" title="최근 경기 기록" />
    </div>
  );
}

/**
 * OwnerEditButton — 본인이 자기 프로필 볼 때 "프로필 편집" 버튼.
 * /profile/edit로 이동 (L2 설계: 편집 경로는 기존 /profile/edit 재활용).
 */
function OwnerEditButton() {
  return (
    <Link
      href="/profile/edit"
      className="inline-flex items-center gap-1.5 rounded border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--color-surface-bright,var(--color-surface))]"
      style={{
        borderColor: "var(--color-primary)",
        color: "var(--color-primary)",
        borderRadius: "4px",
      }}
    >
      <span className="material-symbols-outlined text-base">edit</span>
      프로필 편집
    </Link>
  );
}
